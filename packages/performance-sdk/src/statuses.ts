/**
 * Shared Performance Analytics Engine status vocabularies, used identically across the
 * performance-analytics service and its UIs. Vocabulary + pure predicates only — NO
 * formulas, NO metric calculation, NO statistical algorithms.
 */
export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** The computation state of a report's metric set (computed elsewhere; reflected here). */
export type ComputationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/** The subject a performance report evaluates. */
export type SubjectKind = 'STRATEGY' | 'PORTFOLIO' | 'BACKTEST' | 'LIVE_SESSION' | 'SIMULATION';

/** Whether a report's metrics are ready (computation completed). */
export function isComputed(status: ComputationStatus): boolean {
  return status === 'COMPLETED';
}

/** Whether a report is awaiting a governance approval decision. */
export function isAwaitingApproval(status: ApprovalStatus): boolean {
  return status === 'PENDING';
}
