/**
 * Pure Execution Simulator lifecycle + run-control rules. Deterministic, no IO, no
 * execution algorithm, no fill/price calculation. These describe *whether* a governed
 * transition or run control is structurally permitted; the transition and the
 * simulation itself happen elsewhere (Validation Foundation, Workflow Engine, the
 * simulator, governance — CP-5), never here.
 */
import {
  canCancel,
  canPause,
  canReplay,
  canResume,
  canRetry,
  nextStage,
  type ApprovalStatus,
  type SimulationSession,
  type SimulationStage,
} from '@platform/execution-sdk';

/** The stage a session would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(session: SimulationSession): SimulationStage | null {
  return nextStage(session.stage);
}

/** Whether the session's current run may be cancelled. */
export function isCancellable(session: SimulationSession): boolean {
  return canCancel(session.run.status);
}

/** Whether the session's current run may be retried. */
export function isRetryable(session: SimulationSession): boolean {
  return canRetry(session.run.status);
}

/** Whether the session's current run may be paused. */
export function isPausable(session: SimulationSession): boolean {
  return canPause(session.run.status);
}

/** Whether the session's current run may be resumed. */
export function isResumable(session: SimulationSession): boolean {
  return canResume(session.run.status);
}

/** Whether the session may be replayed (completed only). */
export function isReplayable(session: SimulationSession): boolean {
  return canReplay(session.run.status);
}

/** Whether a session is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(session: SimulationSession): boolean {
  return session.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether a session has an open (pending or changes-requested) review. */
export function hasOpenReview(session: SimulationSession): boolean {
  return session.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(session: SimulationSession): ApprovalStatus {
  if (session.approvals.length === 0) return 'NOT_REQUESTED';
  if (session.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (session.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (session.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
