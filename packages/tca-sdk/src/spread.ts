/**
 * Spread microstructure calculations — REAL, pure, deterministic. The effective spread measures the
 * round-trip cost of demanding liquidity relative to the mid quote at execution; the realized spread
 * measures the portion that persists a short interval after the trade (the liquidity-provision
 * component). Both use the cost sign convention via `sideMultiplier` and are expressed in basis
 * points of the execution-time mid.
 */
import { toBps } from './prices';
import { sideMultiplier, type Side } from './types';

/**
 * Effective spread in basis points: `2 · side · (execPrice − mid) / mid · 10000`. The factor of two
 * annualises the half-spread paid into a full round-trip quoted-spread equivalent.
 */
export function effectiveSpreadBps(execPrice: number, mid: number, side: Side): number {
  return 2 * sideMultiplier(side) * toBps(execPrice - mid, mid);
}

/** Effective half-spread in currency per share: `side · (execPrice − mid)`. */
export function effectiveHalfSpread(execPrice: number, mid: number, side: Side): number {
  return sideMultiplier(side) * (execPrice - mid);
}

/**
 * Realized spread in basis points: `2 · side · (execPrice − midAfter) / mid · 10000`, using the mid
 * quote a short interval AFTER execution. Normalised by the execution-time `mid` so that it composes
 * with the effective spread and the price impact (effective = realized + price impact).
 */
export function realizedSpreadBps(
  execPrice: number,
  mid: number,
  midAfter: number,
  side: Side,
): number {
  return 2 * sideMultiplier(side) * toBps(execPrice - midAfter, mid);
}

/**
 * Price-impact component of the spread in basis points: `2 · side · (midAfter − mid) / mid · 10000`.
 * By construction `effectiveSpread = realizedSpread + priceImpact`.
 */
export function spreadPriceImpactBps(mid: number, midAfter: number, side: Side): number {
  return 2 * sideMultiplier(side) * toBps(midAfter - mid, mid);
}
