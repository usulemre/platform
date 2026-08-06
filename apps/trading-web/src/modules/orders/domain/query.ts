/**
 * Order query model + pure query application (scope / filter / sort) for the blotter and search.
 * Deterministic; mirrors the OMS service's search so both tiers behave identically.
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
  | 'FILLED'
  | 'REJECTED'
  | 'CANCELLED';
export type OrderSortField = 'createdAt' | 'updatedAt' | 'symbol' | 'status' | 'quantity';
export type SortDir = 'asc' | 'desc';

export interface OrderQuery {
  readonly text?: string;
  readonly scope?: OrderScope;
  readonly status?: OrderStatus | 'ALL';
  readonly side?: OrderSide | 'ALL';
  readonly type?: OrderType | 'ALL';
  readonly symbol?: string;
  readonly sortBy?: OrderSortField;
  readonly sortDir?: SortDir;
}

function inScope(order: Order, scope: OrderScope): boolean {
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

export function applyOrderQuery(data: readonly Order[], query: OrderQuery): Order[] {
  const text = query.text?.trim().toLowerCase() ?? '';
  const scope = query.scope ?? 'ALL';
  const status = query.status ?? 'ALL';
  const side = query.side ?? 'ALL';
  const type = query.type ?? 'ALL';
  const symbol = query.symbol?.trim().toUpperCase() ?? '';
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDir = query.sortDir ?? 'desc';

  const filtered = data.filter((order) => {
    if (!inScope(order, scope)) return false;
    if (status !== 'ALL' && order.status !== status) return false;
    if (side !== 'ALL' && order.side !== side) return false;
    if (type !== 'ALL' && order.type !== type) return false;
    if (symbol && order.symbol.toUpperCase() !== symbol) return false;
    if (text) {
      const haystack =
        `${order.clientOrderId} ${order.symbol} ${order.side} ${order.type} ${order.owner.owner} ${order.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
    else if (sortBy === 'status') comparison = a.status.localeCompare(b.status);
    else if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
    else if (sortBy === 'createdAt') comparison = a.createdAt.localeCompare(b.createdAt);
    else comparison = a.updatedAt.localeCompare(b.updatedAt);
    return sortDir === 'asc' ? comparison : -comparison;
  });
}
