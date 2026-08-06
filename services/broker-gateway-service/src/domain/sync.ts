/**
 * Account synchronization — deterministic summaries of a broker's position, balance and order
 * snapshots. Pure: no IO. The snapshots themselves are the result of a QUERY_POSITIONS /
 * QUERY_BALANCES / QUERY_ORDER capability read performed elsewhere by a provider adapter; this module
 * never fetches them. Powers the Position / Balance / Order Synchronization views.
 */
import type { Broker, BrokerAccount } from '@platform/broker-sdk';

export interface PositionSyncSummary {
  readonly brokerId: string;
  readonly accountRef: string;
  readonly positions: BrokerAccount['positions'];
  readonly longCount: number;
  readonly shortCount: number;
  readonly grossExposure: number;
  readonly netExposure: number;
  readonly syncedAt: string;
}

export interface BalanceSyncSummary {
  readonly brokerId: string;
  readonly accountRef: string;
  readonly balances: BrokerAccount['balances'];
  readonly totalValue: number;
  readonly availableValue: number;
  readonly currencies: number;
  readonly syncedAt: string;
}

export interface OrderSyncSummary {
  readonly brokerId: string;
  readonly accountRef: string;
  readonly orders: BrokerAccount['orders'];
  readonly total: number;
  readonly open: number;
  readonly filled: number;
  readonly syncedAt: string;
}

const OPEN_STATES = new Set(['NEW', 'PARTIALLY_FILLED', 'ACCEPTED', 'WORKING', 'PENDING']);

export function computePositionSync(broker: Broker): PositionSyncSummary | null {
  const account = broker.account;
  if (!account) return null;
  let longCount = 0;
  let shortCount = 0;
  let gross = 0;
  let net = 0;
  for (const p of account.positions) {
    const value = p.quantity * p.averagePrice;
    gross += Math.abs(value);
    net += value;
    if (p.quantity > 0) longCount += 1;
    else if (p.quantity < 0) shortCount += 1;
  }
  return {
    brokerId: broker.id,
    accountRef: account.accountRef,
    positions: account.positions,
    longCount,
    shortCount,
    grossExposure: gross,
    netExposure: net,
    syncedAt: account.syncedAt,
  };
}

export function computeBalanceSync(broker: Broker): BalanceSyncSummary | null {
  const account = broker.account;
  if (!account) return null;
  let total = 0;
  let available = 0;
  for (const b of account.balances) {
    total += b.total;
    available += b.available;
  }
  return {
    brokerId: broker.id,
    accountRef: account.accountRef,
    balances: account.balances,
    totalValue: total,
    availableValue: available,
    currencies: account.balances.length,
    syncedAt: account.syncedAt,
  };
}

export function computeOrderSync(broker: Broker): OrderSyncSummary | null {
  const account = broker.account;
  if (!account) return null;
  let open = 0;
  let filled = 0;
  for (const o of account.orders) {
    if (OPEN_STATES.has(o.status.toUpperCase())) open += 1;
    if (o.status.toUpperCase() === 'FILLED') filled += 1;
  }
  return {
    brokerId: broker.id,
    accountRef: account.accountRef,
    orders: account.orders,
    total: account.orders.length,
    open,
    filled,
    syncedAt: account.syncedAt,
  };
}

/** Re-stamp a broker's account sync time (a resynchronization event; snapshots supplied elsewhere). */
export function markSynced(broker: Broker, at: string): Broker {
  if (!broker.account) return broker;
  return { ...broker, account: { ...broker.account, syncedAt: at }, updatedAt: at };
}
