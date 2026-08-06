/**
 * Pure Performance Analytics Engine lifecycle rules. Deterministic, no IO, no formulas, no
 * metric calculation. These describe *whether* a governed transition is structurally
 * permitted; the transition and the computation itself happen elsewhere (the analytics
 * runtime, Validation Foundation, Workflow Engine, governance — CP-5), never here.
 */
import {
  nextStage,
  type ApprovalStatus,
  type PerformanceReport,
  type ReportStage,
} from '@platform/performance-sdk';

/** The stage a report would move to next, or null at the end of the lifecycle. */
export function proposedNextStage(report: PerformanceReport): ReportStage | null {
  return nextStage(report.stage);
}

/** Whether a report is currently awaiting a governance approval decision. */
export function isAwaitingApprovalDecision(report: PerformanceReport): boolean {
  return report.approvals.some((approval) => approval.status === 'PENDING');
}

/** Whether a report has an open (pending or changes-requested) review. */
export function hasOpenReview(report: PerformanceReport): boolean {
  return report.reviews.some(
    (review) => review.status === 'PENDING' || review.status === 'CHANGES_REQUESTED',
  );
}

/** Whether a report's metrics are ready (computation completed). */
export function isComputed(report: PerformanceReport): boolean {
  return report.computation === 'COMPLETED';
}

/** The overall approval status derived from the recorded approvals. */
export function overallApproval(report: PerformanceReport): ApprovalStatus {
  if (report.approvals.length === 0) return 'NOT_REQUESTED';
  if (report.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (report.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (report.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}
