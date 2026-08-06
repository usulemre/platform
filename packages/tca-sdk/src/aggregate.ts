/**
 * Aggregation across many analyzed executions — REAL, pure, deterministic. Provides the notional-
 * weighted per-venue comparison and a portfolio-level rollup. Notional weighting ensures a large
 * execution contributes proportionally more to the average cost than a small one. No IO.
 */
import type { AggregateAnalytics, ExecutionAnalytics, VenueComparison } from './types';

/** A notional-weighted mean accumulator. */
class WeightedMean {
  private sum = 0;
  private weight = 0;
  add(value: number, weight: number): void {
    this.sum += value * weight;
    this.weight += weight;
  }
  get value(): number {
    return this.weight > 0 ? this.sum / this.weight : 0;
  }
}

/** Compare execution cost per venue (notional-weighted averages, sorted by total cost ascending). */
export function compareVenues(
  analytics: readonly ExecutionAnalytics[],
): readonly VenueComparison[] {
  const byVenue = new Map<string, ExecutionAnalytics[]>();
  for (const a of analytics) {
    const list = byVenue.get(a.venue) ?? [];
    list.push(a);
    byVenue.set(a.venue, list);
  }
  const rows: VenueComparison[] = [];
  for (const [venueId, list] of Array.from(byVenue.entries())) {
    const slip = new WeightedMean();
    const impact = new WeightedMean();
    const comm = new WeightedMean();
    const total = new WeightedMean();
    const score = new WeightedMean();
    let totalNotional = 0;
    for (const a of list) {
      const w = a.notional > 0 ? a.notional : 1;
      slip.add(a.slippage.vsArrivalBps, w);
      impact.add(a.impact.totalBps, w);
      comm.add(a.commission.commissionBps, w);
      total.add(a.cost.totalBps, w);
      score.add(a.quality.score, w);
      totalNotional += a.notional;
    }
    rows.push({
      venueId,
      executions: list.length,
      totalNotional,
      avgSlippageBps: slip.value,
      avgMarketImpactBps: impact.value,
      avgCommissionBps: comm.value,
      avgTotalCostBps: total.value,
      avgScore: score.value,
    });
  }
  return rows.sort((a, b) => a.avgTotalCostBps - b.avgTotalCostBps);
}

/** A notional-weighted portfolio-level rollup across all analyzed executions. */
export function aggregate(analytics: readonly ExecutionAnalytics[]): AggregateAnalytics {
  const slip = new WeightedMean();
  const spread = new WeightedMean();
  const impact = new WeightedMean();
  const comm = new WeightedMean();
  const total = new WeightedMean();
  const is = new WeightedMean();
  const score = new WeightedMean();
  const participation = new WeightedMean();
  let totalNotional = 0;
  let totalCost = 0;
  let totalCommission = 0;
  let favorable = 0;
  for (const a of analytics) {
    const w = a.notional > 0 ? a.notional : 1;
    slip.add(a.slippage.vsArrivalBps, w);
    spread.add(a.cost.spreadBps, w);
    impact.add(a.impact.totalBps, w);
    comm.add(a.commission.commissionBps, w);
    total.add(a.cost.totalBps, w);
    is.add(a.implementationShortfallBps, w);
    score.add(a.quality.score, w);
    participation.add(a.participationRate, w);
    totalNotional += a.notional;
    totalCost += a.cost.totalCurrency;
    totalCommission += a.commission.commission;
    if (a.cost.totalBps < 0) favorable += 1;
  }
  return {
    executions: analytics.length,
    totalNotional,
    totalCostCurrency: totalCost,
    totalCommissionCurrency: totalCommission,
    avgSlippageBps: slip.value,
    avgSpreadBps: spread.value,
    avgMarketImpactBps: impact.value,
    avgCommissionBps: comm.value,
    avgTotalCostBps: total.value,
    avgImplementationShortfallBps: is.value,
    avgScore: score.value,
    avgParticipationRate: participation.value,
    favorableRate: analytics.length > 0 ? favorable / analytics.length : 0,
  };
}
