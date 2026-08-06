/**
 * Shared Backtesting Engine status vocabularies + run-control predicates, used
 * identically across the backtesting service and its researcher-facing UI.
 * Vocabulary + pure predicates only — no simulation, no metrics, no optimization.
 */
export type RunStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** A run can be cancelled while it is queued, running or paused. */
export function canCancel(status: RunStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING' || status === 'PAUSED';
}

/** A run can be retried after it failed or was cancelled. */
export function canRetry(status: RunStatus): boolean {
  return status === 'FAILED' || status === 'CANCELLED';
}

/** A running run can be paused. */
export function canPause(status: RunStatus): boolean {
  return status === 'RUNNING';
}

/** A paused run can be resumed. */
export function canResume(status: RunStatus): boolean {
  return status === 'PAUSED';
}

/** Whether a run is actively in flight (queued, running or paused). */
export function isActiveRun(status: RunStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING' || status === 'PAUSED';
}
