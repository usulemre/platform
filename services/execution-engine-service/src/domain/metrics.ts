/**
 * Execution metrics — deterministic aggregation over a set of executions (counts by status,
 * completion/fail rates, executed quantity, average slices). No IO, no market data. Powers the
 * Execution Metrics view.
 */
import {
  EXECUTION_STATUSES,
  executionProgress,
  isActiveStatus,
  isWorkingStatus,
  type Execution,
  type ExecutionMetrics,
  type ExecutionStatus,
} from '@platform/execution-engine-sdk';

export function computeExecutionMetrics(executions: readonly Execution[]): ExecutionMetrics {
  const total = executions.length;
  const counts = new Map<ExecutionStatus, number>();
  let totalQuantity = 0;
  let executedQuantity = 0;
  let paused = 0;
  let sliceCount = 0;
  for (const execution of executions) {
    counts.set(execution.status, (counts.get(execution.status) ?? 0) + 1);
    totalQuantity += execution.quantity;
    executedQuantity += execution.result.executedQuantity;
    if (execution.paused) paused += 1;
    sliceCount += execution.result.slices.length;
  }
  const completed = counts.get('COMPLETED') ?? 0;
  const failed = counts.get('FAILED') ?? 0;
  const cancelled = counts.get('CANCELLED') ?? 0;
  return {
    total,
    active: executions.filter((e) => isActiveStatus(e.status)).length,
    working: executions.filter((e) => isWorkingStatus(e.status)).length,
    completed,
    failed,
    cancelled,
    partiallyExecuted: counts.get('PARTIALLY_EXECUTED') ?? 0,
    paused,
    completionRate: total > 0 ? completed / total : 0,
    failRate: total > 0 ? failed / total : 0,
    cancelRate: total > 0 ? cancelled / total : 0,
    fillCompletion: executionProgress(totalQuantity, executedQuantity),
    totalQuantity,
    executedQuantity,
    averageSlices: total > 0 ? sliceCount / total : 0,
    byStatus: EXECUTION_STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    })).filter((entry) => entry.count > 0),
  };
}
