/**
 * Shared Risk Engine status vocabularies + pure governance predicates, used
 * identically across the risk-engine service and its UIs. Vocabulary + pure
 * predicates only — no VaR, no CVaR, no stress testing, no exposure calculation.
 */
export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** Compliance status of a policy or rule (evaluated elsewhere; inert here). */
export type RuleStatus = 'COMPLIANT' | 'BREACH' | 'WARNING' | 'NOT_EVALUATED';

/** Utilization status of a limit (evaluated elsewhere; inert here). */
export type LimitStatus = 'WITHIN' | 'BREACHED' | 'WARNING' | 'NOT_EVALUATED';

/** Disposition of a risk exception. */
export type ExceptionStatus = 'OPEN' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

/** Status of a risk override. */
export type OverrideStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

/** The reflected overall risk decision (decided elsewhere; surfaced here). */
export type RiskDecision = 'CLEARED' | 'BLOCKED' | 'CONDITIONAL' | 'PENDING';

/** Whether a rule/policy is in a breaching state. */
export function isBreach(status: RuleStatus): boolean {
  return status === 'BREACH';
}

/** Whether a limit is breached. */
export function isLimitBreached(status: LimitStatus): boolean {
  return status === 'BREACHED';
}

/** Whether an exception is still open (awaiting disposition). */
export function isExceptionOpen(status: ExceptionStatus): boolean {
  return status === 'OPEN';
}

/** Whether an override is currently active. */
export function isOverrideActive(status: OverrideStatus): boolean {
  return status === 'ACTIVE';
}
