/**
 * Pure Portfolio Construction Engine lifecycle + optimization-control rules.
 * Deterministic, no IO, no optimization, no weight/risk computation. These describe
 * *whether* a governed transition or optimization control is structurally permitted;
 * the transition and the optimization itself happen elsewhere (Validation Foundation,
 * Workflow Engine, the external Optimizer, governance — CP-5), never here.
 */
import {
  canCancel,
  canRetry,
  nextStage,
  type ApprovalStatus,
  type Portfolio,
  type PortfolioStage,
} from '@platform/portfolio-sdk';

/** The stage a portfolio would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(portfolio: Portfolio): PortfolioStage | null {
  return nextStage(portfolio.stage);
}

/** Whether the portfolio's current optimization request may be cancelled. */
export function isOptimizationCancellable(portfolio: Portfolio): boolean {
  return canCancel(portfolio.optimization.status);
}

/** Whether the portfolio's current optimization request may be retried. */
export function isOptimizationRetryable(portfolio: Portfolio): boolean {
  return canRetry(portfolio.optimization.status);
}

/** Whether a portfolio is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(portfolio: Portfolio): boolean {
  return portfolio.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether a portfolio has an open (pending or changes-requested) review. */
export function hasOpenReview(portfolio: Portfolio): boolean {
  return portfolio.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(portfolio: Portfolio): ApprovalStatus {
  if (portfolio.approvals.length === 0) return 'NOT_REQUESTED';
  if (portfolio.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (portfolio.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (portfolio.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
