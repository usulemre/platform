/**
 * Execution-price and participation calculations — REAL, pure, deterministic aggregations over the
 * fills of a single execution. No randomness, no wall-clock, no market-data feed: every result is a
 * closed-form function of the supplied fills. NO broker/exchange SDK, NO FIX, NO connectivity.
 */
import { BPS } from './constants';
import type { Fill } from './types';

/** Total executed quantity — the sum of fill quantities (shares/contracts/units). */
export function executedQuantity(fills: readonly Fill[]): number {
  let q = 0;
  for (const fill of fills) q += fill.quantity;
  return q;
}

/**
 * Average Execution Price — the simple arithmetic mean of fill prices (`Σ price / n`). Every fill is
 * weighted equally regardless of size. Returns `NaN` when there are no fills.
 */
export function averageExecutionPrice(fills: readonly Fill[]): number {
  if (fills.length === 0) return NaN;
  let sum = 0;
  for (const fill of fills) sum += fill.price;
  return sum / fills.length;
}

/**
 * Weighted Average Execution Price (VWEP) — the quantity-weighted mean of fill prices
 * (`Σ price·qty / Σ qty`). This is the realised price of the execution and the basis for every cost
 * comparison. Returns `NaN` when the executed quantity is zero.
 */
export function weightedAverageExecutionPrice(fills: readonly Fill[]): number {
  let notional = 0;
  let quantity = 0;
  for (const fill of fills) {
    notional += fill.price * fill.quantity;
    quantity += fill.quantity;
  }
  return quantity > 0 ? notional / quantity : NaN;
}

/** Traded notional — `Σ price·qty` over the fills (currency). */
export function executedNotional(fills: readonly Fill[]): number {
  let notional = 0;
  for (const fill of fills) notional += fill.price * fill.quantity;
  return notional;
}

/**
 * Participation Rate — the executed quantity as a fraction of the interval market volume
 * (`executedQty / marketVolume`). Zero when the market volume is not positive.
 */
export function participationRate(executedQty: number, marketVolume: number): number {
  return marketVolume > 0 ? executedQty / marketVolume : 0;
}

/**
 * Fill Rate — the executed quantity as a fraction of the ordered quantity (`executedQty / orderQty`),
 * clamped to `[0, 1]`. Zero when the order quantity is not positive.
 */
export function fillRate(executedQty: number, orderQty: number): number {
  if (orderQty <= 0) return 0;
  return Math.min(1, Math.max(0, executedQty / orderQty));
}

/** Convert a price difference to basis points of a reference price (`diff / reference · 10000`). */
export function toBps(diff: number, reference: number): number {
  return reference !== 0 ? (diff / reference) * BPS : 0;
}
