/**
 * Execution-simulator application service — the orchestration surface of the canonical
 * Execution Simulator. It coordinates the simulation lifecycle (draft → scenario
 * configuration → validation → queued → running → completed → review → approved →
 * archived), the run controls (pause / resume / retry / cancel / replay),
 * discovery/search, registry reads, the execution / review / approval queues, the
 * simulation history, template access, comparison and report access across the other
 * subsystems (Market Data Platform, Simulation Runner, Validation Foundation, Workflow
 * Engine, Configuration Foundation, Event & Messaging Foundation, Audit Center,
 * Notification Center) through ports ONLY.
 *
 * It holds no infrastructure, no execution algorithm, no exchange/broker connectivity,
 * no FIX, no WebSocket, no fill/price/PnL computation and no persistence. Search,
 * aggregation, queue selection, comparison assembly and version selection are pure
 * domain decisions. Validation verdicts and approvals are decided elsewhere (CP-5), and
 * simulations run in the simulator; this service only reflects and reroutes them.
 */
import {
  METRIC_CATALOG,
  type MetricDescriptor,
  type ScenarioTemplate,
  type SimulationComparison,
  type SimulationFamily,
  type SimulationSession,
  type SimulationStage,
  type ExecutionVersion,
} from '@platform/execution-sdk';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  executionQueue,
  history,
  reviewQueue,
  type AssembledComparison,
} from '../domain/derivations';
import { resolveByKey, searchSessions, type SessionSearch } from '../domain/discovery';
import {
  isCancellable,
  isPausable,
  isReplayable,
  isResumable,
  isRetryable,
  proposedNextStage,
} from '../domain/lifecycle';
import type {
  AuditPort,
  ComparisonQueryPort,
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  MarketDataPort,
  NotificationPort,
  SessionQueryPort,
  SimulatorPort,
  TemplateQueryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface ExecutionSimulatorSummary {
  readonly totalSessions: number;
  readonly running: number;
  readonly queued: number;
  readonly completed: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly families: number;
  readonly templates: number;
  readonly comparisons: number;
  readonly byStage: readonly { readonly stage: SimulationStage; readonly count: number }[];
}

export type RunControl = 'pause' | 'resume' | 'retry' | 'cancel';

export interface ExecutionSimulatorServiceDeps {
  readonly sessions: SessionQueryPort;
  readonly families: FamilyQueryPort;
  readonly comparisons: ComparisonQueryPort;
  readonly templates: TemplateQueryPort;
  readonly marketData: MarketDataPort;
  readonly simulator: SimulatorPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly config: ConfigurationPort;
}

export class ExecutionSimulatorService {
  constructor(private readonly deps: ExecutionSimulatorServiceDeps) {}

  /** Simulation Sessions — every registered session. */
  listSessions(): Promise<readonly SimulationSession[]> {
    return this.deps.sessions.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchSessions(query: SessionSearch = {}): Promise<readonly SimulationSession[]> {
    return searchSessions(await this.deps.sessions.list(), query);
  }

  /** Session Details — resolve one session by id. */
  getSession(id: string): Promise<SimulationSession | null> {
    return this.deps.sessions.getById(id);
  }

  /** Resolve a session by its canonical `namespace/family/name` key. */
  async resolveSession(key: string): Promise<SimulationSession | null> {
    return resolveByKey(await this.deps.sessions.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<ExecutionVersion | null> {
    const session = await this.deps.sessions.getById(id);
    return session ? currentVersion(session) : null;
  }

  /** The stage a session would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<SimulationStage | null> {
    const session = await this.deps.sessions.getById(id);
    return session ? proposedNextStage(session) : null;
  }

  /** Simulation family browsing. */
  listFamilies(): Promise<readonly SimulationFamily[]> {
    return this.deps.families.list();
  }

  /** Scenario Templates. */
  listTemplates(): Promise<readonly ScenarioTemplate[]> {
    return this.deps.templates.list();
  }

  /** The metric catalog — descriptors only; nothing is computed. */
  metricCatalog(): readonly MetricDescriptor[] {
    return METRIC_CATALOG;
  }

  /** Execution queue — sessions with an active run (queued/running/paused). */
  async executionQueue(): Promise<readonly SimulationSession[]> {
    return executionQueue(await this.deps.sessions.list());
  }

  /** Review queue — sessions in a review stage. */
  async reviewQueue(): Promise<readonly SimulationSession[]> {
    return reviewQueue(await this.deps.sessions.list());
  }

  /** Sessions awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly SimulationSession[]> {
    return approvalQueue(await this.deps.sessions.list());
  }

  /** Simulation History — completed / archived sessions. */
  async history(): Promise<readonly SimulationSession[]> {
    return history(await this.deps.sessions.list());
  }

  /** Simulation comparisons. */
  listComparisons(): Promise<readonly SimulationComparison[]> {
    return this.deps.comparisons.list();
  }

  /** Assemble a comparison table by pulling each session's supplied metric values. */
  async getComparison(id: string): Promise<AssembledComparison | null> {
    const comparison = await this.deps.comparisons.getById(id);
    if (!comparison) return null;
    return assembleComparison(comparison, await this.deps.sessions.list());
  }

  /** Whether a session cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<ExecutionSimulatorSummary> {
    const [sessions, families, comparisons, templates] = await Promise.all([
      this.deps.sessions.list(),
      this.deps.families.list(),
      this.deps.comparisons.list(),
      this.deps.templates.list(),
    ]);
    const stageCount = new Map<SimulationStage, number>();
    for (const session of sessions)
      stageCount.set(session.stage, (stageCount.get(session.stage) ?? 0) + 1);
    return {
      totalSessions: sessions.length,
      running: sessions.filter((s) => s.run.status === 'RUNNING').length,
      queued: sessions.filter((s) => s.run.status === 'QUEUED').length,
      completed: sessions.filter(
        (s) =>
          s.stage === 'COMPLETED' ||
          s.stage === 'REVIEW' ||
          s.stage === 'APPROVED' ||
          s.stage === 'ARCHIVED',
      ).length,
      awaitingApproval: approvalQueue(sessions).length,
      failed: sessions.filter((s) => s.run.status === 'FAILED').length,
      families: families.length,
      templates: templates.length,
      comparisons: comparisons.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Schedule a simulation run. The simulation itself is executed by the external
   * Simulation Runner; this only enqueues and records the request. It never contacts an
   * exchange or broker.
   */
  async requestRun(sessionId: string, at: string): Promise<boolean> {
    const session = await this.deps.sessions.getById(sessionId);
    if (!session) return false;
    await this.deps.simulator.enqueue(sessionId);
    await this.deps.workflow.scheduleRun(sessionId);
    await this.deps.audit.record({
      sessionId,
      actor: 'execution-simulator',
      action: 'RUN_QUEUED',
      at,
    });
    await this.deps.bus.publish({
      id: `${sessionId}:RUN_QUEUED:${at}`,
      sessionId,
      type: 'RUN_QUEUED',
      message: `Run queued for ${session.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Apply a run control (pause / resume / retry / cancel). Returns false when the
   * control is not structurally permitted for the current run state or the session is
   * unknown. The actual state transition happens in the simulator.
   */
  async controlRun(sessionId: string, control: RunControl, at: string): Promise<boolean> {
    const session = await this.deps.sessions.getById(sessionId);
    if (!session) return false;

    const allowed =
      (control === 'cancel' && isCancellable(session)) ||
      (control === 'retry' && isRetryable(session)) ||
      (control === 'pause' && isPausable(session)) ||
      (control === 'resume' && isResumable(session));
    if (!allowed) return false;

    if (control === 'cancel') await this.deps.simulator.cancel(sessionId);
    else if (control === 'retry') await this.deps.simulator.enqueue(sessionId);
    else if (control === 'pause') await this.deps.simulator.pause(sessionId);
    else await this.deps.simulator.resume(sessionId);

    const type =
      control === 'cancel'
        ? 'RUN_CANCELLED'
        : control === 'retry'
          ? 'RUN_RETRIED'
          : control === 'pause'
            ? 'RUN_PAUSED'
            : 'RUN_RESUMED';
    await this.deps.audit.record({ sessionId, actor: 'execution-simulator', action: type, at });
    await this.deps.bus.publish({
      id: `${sessionId}:${type}:${at}`,
      sessionId,
      type,
      message: `${type} for ${session.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request a deterministic replay of a completed session (re-simulated elsewhere). */
  async requestReplay(sessionId: string, at: string): Promise<boolean> {
    const session = await this.deps.sessions.getById(sessionId);
    if (!session) return false;
    if (!isReplayable(session)) return false;
    await this.deps.simulator.replay(sessionId);
    await this.deps.workflow.scheduleReplay(sessionId);
    await this.deps.audit.record({
      sessionId,
      actor: 'execution-simulator',
      action: 'REPLAY_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${sessionId}:REPLAY_REQUESTED:${at}`,
      sessionId,
      type: 'REPLAY_REQUESTED',
      message: `Replay requested for ${session.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request an independent review (verdict decided by the reviewer). */
  async requestReview(sessionId: string, at: string): Promise<boolean> {
    const session = await this.deps.sessions.getById(sessionId);
    if (!session) return false;
    await this.deps.workflow.scheduleReview(sessionId);
    await this.deps.audit.record({
      sessionId,
      actor: 'execution-simulator',
      action: 'REVIEW_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${sessionId}:REVIEW_REQUESTED:${at}`,
      sessionId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${session.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance approval (the decision is made by accountable humans). */
  async requestApproval(sessionId: string, at: string): Promise<boolean> {
    const session = await this.deps.sessions.getById(sessionId);
    if (!session) return false;
    await this.deps.workflow.scheduleApproval(sessionId);
    await this.deps.notifications.notify({
      sessionId,
      channel: 'execution-governance',
      summary: `Approval requested for ${session.name}.`,
    });
    await this.deps.audit.record({
      sessionId,
      actor: 'execution-simulator',
      action: 'APPROVAL_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${sessionId}:APPROVAL_REQUESTED:${at}`,
      sessionId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${session.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
