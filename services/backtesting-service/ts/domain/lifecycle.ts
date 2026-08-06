/**
 * Pure Backtesting Engine lifecycle + run-control rules. Deterministic, no IO, no
 * simulation, no metric computation. These describe *whether* a governed
 * transition or run control is structurally permitted; the transition and the
 * execution itself happen elsewhere (Validation Foundation, Workflow Engine,
 * governance — CP-5), never here.
 */
import {
  canCancel,
  canPause,
  canResume,
  canRetry,
  nextStage,
  type ApprovalStatus,
  type Backtest,
  type BacktestStage,
} from '@platform/backtesting-sdk';

/** The stage a backtest would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(backtest: Backtest): BacktestStage | null {
  return nextStage(backtest.stage);
}

/** Whether the backtest's current run may be cancelled. */
export function isCancellable(backtest: Backtest): boolean {
  return canCancel(backtest.run.status);
}

/** Whether the backtest's current run may be retried. */
export function isRetryable(backtest: Backtest): boolean {
  return canRetry(backtest.run.status);
}

/** Whether the backtest's current run may be paused. */
export function isPausable(backtest: Backtest): boolean {
  return canPause(backtest.run.status);
}

/** Whether the backtest's current run may be resumed. */
export function isResumable(backtest: Backtest): boolean {
  return canResume(backtest.run.status);
}

/** Whether a backtest is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(backtest: Backtest): boolean {
  return backtest.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether a backtest has an open (pending or changes-requested) review. */
export function hasOpenReview(backtest: Backtest): boolean {
  return backtest.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(backtest: Backtest): ApprovalStatus {
  if (backtest.approvals.length === 0) return 'NOT_REQUESTED';
  if (backtest.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (backtest.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (backtest.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
