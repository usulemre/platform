/**
 * Order health — deterministic health checks over the order book (reject rate, stuck/suspended
 * orders, unrouted working orders, over-fill integrity). No IO, no wall-clock; derived purely from
 * the current orders. Powers the Order Health view.
 */
import { isWorkingStatus, type Order } from '@platform/order-sdk';
import { computeOrderMetrics } from './metrics';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly status: HealthStatus;
  readonly detail: string;
}

export interface OrderHealth {
  readonly status: HealthStatus;
  readonly checks: readonly HealthCheck[];
  readonly checkedAt: string;
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(orders: readonly Order[], checkedAt: string): OrderHealth {
  const metrics = computeOrderMetrics(orders);
  const checks: HealthCheck[] = [];

  const rejectStatus: HealthStatus =
    metrics.rejectRate > 0.25 ? 'UNHEALTHY' : metrics.rejectRate > 0.1 ? 'DEGRADED' : 'HEALTHY';
  checks.push({
    id: 'reject_rate',
    label: 'Reject rate',
    status: rejectStatus,
    detail: `${(metrics.rejectRate * 100).toFixed(1)}% of orders rejected`,
  });

  const suspendedStatus: HealthStatus = metrics.suspended > 3 ? 'DEGRADED' : 'HEALTHY';
  checks.push({
    id: 'suspended',
    label: 'Suspended orders',
    status: suspendedStatus,
    detail: `${metrics.suspended} suspended`,
  });

  const unrouted = orders.filter((order) => isWorkingStatus(order.status) && !order.route).length;
  const unroutedStatus: HealthStatus = unrouted > 0 ? 'DEGRADED' : 'HEALTHY';
  checks.push({
    id: 'unrouted',
    label: 'Working orders are routed',
    status: unroutedStatus,
    detail:
      unrouted === 0
        ? 'all working orders have a route'
        : `${unrouted} working order(s) without a route`,
  });

  const overfilled = orders.filter(
    (order) => order.execution.filledQuantity > order.quantity + 1e-9,
  ).length;
  const integrityStatus: HealthStatus = overfilled > 0 ? 'UNHEALTHY' : 'HEALTHY';
  checks.push({
    id: 'fill_integrity',
    label: 'Fill integrity',
    status: integrityStatus,
    detail: overfilled === 0 ? 'no order over-filled' : `${overfilled} order(s) over-filled`,
  });

  const status = checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY');
  return { status, checks, checkedAt };
}
