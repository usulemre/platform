/**
 * Infrastructure INTERFACES (ports) for the execution-simulator service. The
 * application and domain layers depend only on these abstractions; concrete adapters
 * are injected at composition time. NO implementation here: no storage, no cache, no
 * database, no broker, no exchange, no FIX, no WebSocket, no execution algorithm, no
 * fill/price calculation. Other subsystems (Market Data Platform, Research Engine,
 * Signal Engine, Backtesting Engine, Portfolio Construction Engine, Risk Engine,
 * Validation Foundation, Workflow Engine, Configuration Foundation, Monitoring Module,
 * Audit Center, Notification Center) are reached through these abstractions by
 * reference only.
 */
import type {
  SimulationSession,
  SimulationComparison,
  SimulationFamily,
  ScenarioTemplate,
} from '@platform/execution-sdk';

/* ----------------------------- read models ----------------------------- */

export interface SessionQueryPort {
  list(): Promise<readonly SimulationSession[]>;
  getById(id: string): Promise<SimulationSession | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly SimulationFamily[]>;
}

export interface ComparisonQueryPort {
  list(): Promise<readonly SimulationComparison[]>;
  getById(id: string): Promise<SimulationComparison | null>;
}

export interface TemplateQueryPort {
  list(): Promise<readonly ScenarioTemplate[]>;
}

/* --------------------------- integration ports -------------------------- */

/** Market Data Platform — availability of the requested history window (ref only). */
export interface MarketDataPort {
  isWindowAvailable(datasetRef: string, startDate: string, endDate: string): Promise<boolean>;
}

/**
 * Simulation Runner — the boundary to the (external, elsewhere-implemented) paper-trading
 * simulator. This service NEVER simulates fills, NEVER contacts an exchange or broker,
 * and NEVER speaks FIX or WebSocket; it only schedules and reflects run state through
 * this port.
 */
export interface SimulatorPort {
  enqueue(sessionId: string): Promise<void>;
  cancel(sessionId: string): Promise<void>;
  pause(sessionId: string): Promise<void>;
  resume(sessionId: string): Promise<void>;
  replay(sessionId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a session cleared its validation gate. */
export interface ValidationPort {
  isValidated(sessionId: string): Promise<boolean>;
}

/** Workflow Engine — schedule run/review/approval/replay workflows. */
export interface WorkflowPort {
  scheduleRun(sessionId: string): Promise<void>;
  scheduleReview(sessionId: string): Promise<void>;
  scheduleApproval(sessionId: string): Promise<void>;
  scheduleReplay(sessionId: string): Promise<void>;
}

export interface ExecutionEvent {
  readonly id: string;
  readonly sessionId: string;
  readonly type:
    | 'RUN_QUEUED'
    | 'RUN_CANCELLED'
    | 'RUN_RETRIED'
    | 'RUN_PAUSED'
    | 'RUN_RESUMED'
    | 'REPLAY_REQUESTED'
    | 'REVIEW_REQUESTED'
    | 'APPROVAL_REQUESTED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: ExecutionEvent): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (append only; store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly sessionId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly sessionId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
