/**
 * Pure Signal Engine lifecycle rules. Deterministic, no IO, no alpha model, no
 * statistics. These describe *whether* a governed transition is structurally
 * permitted; the transition itself is decided by the Validation Foundation and
 * governance (CP-5), never here.
 */
import {
  isValidated,
  nextStage,
  stageOrder,
  type ApprovalStatus,
  type RegisteredSignal,
  type SignalStage,
} from '@platform/signal-sdk';

/** The stage a signal would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(signal: RegisteredSignal): SignalStage | null {
  return nextStage(signal.stage);
}

/**
 * Whether a signal is structurally ready to enter the approval gate: it must have
 * reached the review stage or later and cleared validation. This is a gating
 * pre-check, not the approval decision.
 */
export function isReadyForApproval(signal: RegisteredSignal): boolean {
  return stageOrder(signal.stage) >= stageOrder('REVIEW') && isValidated(signal.validation.status);
}

/**
 * Whether an approved, registered signal is structurally eligible for promotion
 * to a production candidate. The promotion decision is still governed.
 */
export function isEligibleForPromotion(signal: RegisteredSignal): boolean {
  return (
    stageOrder(signal.stage) >= stageOrder('REGISTRY') &&
    signal.approval === 'APPROVED' &&
    isValidated(signal.validation.status)
  );
}

/** Whether a signal is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(signal: RegisteredSignal): boolean {
  return signal.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether a signal has an open (pending or changes-requested) review. */
export function hasOpenReview(signal: RegisteredSignal): boolean {
  return signal.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(signal: RegisteredSignal): ApprovalStatus {
  if (signal.approvals.length === 0) return 'NOT_REQUESTED';
  if (signal.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (signal.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (signal.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
