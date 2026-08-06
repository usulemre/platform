/**
 * Pure UI-side derivations — execution metrics, health and event-sourced replay — computed from the
 * canonical executions via `@platform/execution-engine-sdk`. Deterministic, no IO. Mirrors the
 * Execution Engine service's derivations so the UI presents the same numbers.
 */
import {
  EXECUTION_STATUSES,
  canTransition,
  executionProgress,
  isActiveStatus,
  isWorkingStatus,
  type Execution,
  type ExecutionMetrics,
  type ExecutionState,
  type ExecutionStatus,
} from '@platform/execution-engine-sdk';

export function computeMetrics(executions: readonly Execution[]): ExecutionMetrics {
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

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly status: HealthStatus;
  readonly detail: string;
}
export interface ExecutionHealth {
  readonly status: HealthStatus;
  readonly checks: readonly HealthCheck[];
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(executions: readonly Execution[]): ExecutionHealth {
  const metrics = computeMetrics(executions);
  const checks: HealthCheck[] = [];
  checks.push({
    id: 'fail_rate',
    label: 'Failure rate',
    status: metrics.failRate > 0.25 ? 'UNHEALTHY' : metrics.failRate > 0.1 ? 'DEGRADED' : 'HEALTHY',
    detail: `${(metrics.failRate * 100).toFixed(1)}% failed`,
  });
  checks.push({
    id: 'paused',
    label: 'Paused executions',
    status: metrics.paused > 3 ? 'DEGRADED' : 'HEALTHY',
    detail: `${metrics.paused} paused`,
  });
  const unplanned = executions.filter((e) => isWorkingStatus(e.status) && !e.plan).length;
  checks.push({
    id: 'planned',
    label: 'Working executions are planned',
    status: unplanned > 0 ? 'DEGRADED' : 'HEALTHY',
    detail: unplanned === 0 ? 'all working executions planned' : `${unplanned} unplanned`,
  });
  const over = executions.filter((e) => e.result.executedQuantity > e.quantity + 1e-9).length;
  checks.push({
    id: 'integrity',
    label: 'Execution integrity',
    status: over > 0 ? 'UNHEALTHY' : 'HEALTHY',
    detail: over === 0 ? 'no over-execution' : `${over} over-executed`,
  });
  return {
    status: checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY'),
    checks,
  };
}

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: ExecutionStatus;
  readonly to: ExecutionStatus;
  readonly legal: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}
export interface ReplayResult {
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: ExecutionStatus;
  readonly recordedStatus: ExecutionStatus;
  readonly consistent: boolean;
  readonly states: readonly ExecutionState[];
}

export function replay(execution: Execution): ReplayResult {
  let current: ExecutionStatus = 'ORDER_RECEIVED';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: ExecutionState[] = [];
  let index = 0;
  for (const event of execution.events) {
    if (event.status === undefined) continue;
    const to = event.status;
    if (index === 0) {
      current = to;
      steps.push({
        index,
        type: event.type,
        from: to,
        to,
        legal: true,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
    } else {
      const legal = canTransition(current, to) || current === to;
      if (!legal) legalThroughout = false;
      steps.push({
        index,
        type: event.type,
        from: current,
        to,
        legal,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
      current = to;
    }
    states.push({ status: to, at: event.at, note: event.message });
    index += 1;
  }
  return {
    steps,
    reconstructedStatus: current,
    recordedStatus: execution.status,
    consistent: legalThroughout && current === execution.status,
    states,
  };
}
