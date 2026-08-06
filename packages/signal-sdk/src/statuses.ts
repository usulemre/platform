/**
 * Shared Signal Engine status vocabularies, used identically across the
 * signal-engine service and its researcher-facing UI. Vocabulary only — no alpha
 * models, no statistics, no ML.
 */
export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type PromotionStatus = 'NOT_QUEUED' | 'QUEUED' | 'PROMOTED' | 'BLOCKED';

export type QualityGrade = 'PASS' | 'WARN' | 'FAIL';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'STALE' | 'UNKNOWN';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'DRIFTED' | 'ERROR';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** A signal is in the promotion queue when it is queued for promotion. */
export function isQueuedForPromotion(status: PromotionStatus): boolean {
  return status === 'QUEUED';
}

/** A signal is awaiting approval when any required approval is pending. */
export function isAwaitingApproval(status: ApprovalStatus): boolean {
  return status === 'PENDING';
}

/** Validation cleared. */
export function isValidated(status: ValidationStatus): boolean {
  return status === 'PASSED';
}
