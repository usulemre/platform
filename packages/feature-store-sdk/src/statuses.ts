/**
 * Shared Feature Store status vocabularies, used identically across the
 * feature-store service and its researcher-facing UI. Vocabulary only — no
 * feature calculations, no statistics.
 */
export type FeatureLifecycleStatus = 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'DEPRECATED' | 'RETIRED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type QualityGrade = 'PASS' | 'WARN' | 'FAIL';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'STALE' | 'UNKNOWN';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'DRIFTED' | 'ERROR';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** A feature that may be consumed by downstream research/production. */
export function isConsumable(status: FeatureLifecycleStatus): boolean {
  return status === 'APPROVED' || status === 'DEPRECATED';
}

/** A feature that is the current recommended version. */
export function isCurrent(status: FeatureLifecycleStatus): boolean {
  return status === 'APPROVED';
}
