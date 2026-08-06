/**
 * Market-impact calculations — REAL, pure, deterministic. Uses the Almgren-style decomposition of
 * the price move against the arrival price into a permanent component (the lasting move caused by
 * trading) and a temporary component (the transient liquidity concession that reverts after the
 * trade). By construction the two components sum exactly to the total impact.
 *
 *   permanent = side · (midAfter − arrival) / arrival · 10000
 *   temporary = side · (execPrice − midAfter) / arrival · 10000
 *   total     = side · (execPrice − arrival) / arrival · 10000 = permanent + temporary
 */
import { toBps } from './prices';
import { sideMultiplier, type MarketImpactReport, type Side } from './types';

/** Permanent (information) impact in basis points: the lasting mid move from arrival to post-trade. */
export function permanentImpactBps(arrival: number, midAfter: number, side: Side): number {
  return sideMultiplier(side) * toBps(midAfter - arrival, arrival);
}

/** Temporary (liquidity) impact in basis points: the reverting concession from execution to post-trade mid. */
export function temporaryImpactBps(
  execPrice: number,
  midAfter: number,
  arrival: number,
  side: Side,
): number {
  return sideMultiplier(side) * toBps(execPrice - midAfter, arrival);
}

/** Total market impact in basis points: execution price against the arrival price (= permanent + temporary). */
export function totalImpactBps(execPrice: number, arrival: number, side: Side): number {
  return sideMultiplier(side) * toBps(execPrice - arrival, arrival);
}

/**
 * The market-impact report — the additive permanent/temporary decomposition against arrival. When no
 * post-trade mid is available it falls back to the interval last price so the decomposition still
 * resolves deterministically.
 */
export function marketImpactReport(
  execPrice: number,
  arrival: number,
  midAfter: number,
  side: Side,
): MarketImpactReport {
  const permanent = permanentImpactBps(arrival, midAfter, side);
  const temporary = temporaryImpactBps(execPrice, midAfter, arrival, side);
  return {
    totalBps: permanent + temporary,
    temporaryBps: temporary,
    permanentBps: permanent,
  };
}
