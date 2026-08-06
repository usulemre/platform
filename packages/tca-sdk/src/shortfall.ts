/**
 * Implementation Shortfall — REAL, pure, deterministic. The Perold implementation shortfall is the
 * difference between the value of a paper portfolio struck at the decision price and the value of the
 * real, executed portfolio, including explicit costs. It has three parts:
 *
 *   execution cost   = side · (WAEP − decision) · executedQty      (paid on filled shares)
 *   opportunity cost = side · (finalPrice − decision) · unfilled   (foregone move on unfilled shares)
 *   explicit cost    = commission                                   (currency)
 *
 * Positive shortfall is unfavorable. It is expressed in currency and in basis points of the decision
 * notional (`decision · orderQty`).
 */
import { BPS } from './constants';
import { sideMultiplier, type Side } from './types';

export interface ImplementationShortfall {
  readonly currency: number;
  readonly bps: number;
  readonly executionCostCurrency: number;
  readonly opportunityCostCurrency: number;
  readonly commissionCurrency: number;
}

export interface ShortfallInput {
  readonly side: Side;
  readonly decisionPrice: number;
  readonly weightedAvgPrice: number;
  readonly finalPrice: number;
  readonly executedQty: number;
  readonly orderQty: number;
  readonly commission: number;
}

export function implementationShortfall(input: ShortfallInput): ImplementationShortfall {
  const s = sideMultiplier(input.side);
  const unfilled = Math.max(0, input.orderQty - input.executedQty);
  const executionCost = s * (input.weightedAvgPrice - input.decisionPrice) * input.executedQty;
  const opportunityCost = s * (input.finalPrice - input.decisionPrice) * unfilled;
  const currency = executionCost + opportunityCost + input.commission;
  const decisionNotional = input.decisionPrice * input.orderQty;
  const bps = decisionNotional !== 0 ? (currency / decisionNotional) * BPS : 0;
  return {
    currency,
    bps,
    executionCostCurrency: executionCost,
    opportunityCostCurrency: opportunityCost,
    commissionCurrency: input.commission,
  };
}
