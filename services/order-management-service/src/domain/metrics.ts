/**
 * Order metrics — deterministic aggregation over a set of orders (counts by status, fill/reject
 * rates, filled quantity). No IO, no market data. Powers the Order Metrics view.
 */
import {
  ORDER_STATUSES,
  fillRatio,
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Order,
  type OrderStatus,
} from '@platform/order-sdk';

export interface StatusCount {
  readonly status: OrderStatus;
  readonly count: number;
}

export interface OrderMetrics {
  readonly total: number;
  readonly active: number;
  readonly working: number;
  readonly terminal: number;
  readonly filled: number;
  readonly partiallyFilled: number;
  readonly rejected: number;
  readonly cancelled: number;
  readonly expired: number;
  readonly suspended: number;
  /** Filled / total. */
  readonly fillRate: number;
  /** Rejected / total. */
  readonly rejectRate: number;
  /** Cancelled / total. */
  readonly cancelRate: number;
  readonly totalQuantity: number;
  readonly totalFilledQuantity: number;
  /** Overall filled quantity / total quantity. */
  readonly fillCompletion: number;
  readonly byStatus: readonly StatusCount[];
}

export function computeOrderMetrics(orders: readonly Order[]): OrderMetrics {
  const total = orders.length;
  const counts = new Map<OrderStatus, number>();
  let totalQuantity = 0;
  let totalFilledQuantity = 0;
  let suspended = 0;
  for (const order of orders) {
    counts.set(order.status, (counts.get(order.status) ?? 0) + 1);
    totalQuantity += order.quantity;
    totalFilledQuantity += order.execution.filledQuantity;
    if (order.suspended) suspended += 1;
  }
  const byStatus = ORDER_STATUSES.map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  })).filter((entry) => entry.count > 0);
  const filled = counts.get('FILLED') ?? 0;
  const rejected = counts.get('REJECTED') ?? 0;
  const cancelled = counts.get('CANCELLED') ?? 0;
  return {
    total,
    active: orders.filter((o) => isActiveStatus(o.status)).length,
    working: orders.filter((o) => isWorkingStatus(o.status)).length,
    terminal: orders.filter((o) => isTerminalStatus(o.status)).length,
    filled,
    partiallyFilled: counts.get('PARTIALLY_FILLED') ?? 0,
    rejected,
    cancelled,
    expired: counts.get('EXPIRED') ?? 0,
    suspended,
    fillRate: total > 0 ? filled / total : 0,
    rejectRate: total > 0 ? rejected / total : 0,
    cancelRate: total > 0 ? cancelled / total : 0,
    totalQuantity,
    totalFilledQuantity,
    fillCompletion: fillRatio(totalQuantity, totalFilledQuantity),
    byStatus,
  };
}
