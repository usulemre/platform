/**
 * Cost breakdown, commission and attribution calculations — REAL, pure, deterministic. The total
 * all-in cost of an execution is decomposed, additively, into economically meaningful buckets:
 *
 *   total = slippage(residual timing) + spread(half-spread) + marketImpact(permanent) + commission
 *
 * The market cost against arrival (`side · (execPrice − arrival)/arrival`) is attributed to the
 * spread-crossing, permanent-impact and residual-timing components; commission is the explicit cost.
 * By construction the four bps components sum to the arrival market cost plus commission.
 */
import { BPS } from './constants';
import { permanentImpactBps, totalImpactBps } from './impact';
import type { CommissionReport, CostBreakdown, ExecutionAttribution, Side } from './types';

/** The commission report — currency, basis points of notional, and per-share cost. */
export function commissionReport(
  commission: number,
  notional: number,
  executedQty: number,
): CommissionReport {
  return {
    commission,
    commissionBps: notional !== 0 ? (commission / notional) * BPS : 0,
    perShare: executedQty !== 0 ? commission / executedQty : 0,
  };
}

/** Spread cost in basis points — the half of the quoted spread paid when crossing. */
export function spreadCostBps(quotedSpreadBps: number): number {
  return quotedSpreadBps / 2;
}

export interface CostBreakdownInput {
  readonly execPrice: number;
  readonly arrival: number;
  readonly midAfter: number;
  readonly side: Side;
  readonly quotedSpreadBps: number;
  readonly commission: number;
  readonly notional: number;
}

/** The additive cost breakdown (basis points + currency). `totalBps = Σ components`. */
export function costBreakdown(input: CostBreakdownInput): CostBreakdown {
  const arrivalCostBps = totalImpactBps(input.execPrice, input.arrival, input.side);
  const spreadBps = spreadCostBps(input.quotedSpreadBps);
  const marketImpactBps = permanentImpactBps(input.arrival, input.midAfter, input.side);
  const commissionBps = input.notional !== 0 ? (input.commission / input.notional) * BPS : 0;
  // The residual timing slippage is what remains of the arrival market cost after the explicit
  // spread and permanent-impact buckets — this keeps the decomposition exactly additive.
  const slippageBps = arrivalCostBps - spreadBps - marketImpactBps;
  const totalBps = arrivalCostBps + commissionBps;

  const toCurrency = (bps: number): number => (bps / BPS) * input.notional;
  return {
    slippageBps,
    spreadBps,
    marketImpactBps,
    commissionBps,
    totalBps,
    slippageCurrency: toCurrency(slippageBps),
    spreadCurrency: toCurrency(spreadBps),
    marketImpactCurrency: toCurrency(marketImpactBps),
    commissionCurrency: input.commission,
    totalCurrency: toCurrency(arrivalCostBps) + input.commission,
  };
}

/** The cost attribution — the breakdown expressed as components with share-of-total. */
export function costAttribution(breakdown: CostBreakdown): ExecutionAttribution {
  const denom =
    Math.abs(breakdown.slippageBps) +
    Math.abs(breakdown.spreadBps) +
    Math.abs(breakdown.marketImpactBps) +
    Math.abs(breakdown.commissionBps);
  const share = (bps: number): number => (denom > 0 ? Math.abs(bps) / denom : 0);
  const components = [
    {
      label: 'Timing slippage',
      bps: breakdown.slippageBps,
      currency: breakdown.slippageCurrency,
      share: share(breakdown.slippageBps),
    },
    {
      label: 'Spread',
      bps: breakdown.spreadBps,
      currency: breakdown.spreadCurrency,
      share: share(breakdown.spreadBps),
    },
    {
      label: 'Market impact',
      bps: breakdown.marketImpactBps,
      currency: breakdown.marketImpactCurrency,
      share: share(breakdown.marketImpactBps),
    },
    {
      label: 'Commission',
      bps: breakdown.commissionBps,
      currency: breakdown.commissionCurrency,
      share: share(breakdown.commissionBps),
    },
  ];
  return { totalBps: breakdown.totalBps, components };
}
