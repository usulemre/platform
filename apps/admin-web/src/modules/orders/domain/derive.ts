/**
 * Pure UI-side derivations — order metrics, health and event-sourced replay — computed from the
 * canonical orders via `@platform/order-sdk`. Deterministic, no IO. Mirrors the OMS service's
 * derivations so the UI presents the same numbers.
 */
import {
  ORDER_STATUSES,
  canTransition,
  fillRatio,
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Order,
  type OrderState,
  type OrderStatus,
} from '@platform/order-sdk';

export interface OrderMetrics {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly filled: number;
  readonly partiallyFilled: number;
  readonly rejected: number;
  readonly cancelled: number;
  readonly expired: number;
  readonly suspended: number;
  readonly fillRate: number;
  readonly rejectRate: number;
  readonly cancelRate: number;
  readonly fillCompletion: number;
  readonly byStatus: readonly { readonly status: OrderStatus; readonly count: number }[];
}

export function computeMetrics(orders: readonly Order[]): OrderMetrics {
  const total = orders.length;
  const counts = new Map<OrderStatus, number>();
  let totalQuantity = 0;
  let totalFilled = 0;
  let suspended = 0;
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    totalQuantity += order.quantity;
    totalFilled += order.execution.filledQuantity;
    if (order.suspended) suspended += 1;
  }
  const filled = counts.get('FILLED') ?? 0;
  const rejected = counts.get('REJECTED') ?? 0;
  const cancelled = counts.get('CANCELLED') ?? 0;
  return {
    total,
    active: orders.filter((o) => isActiveStatus(o.status)).length,
    working: orders.filter((o) => isWorkingStatus(o.status)).length,
    filled,
    partiallyFilled: counts.get('PARTIALLY_FILLED') ?? 0,
    rejected,
    cancelled,
    expired: counts.get('EXPIRED') ?? 0,
    suspended,
    fillRate: total > 0 ? filled / total : 0,
    rejectRate: total > 0 ? rejected / total : 0,
    cancelRate: total > 0 ? cancelled / total : 0,
    fillCompletion: fillRatio(totalQuantity, totalFilled),
    byStatus: ORDER_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 })).filter(
      (entry) => entry.count > 0,
    ),
  };
}

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
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(orders: readonly Order[]): OrderHealth {
  const metrics = computeMetrics(orders);
  const checks: HealthCheck[] = [];
  checks.push({
    id: 'reject_rate',
    label: 'Reject rate',
    status:
      metrics.rejectRate > 0.25 ? 'UNHEALTHY' : metrics.rejectRate > 0.1 ? 'DEGRADED' : 'HEALTHY',
    detail: `${(metrics.rejectRate * 100).toFixed(1)}% rejected`,
  });
  checks.push({
    id: 'suspended',
    label: 'Suspended orders',
    status: metrics.suspended > 3 ? 'DEGRADED' : 'HEALTHY',
    detail: `${metrics.suspended} suspended`,
  });
  const unrouted = orders.filter((order) => isWorkingStatus(order.status) && !order.route).length;
  checks.push({
    id: 'unrouted',
    label: 'Working orders are routed',
    status: unrouted > 0 ? 'DEGRADED' : 'HEALTHY',
    detail: unrouted === 0 ? 'all working orders routed' : `${unrouted} unrouted`,
  });
  const overfilled = orders.filter(
    (order) => order.execution.filledQuantity > order.quantity + 1e-9,
  ).length;
  checks.push({
    id: 'fill_integrity',
    label: 'Fill integrity',
    status: overfilled > 0 ? 'UNHEALTHY' : 'HEALTHY',
    detail: overfilled === 0 ? 'no over-fill' : `${overfilled} over-filled`,
  });
  return {
    status: checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY'),
    checks,
  };
}

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly legal: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}

export interface ReplayResult {
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: OrderStatus;
  readonly recordedStatus: OrderStatus;
  readonly consistent: boolean;
  readonly states: readonly OrderState[];
}

export function replay(order: Order): ReplayResult {
  let current: OrderStatus = 'CREATED';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: OrderState[] = [];
  let index = 0;
  for (const event of order.events) {
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
    recordedStatus: order.status,
    consistent: legalThroughout && current === order.status,
    states,
  };
}

export { isTerminalStatus };
