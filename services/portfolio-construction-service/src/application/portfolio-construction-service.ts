/**
 * Portfolio-construction application service — the orchestration surface of the
 * canonical Portfolio Construction Engine. It coordinates the portfolio lifecycle
 * (draft → signal selection → constraint definition → allocation configuration →
 * optimization request → validation → review → approval → published → archived), the
 * optimization-request controls (cancel / retry), rebalancing requests,
 * discovery/search, registry reads, the optimization and approval queues, portfolio
 * comparison and template access across the other subsystems (Market Data Platform,
 * external Optimizer, Risk module, Validation Foundation, Workflow Engine,
 * Configuration Foundation, Event & Messaging Foundation, and the
 * signal/strategy/feature/dataset/backtest/experiment modules) through ports ONLY.
 *
 * It holds no infrastructure, no optimizer, no weight calculation, no risk
 * computation and no persistence. Search, aggregation, queue selection, comparison
 * assembly and version selection are pure domain decisions. Validation verdicts,
 * risk assessments and approvals are decided elsewhere (CP-5), and optimization runs
 * elsewhere; this service only reflects and reroutes them.
 */
import {
  METRIC_CATALOG,
  type Portfolio,
  type PortfolioComparison,
  type PortfolioFamily,
  type PortfolioStage,
  type PortfolioTemplate,
  type PortfolioVersion,
  type MetricDescriptor,
} from '@platform/portfolio-sdk';
import {
  assembleComparison,
  approvalQueue,
  currentVersion,
  optimizationQueue,
  type AssembledComparison,
} from '../domain/derivations';
import { resolveByKey, searchPortfolios, type PortfolioSearch } from '../domain/discovery';
import {
  isOptimizationCancellable,
  isOptimizationRetryable,
  proposedNextStage,
} from '../domain/lifecycle';
import type {
  ComparisonQueryPort,
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  MarketDataPort,
  OptimizerPort,
  PortfolioQueryPort,
  RiskPort,
  TemplateQueryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface PortfolioConstructionSummary {
  readonly totalPortfolios: number;
  readonly optimizing: number;
  readonly published: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly families: number;
  readonly templates: number;
  readonly comparisons: number;
  readonly byStage: readonly { readonly stage: PortfolioStage; readonly count: number }[];
}

export type OptimizationControl = 'cancel' | 'retry';

export interface PortfolioConstructionServiceDeps {
  readonly portfolios: PortfolioQueryPort;
  readonly families: FamilyQueryPort;
  readonly comparisons: ComparisonQueryPort;
  readonly templates: TemplateQueryPort;
  readonly marketData: MarketDataPort;
  readonly optimizer: OptimizerPort;
  readonly risk: RiskPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class PortfolioConstructionService {
  constructor(private readonly deps: PortfolioConstructionServiceDeps) {}

  /** Portfolio Registry — every registered portfolio definition. */
  listPortfolios(): Promise<readonly Portfolio[]> {
    return this.deps.portfolios.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchPortfolios(query: PortfolioSearch = {}): Promise<readonly Portfolio[]> {
    return searchPortfolios(await this.deps.portfolios.list(), query);
  }

  /** Portfolio Details — resolve one portfolio by id. */
  getPortfolio(id: string): Promise<Portfolio | null> {
    return this.deps.portfolios.getById(id);
  }

  /** Resolve a portfolio by its canonical `namespace/family/name` key. */
  async resolvePortfolio(key: string): Promise<Portfolio | null> {
    return resolveByKey(await this.deps.portfolios.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<PortfolioVersion | null> {
    const portfolio = await this.deps.portfolios.getById(id);
    return portfolio ? currentVersion(portfolio) : null;
  }

  /** The stage a portfolio would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<PortfolioStage | null> {
    const portfolio = await this.deps.portfolios.getById(id);
    return portfolio ? proposedNextStage(portfolio) : null;
  }

  /** Portfolio Family browsing. */
  listFamilies(): Promise<readonly PortfolioFamily[]> {
    return this.deps.families.list();
  }

  /** Portfolio Templates. */
  listTemplates(): Promise<readonly PortfolioTemplate[]> {
    return this.deps.templates.list();
  }

  /** The Metric Catalog — descriptors only; nothing is computed. */
  metricCatalog(): readonly MetricDescriptor[] {
    return METRIC_CATALOG;
  }

  /** Optimization queue — portfolios with an active optimization request (queued/running). */
  async optimizationQueue(): Promise<readonly Portfolio[]> {
    return optimizationQueue(await this.deps.portfolios.list());
  }

  /** Portfolios awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly Portfolio[]> {
    return approvalQueue(await this.deps.portfolios.list());
  }

  /** Portfolio Comparisons. */
  listComparisons(): Promise<readonly PortfolioComparison[]> {
    return this.deps.comparisons.list();
  }

  /** Assemble a comparison table by pulling each portfolio's supplied metric values. */
  async getComparison(id: string): Promise<AssembledComparison | null> {
    const comparison = await this.deps.comparisons.getById(id);
    if (!comparison) return null;
    return assembleComparison(comparison, await this.deps.portfolios.list());
  }

  /** Whether a portfolio cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  /** Whether a portfolio cleared its risk assessment (decided by the Risk module). */
  isRiskCleared(id: string): Promise<boolean> {
    return this.deps.risk.isRiskCleared(id);
  }

  async getSummary(): Promise<PortfolioConstructionSummary> {
    const [portfolios, families, comparisons, templates] = await Promise.all([
      this.deps.portfolios.list(),
      this.deps.families.list(),
      this.deps.comparisons.list(),
      this.deps.templates.list(),
    ]);
    const stageCount = new Map<PortfolioStage, number>();
    for (const portfolio of portfolios)
      stageCount.set(portfolio.stage, (stageCount.get(portfolio.stage) ?? 0) + 1);
    return {
      totalPortfolios: portfolios.length,
      optimizing: portfolios.filter(
        (p) => p.optimization.status === 'RUNNING' || p.optimization.status === 'QUEUED',
      ).length,
      published: portfolios.filter((p) => p.stage === 'PUBLISHED' || p.stage === 'ARCHIVED').length,
      awaitingApproval: approvalQueue(portfolios).length,
      failed: portfolios.filter((p) => p.optimization.status === 'FAILED').length,
      families: families.length,
      templates: templates.length,
      comparisons: comparisons.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Request portfolio optimization. The optimization itself is executed by the
   * external Optimizer; this only requests it and records the request.
   */
  async requestOptimization(portfolioId: string, at: string): Promise<boolean> {
    const portfolio = await this.deps.portfolios.getById(portfolioId);
    if (!portfolio) return false;
    await this.deps.optimizer.requestOptimization(portfolioId);
    await this.deps.workflow.scheduleOptimization(portfolioId);
    await this.deps.bus.publish({
      id: `${portfolioId}:OPTIMIZATION_REQUESTED:${at}`,
      portfolioId,
      type: 'OPTIMIZATION_REQUESTED',
      message: `Optimization requested for ${portfolio.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Apply an optimization-request control (cancel / retry). Returns false when the
   * control is not structurally permitted for the current request state or the
   * portfolio is unknown. The actual state transition happens in the optimizer.
   */
  async controlOptimization(
    portfolioId: string,
    control: OptimizationControl,
    at: string,
  ): Promise<boolean> {
    const portfolio = await this.deps.portfolios.getById(portfolioId);
    if (!portfolio) return false;

    const allowed =
      (control === 'cancel' && isOptimizationCancellable(portfolio)) ||
      (control === 'retry' && isOptimizationRetryable(portfolio));
    if (!allowed) return false;

    if (control === 'cancel') await this.deps.optimizer.cancelOptimization(portfolioId);
    else await this.deps.optimizer.requestOptimization(portfolioId);

    const type = control === 'cancel' ? 'OPTIMIZATION_CANCELLED' : 'OPTIMIZATION_RETRIED';
    await this.deps.bus.publish({
      id: `${portfolioId}:${type}:${at}`,
      portfolioId,
      type,
      message: `${type} for ${portfolio.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request an independent review (verdict decided by the reviewer). */
  async requestReview(portfolioId: string, at: string): Promise<boolean> {
    const portfolio = await this.deps.portfolios.getById(portfolioId);
    if (!portfolio) return false;
    await this.deps.workflow.scheduleReview(portfolioId);
    await this.deps.bus.publish({
      id: `${portfolioId}:REVIEW_REQUESTED:${at}`,
      portfolioId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${portfolio.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance approval (the decision is made by accountable humans). */
  async requestApproval(portfolioId: string, at: string): Promise<boolean> {
    const portfolio = await this.deps.portfolios.getById(portfolioId);
    if (!portfolio) return false;
    await this.deps.workflow.scheduleApproval(portfolioId);
    await this.deps.bus.publish({
      id: `${portfolioId}:APPROVAL_REQUESTED:${at}`,
      portfolioId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${portfolio.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request a rebalance (recomputation runs elsewhere; this only schedules it). */
  async requestRebalance(portfolioId: string, at: string): Promise<boolean> {
    const portfolio = await this.deps.portfolios.getById(portfolioId);
    if (!portfolio) return false;
    await this.deps.workflow.scheduleRebalance(portfolioId);
    await this.deps.bus.publish({
      id: `${portfolioId}:REBALANCE_REQUESTED:${at}`,
      portfolioId,
      type: 'REBALANCE_REQUESTED',
      message: `Rebalance requested for ${portfolio.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
