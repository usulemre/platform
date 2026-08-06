/**
 * Infrastructure INTERFACES (ports) for the backtesting service. The application
 * and domain layers depend only on these abstractions; concrete adapters are
 * injected at composition time. NO implementation here: no storage, no cache, no
 * database, no broker, no simulation engine, no metric computation. Other
 * subsystems (Research Engine, Market Data Platform, Dataset/Experiment modules,
 * Feature Store, Signal Engine, Portfolio module, Validation Foundation, Workflow
 * Engine, Configuration Foundation, Event & Messaging Foundation) are reached
 * through these abstractions by reference only.
 */
import type { Backtest, BacktestComparison, BacktestFamily } from '@platform/backtesting-sdk';

/* ----------------------------- read models ----------------------------- */

export interface BacktestQueryPort {
  list(): Promise<readonly Backtest[]>;
  getById(id: string): Promise<Backtest | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly BacktestFamily[]>;
}

export interface ComparisonQueryPort {
  list(): Promise<readonly BacktestComparison[]>;
  getById(id: string): Promise<BacktestComparison | null>;
}

/* --------------------------- integration ports -------------------------- */

/** Market Data Platform — availability of the requested history window (ref only). */
export interface MarketDataPort {
  isWindowAvailable(datasetRef: string, startDate: string, endDate: string): Promise<boolean>;
}

/**
 * Simulation Runner — the boundary to the (external, elsewhere-implemented)
 * historical-simulation executor. This service NEVER simulates; it only schedules
 * and reflects run state through this port.
 */
export interface SimulationRunnerPort {
  enqueue(backtestId: string): Promise<void>;
  cancel(backtestId: string): Promise<void>;
  pause(backtestId: string): Promise<void>;
  resume(backtestId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a backtest cleared its validation gate. */
export interface ValidationPort {
  isValidated(backtestId: string): Promise<boolean>;
}

/** Workflow Engine — schedule configuration/validation/run/review/approval workflows. */
export interface WorkflowPort {
  scheduleRun(backtestId: string): Promise<void>;
  scheduleReview(backtestId: string): Promise<void>;
  scheduleApproval(backtestId: string): Promise<void>;
}

export interface BacktestEvent {
  readonly id: string;
  readonly backtestId: string;
  readonly type:
    | 'RUN_QUEUED'
    | 'RUN_CANCELLED'
    | 'RUN_RETRIED'
    | 'RUN_PAUSED'
    | 'RUN_RESUMED'
    | 'REVIEW_REQUESTED'
    | 'APPROVAL_REQUESTED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: BacktestEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
