/**
 * Pure Risk Engine lifecycle + governance rules. Deterministic, no IO, no VaR/CVaR, no
 * exposure calculation. These describe *whether* a governed transition or control is
 * structurally permitted; the transition and the decision itself happen elsewhere
 * (Validation Foundation, Workflow Engine, governance — CP-5), never here.
 */
import {
  canRevalidate,
  isExceptionOpen,
  isOverrideActive,
  nextStage,
  type ApprovalStatus,
  type RiskAssessment,
  type RiskStage,
} from '@platform/risk-sdk';

/** The stage an assessment would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(assessment: RiskAssessment): RiskStage | null {
  return nextStage(assessment.stage);
}

/** Whether the assessment may be revalidated (structural — the run happens elsewhere). */
export function isRevalidatable(assessment: RiskAssessment): boolean {
  return canRevalidate(assessment.stage);
}

/** Whether a raise-exception action is structurally permitted (non-terminal, past draft). */
export function canRaiseException(assessment: RiskAssessment): boolean {
  return assessment.stage !== 'DRAFT' && assessment.stage !== 'ARCHIVED';
}

/** Whether an override may be recorded (only where a breach or open exception exists). */
export function canRecordOverride(assessment: RiskAssessment): boolean {
  if (assessment.stage === 'ARCHIVED') return false;
  const hasBreach =
    assessment.rules.some((rule) => rule.status === 'BREACH') ||
    assessment.limits.some((limit) => limit.status === 'BREACHED');
  return hasBreach || hasOpenExceptions(assessment);
}

/** Whether an assessment is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(assessment: RiskAssessment): boolean {
  return assessment.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether an assessment has an open (pending or changes-requested) review. */
export function hasOpenReview(assessment: RiskAssessment): boolean {
  return assessment.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** Whether an assessment has any open (undispositioned) exceptions. */
export function hasOpenExceptions(assessment: RiskAssessment): boolean {
  return assessment.exceptions.some((exception) => isExceptionOpen(exception.status));
}

/** Whether an assessment has any active human override. */
export function hasActiveOverride(assessment: RiskAssessment): boolean {
  return assessment.overrides.some((override) => isOverrideActive(override.status));
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(assessment: RiskAssessment): ApprovalStatus {
  if (assessment.approvals.length === 0) return 'NOT_REQUESTED';
  if (assessment.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (assessment.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (assessment.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
