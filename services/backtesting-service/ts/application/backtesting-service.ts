/**
 * Backtesting application service — the orchestration surface of the canonical
 * Backtesting Engine. It coordinates the backtesting lifecycle (draft →
 * configuration → validation → queued → running → completed → review → approved →
 * archived), the run controls (cancel / retry / pause / resume), discovery/search,
 * catalog reads, the execution and approval queues, result comparison and report
 * access across the other subsystems (Market Data Platform, Simulation Runner,
 * Validation Foundation, Workflow Engine, Configuration Foundation, Event &
 * Messaging Foundation, and the dataset/feature/signal/experiment/portfolio
 * modules) through ports ONLY.
 *
 * It holds no infrastructure, no simulation engine, no performance-metric
 * computation, no optimization and no persistence. Search, aggregation, queue
 * selection, comparison assembly and version selection are pure domain decisions.
 * Validation verdicts and approvals are decided elsewhere (CP-5), and simulations
 * run elsewhere; this service only reflects and reroutes them.
 */
import {
  METRIC_CATALOG,
  type Backtest,
  type BacktestComparison,
  type BacktestFamily,
  type BacktestStage,
  type BacktestVersion,
  type MetricDescriptor,
} from '@platform/backtesting-sdk';
import {
  assembleComparison,
  approvalQueue,
  currentVersion,
  executionQueue,
  type AssembledComparison,
} from '../domain/derivations';
import { resolveByKey, searchBacktests, type BacktestSearch } from '../domain/discovery';
import {
  isCancellable,
  isPausable,
  isResumable,
  isRetryable,
  proposedNextStage,
} from '../domain/lifecycle';
import type {
  ComparisonQueryPort,
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  BacktestQueryPort,
  MarketDataPort,
  SimulationRunnerPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface BacktestingSummary {
  readonly totalBacktests: number;
  readonly running: number;
  readonly queued: number;
  readonly completed: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly families: number;
  readonly comparisons: number;
  readonly byStage: readonly { readonly stage: BacktestStage; readonly count: number }[];
}

export type RunControl = 'cancel' | 'retry' | 'pause' | 'resume';

export interface BacktestingServiceDeps {
  readonly backtests: BacktestQueryPort;
  readonly families: FamilyQueryPort;
  readonly comparisons: ComparisonQueryPort;
  readonly marketData: MarketDataPort;
  readonly runner: SimulationRunnerPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class BacktestingService {
  constructor(private readonly deps: BacktestingServiceDeps) {}

  /** Backtest Registry — every registered backtest. */
  listBacktests(): Promise<readonly Backtest[]> {
    return this.deps.backtests.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchBacktests(query: BacktestSearch = {}): Promise<readonly Backtest[]> {
    return searchBacktests(await this.deps.backtests.list(), query);
  }

  /** Backtest Details — resolve one backtest by id. */
  getBacktest(id: string): Promise<Backtest | null> {
    return this.deps.backtests.getById(id);
  }

  /** Resolve a backtest by its canonical `namespace/family/name` key. */
  async resolveBacktest(key: string): Promise<Backtest | null> {
    return resolveByKey(await this.deps.backtests.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<BacktestVersion | null> {
    const backtest = await this.deps.backtests.getById(id);
    return backtest ? currentVersion(backtest) : null;
  }

  /** The stage a backtest would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<BacktestStage | null> {
    const backtest = await this.deps.backtests.getById(id);
    return backtest ? proposedNextStage(backtest) : null;
  }

  /** Backtest Family browsing. */
  listFamilies(): Promise<readonly BacktestFamily[]> {
    return this.deps.families.list();
  }

  /** The Metric Catalog — descriptors only; nothing is computed. */
  metricCatalog(): readonly MetricDescriptor[] {
    return METRIC_CATALOG;
  }

  /** Backtest Queue — backtests with an active run (queued/running/paused). */
  async executionQueue(): Promise<readonly Backtest[]> {
    return executionQueue(await this.deps.backtests.list());
  }

  /** Backtests awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly Backtest[]> {
    return approvalQueue(await this.deps.backtests.list());
  }

  /** Backtest Comparisons. */
  listComparisons(): Promise<readonly BacktestComparison[]> {
    return this.deps.comparisons.list();
  }

  /** Assemble a comparison table by pulling each backtest's supplied metric values. */
  async getComparison(id: string): Promise<AssembledComparison | null> {
    const comparison = await this.deps.comparisons.getById(id);
    if (!comparison) return null;
    return assembleComparison(comparison, await this.deps.backtests.list());
  }

  /** Whether a backtest cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<BacktestingSummary> {
    const [backtests, families, comparisons] = await Promise.all([
      this.deps.backtests.list(),
      this.deps.families.list(),
      this.deps.comparisons.list(),
    ]);
    const stageCount = new Map<BacktestStage, number>();
    for (const backtest of backtests)
      stageCount.set(backtest.stage, (stageCount.get(backtest.stage) ?? 0) + 1);
    return {
      totalBacktests: backtests.length,
      running: backtests.filter((b) => b.run.status === 'RUNNING').length,
      queued: backtests.filter((b) => b.run.status === 'QUEUED').length,
      completed: backtests.filter(
        (b) =>
          b.stage === 'COMPLETED' ||
          b.stage === 'REVIEW' ||
          b.stage === 'APPROVED' ||
          b.stage === 'ARCHIVED',
      ).length,
      awaitingApproval: approvalQueue(backtests).length,
      failed: backtests.filter((b) => b.run.status === 'FAILED').length,
      families: families.length,
      comparisons: comparisons.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Schedule a backtest run. The simulation itself is executed by the external
   * Simulation Runner; this only enqueues and records the request.
   */
  async requestRun(backtestId: string, at: string): Promise<boolean> {
    const backtest = await this.deps.backtests.getById(backtestId);
    if (!backtest) return false;
    await this.deps.runner.enqueue(backtestId);
    await this.deps.workflow.scheduleRun(backtestId);
    await this.deps.bus.publish({
      id: `${backtestId}:RUN_QUEUED:${at}`,
      backtestId,
      type: 'RUN_QUEUED',
      message: `Run queued for ${backtest.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Apply a run control (cancel / retry / pause / resume). Returns false when the
   * control is not structurally permitted for the current run state or the
   * backtest is unknown. The actual state transition happens in the runner.
   */
  async controlRun(backtestId: string, control: RunControl, at: string): Promise<boolean> {
    const backtest = await this.deps.backtests.getById(backtestId);
    if (!backtest) return false;

    const allowed =
      (control === 'cancel' && isCancellable(backtest)) ||
      (control === 'retry' && isRetryable(backtest)) ||
      (control === 'pause' && isPausable(backtest)) ||
      (control === 'resume' && isResumable(backtest));
    if (!allowed) return false;

    if (control === 'cancel') await this.deps.runner.cancel(backtestId);
    else if (control === 'retry') await this.deps.runner.enqueue(backtestId);
    else if (control === 'pause') await this.deps.runner.pause(backtestId);
    else await this.deps.runner.resume(backtestId);

    const type =
      control === 'cancel'
        ? 'RUN_CANCELLED'
        : control === 'retry'
          ? 'RUN_RETRIED'
          : control === 'pause'
            ? 'RUN_PAUSED'
            : 'RUN_RESUMED';
    await this.deps.bus.publish({
      id: `${backtestId}:${type}:${at}`,
      backtestId,
      type,
      message: `${type} for ${backtest.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request an independent review (verdict decided by the reviewer). */
  async requestReview(backtestId: string, at: string): Promise<boolean> {
    const backtest = await this.deps.backtests.getById(backtestId);
    if (!backtest) return false;
    await this.deps.workflow.scheduleReview(backtestId);
    await this.deps.bus.publish({
      id: `${backtestId}:REVIEW_REQUESTED:${at}`,
      backtestId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${backtest.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance approval (the decision is made by accountable humans). */
  async requestApproval(backtestId: string, at: string): Promise<boolean> {
    const backtest = await this.deps.backtests.getById(backtestId);
    if (!backtest) return false;
    await this.deps.workflow.scheduleApproval(backtestId);
    await this.deps.bus.publish({
      id: `${backtestId}:APPROVAL_REQUESTED:${at}`,
      backtestId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${backtest.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
