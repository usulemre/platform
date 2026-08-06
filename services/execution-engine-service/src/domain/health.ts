/**
 * Execution health — deterministic health checks over the executions (fail rate, paused/stuck
 * executions, unrouted working executions, over-execution integrity). No IO, no wall-clock; derived
 * purely from the current executions. Powers the Execution Health view.
 */
import { isWorkingStatus, type Execution } from '@platform/execution-engine-sdk';
import { computeExecutionMetrics } from './metrics';

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
  readonly checkedAt: string;
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(
  executions: readonly Execution[],
  checkedAt: string,
): ExecutionHealth {
  const metrics = computeExecutionMetrics(executions);
  const checks: HealthCheck[] = [];

  const failStatus: HealthStatus =
    metrics.failRate > 0.25 ? 'UNHEALTHY' : metrics.failRate > 0.1 ? 'DEGRADED' : 'HEALTHY';
  checks.push({
    id: 'fail_rate',
    label: 'Failure rate',
    status: failStatus,
    detail: `${(metrics.failRate * 100).toFixed(1)}% failed`,
  });

  const pausedStatus: HealthStatus = metrics.paused > 3 ? 'DEGRADED' : 'HEALTHY';
  checks.push({
    id: 'paused',
    label: 'Paused executions',
    status: pausedStatus,
    detail: `${metrics.paused} paused`,
  });

  const unplanned = executions.filter(
    (execution) => isWorkingStatus(execution.status) && !execution.plan,
  ).length;
  checks.push({
    id: 'planned',
    label: 'Working executions are planned',
    status: unplanned > 0 ? 'DEGRADED' : 'HEALTHY',
    detail: unplanned === 0 ? 'all working executions have a plan' : `${unplanned} unplanned`,
  });

  const overExecuted = executions.filter(
    (execution) => execution.result.executedQuantity > execution.quantity + 1e-9,
  ).length;
  checks.push({
    id: 'execution_integrity',
    label: 'Execution integrity',
    status: overExecuted > 0 ? 'UNHEALTHY' : 'HEALTHY',
    detail: overExecuted === 0 ? 'no execution over-filled' : `${overExecuted} over-executed`,
  });

  return {
    status: checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY'),
    checks,
    checkedAt,
  };
}
