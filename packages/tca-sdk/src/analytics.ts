/**
 * The analytics composition — the single entry point that turns one `ExecutionInput` into the full,
 * deterministic `ExecutionAnalytics` by composing every calculation module. Pure: no IO, no
 * randomness, no wall-clock, no market-data feed, no broker/exchange SDK, no FIX, no connectivity.
 * Given identical inputs it always yields identical outputs (CP-4 / RP-1).
 */
import { costAttribution, costBreakdown, commissionReport } from './cost';
import { marketImpactReport, totalImpactBps } from './impact';
import {
  averageExecutionPrice,
  executedQuantity,
  participationRate,
  weightedAverageExecutionPrice,
} from './prices';
import { benchmarkComparison, slippageReport } from './slippage';
import { executionEfficiency, executionQuality } from './scoring';
import { implementationShortfall } from './shortfall';
import { effectiveSpreadBps, realizedSpreadBps } from './spread';
import type { ExecutionAnalytics, ExecutionInput, TransactionCost } from './types';

/** Analyze a single execution end-to-end into the canonical `ExecutionAnalytics`. */
export function analyzeExecution(input: ExecutionInput): ExecutionAnalytics {
  const { benchmarks, side, fills } = input;
  const executedQty = executedQuantity(fills);
  const aep = averageExecutionPrice(fills);
  const waep = weightedAverageExecutionPrice(fills);
  const notional = Math.abs(waep * executedQty);
  const midAfter = input.midAfter ?? benchmarks.last;
  const participation = participationRate(executedQty, input.marketVolume);

  const benchmarkRows = benchmarkComparison(waep, benchmarks, side, executedQty);
  const slippage = slippageReport(waep, benchmarks, side);
  const impact = marketImpactReport(waep, benchmarks.arrival, midAfter, side);
  const effective = effectiveSpreadBps(waep, benchmarks.mid, side);
  const realized = realizedSpreadBps(waep, benchmarks.mid, midAfter, side);

  const shortfall = implementationShortfall({
    side,
    decisionPrice: benchmarks.decision,
    weightedAvgPrice: waep,
    finalPrice: benchmarks.last,
    executedQty,
    orderQty: input.orderQuantity,
    commission: input.commission,
  });

  const cost = costBreakdown({
    execPrice: waep,
    arrival: benchmarks.arrival,
    midAfter,
    side,
    quotedSpreadBps: input.spreadBps,
    commission: input.commission,
    notional,
  });
  const attribution = costAttribution(cost);
  const commission = commissionReport(input.commission, notional, executedQty);
  const efficiency = executionEfficiency(waep, benchmarks, side);
  const quality = executionQuality({
    slippageBps: slippage.vsArrivalBps,
    marketImpactBps: totalImpactBps(waep, benchmarks.arrival, side),
    commissionBps: commission.commissionBps,
    efficiency,
    participationRate: participation,
  });

  return {
    id: input.id,
    orderId: input.orderId,
    symbol: input.symbol,
    side,
    mode: input.mode,
    venue: input.venue,
    executedAt: input.executedAt,
    orderQuantity: input.orderQuantity,
    executedQuantity: executedQty,
    averageExecutionPrice: aep,
    weightedAverageExecutionPrice: waep,
    notional,
    participationRate: participation,
    effectiveSpreadBps: effective,
    realizedSpreadBps: realized,
    implementationShortfallBps: shortfall.bps,
    implementationShortfallCurrency: shortfall.currency,
    executionEfficiency: efficiency,
    benchmarks: benchmarkRows,
    cost,
    quality,
    slippage,
    commission,
    impact,
    attribution,
  };
}

/** Analyze many executions (order preserved). */
export function analyzeExecutions(
  inputs: readonly ExecutionInput[],
): readonly ExecutionAnalytics[] {
  return inputs.map(analyzeExecution);
}

/** The transaction-cost currency summary for an analyzed execution. */
export function transactionCost(analytics: ExecutionAnalytics): TransactionCost {
  return {
    notional: analytics.notional,
    totalCurrency: analytics.cost.totalCurrency,
    totalBps: analytics.cost.totalBps,
  };
}
