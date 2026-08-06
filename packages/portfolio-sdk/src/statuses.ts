/**
 * Shared Portfolio Construction Engine status vocabularies + optimization-control
 * predicates, used identically across the portfolio-construction service and its
 * researcher-facing UI. Vocabulary + pure predicates only — no optimization, no
 * weight calculation, no risk computation.
 */
export type OptimizationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** A declared constraint's evaluation status (evaluated elsewhere; inert here). */
export type ConstraintStatus = 'SATISFIED' | 'VIOLATED' | 'NOT_EVALUATED';

/** An optimization request can be cancelled while it is queued or running. */
export function canCancel(status: OptimizationStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING';
}

/** An optimization request can be retried after it failed or was cancelled. */
export function canRetry(status: OptimizationStatus): boolean {
  return status === 'FAILED' || status === 'CANCELLED';
}

/** Whether an optimization request is actively in flight (queued or running). */
export function isActiveOptimization(status: OptimizationStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING';
}
