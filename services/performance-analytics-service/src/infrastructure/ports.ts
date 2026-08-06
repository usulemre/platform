/**
 * Infrastructure INTERFACES (ports) for the performance-analytics service. The application
 * and domain layers depend only on these abstractions; concrete adapters are injected at
 * composition time. NO implementation here: no storage, no cache, no database, no broker, no
 * formulas, no metric calculation, no statistical algorithms. Other subsystems (Backtesting
 * Engine, Execution Simulator, Live Trading Platform, Portfolio Construction Engine, Research
 * Engine, Validation Foundation, Workflow Engine, Configuration Foundation, Monitoring
 * Module) are reached through these abstractions by reference only.
 */
import type {
  PerformanceReport,
  ReportFamily,
  PerformanceComparison,
  Benchmark,
} from '@platform/performance-sdk';

/* ----------------------------- read models ----------------------------- */

export interface ReportQueryPort {
  list(): Promise<readonly PerformanceReport[]>;
  getById(id: string): Promise<PerformanceReport | null>;
}

export interface FamilyQueryPort {
  list(): Promise<readonly ReportFamily[]>;
}

export interface ComparisonQueryPort {
  list(): Promise<readonly PerformanceComparison[]>;
  getById(id: string): Promise<PerformanceComparison | null>;
}

export interface BenchmarkQueryPort {
  list(): Promise<readonly Benchmark[]>;
}

/* --------------------------- integration ports -------------------------- */

/**
 * Analytics Runtime — the boundary to the (external, elsewhere-implemented) analytics
 * runtime that COMPUTES metric values, series and benchmark statistics. This service NEVER
 * computes a metric, evaluates a formula or runs a statistical algorithm; it only requests
 * computation and reflects the supplied results through this port.
 */
export interface AnalyticsRuntimePort {
  requestComputation(reportId: string): Promise<void>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a report cleared its validation gate. */
export interface ValidationPort {
  isValidated(reportId: string): Promise<boolean>;
}

/** Workflow Engine — schedule computation/review/approval workflows. */
export interface WorkflowPort {
  scheduleComputation(reportId: string): Promise<void>;
  scheduleReview(reportId: string): Promise<void>;
  scheduleApproval(reportId: string): Promise<void>;
}

export interface AnalyticsEvent {
  readonly id: string;
  readonly reportId: string;
  readonly type: 'COMPUTATION_REQUESTED' | 'REVIEW_REQUESTED' | 'APPROVAL_REQUESTED';
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: AnalyticsEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
