/**
 * Pure identifier and order-arithmetic primitives — deterministic, no IO. The fill arithmetic here
 * (filled quantity, remaining quantity, average execution price) is standard order bookkeeping over
 * the order's own fills; it is NOT market-data, statistics or PnL computation.
 */
import type { OrderFill } from './contracts';

/** A stable, human-readable client order id from an account and a sequence. */
export function clientOrderId(account: string, sequence: number): string {
  return `${account.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${sequence.toString().padStart(6, '0')}`;
}

/** The total filled quantity across a set of fills. */
export function totalFilledQuantity(fills: readonly OrderFill[]): number {
  let sum = 0;
  for (const fill of fills) sum += fill.quantity;
  return sum;
}

/** The remaining (unfilled) quantity given an order quantity and its fills. */
export function remainingQuantity(quantity: number, fills: readonly OrderFill[]): number {
  return Math.max(0, quantity - totalFilledQuantity(fills));
}

/** The quantity-weighted average execution price across fills, or `undefined` if none. */
export function averageFillPrice(fills: readonly OrderFill[]): number | undefined {
  let notional = 0;
  let quantity = 0;
  for (const fill of fills) {
    notional += fill.price * fill.quantity;
    quantity += fill.quantity;
  }
  return quantity > 0 ? notional / quantity : undefined;
}

/** The fill ratio in `[0, 1]` (0 when quantity is 0). */
export function fillRatio(quantity: number, filled: number): number {
  return quantity > 0 ? Math.min(1, filled / quantity) : 0;
}
