/**
 * Pure order search / filter / sort — the Order Search and Order Blotter query logic. Deterministic,
 * no IO. Mirrors what the UI query layer does so both tiers behave identically.
 */
import {
  isActiveStatus,
  isTerminalStatus,
  isWorkingStatus,
  type Order,
  type OrderSide,
  type OrderStatus,
  type OrderType,
} from '@platform/order-sdk';

export type OrderScope =
  | 'ALL'
  | 'ACTIVE'
  | 'WORKING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FILLED';
export type OrderSortField = 'createdAt' | 'updatedAt' | 'symbol' | 'status' | 'quantity';
export type SortDir = 'asc' | 'desc';

export interface OrderSearch {
  readonly text?: string;
  readonly scope?: OrderScope;
  readonly status?: OrderStatus | 'ALL';
  readonly side?: OrderSide | 'ALL';
  readonly type?: OrderType | 'ALL';
  readonly symbol?: string;
  readonly portfolioId?: string;
  readonly tag?: string;
  readonly sortBy?: OrderSortField;
  readonly sortDir?: SortDir;
}

/** Whether an order belongs to a lifecycle scope. */
export function inScope(order: Order, scope: OrderScope): boolean {
  switch (scope) {
    case 'ALL':
      return true;
    case 'ACTIVE':
      return isActiveStatus(order.status);
    case 'WORKING':
      return isWorkingStatus(order.status);
    case 'COMPLETED':
      return isTerminalStatus(order.status);
    case 'FILLED':
      return order.status === 'FILLED';
    case 'REJECTED':
      return order.status === 'REJECTED';
    case 'CANCELLED':
      return order.status === 'CANCELLED';
  }
}

export function applyOrderSearch(data: readonly Order[], query: OrderSearch): Order[] {
  const text = query.text?.trim().toLowerCase() ?? '';
  const scope = query.scope ?? 'ALL';
  const status = query.status ?? 'ALL';
  const side = query.side ?? 'ALL';
  const type = query.type ?? 'ALL';
  const symbol = query.symbol?.trim().toUpperCase() ?? '';
  const portfolioId = query.portfolioId?.trim() ?? '';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'createdAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((order) => {
    if (!inScope(order, scope)) return false;
    if (status !== 'ALL' && order.status !== status) return false;
    if (side !== 'ALL' && order.side !== side) return false;
    if (type !== 'ALL' && order.type !== type) return false;
    if (symbol && order.symbol.toUpperCase() !== symbol) return false;
    if (portfolioId && order.metadata.portfolioId !== portfolioId) return false;
    if (tag && !order.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (text) {
      const haystack =
        `${order.clientOrderId} ${order.symbol} ${order.side} ${order.type} ${order.owner.owner} ${order.metadata.strategyId ?? ''} ${order.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.createdAt.localeCompare(b.createdAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
