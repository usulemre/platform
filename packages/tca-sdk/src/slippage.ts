/**
 * Slippage and benchmark-comparison calculations — REAL, pure, deterministic. Slippage is measured
 * against a benchmark price with the cost sign convention: positive slippage is unfavorable (for a
 * BUY, paying above the benchmark; for a SELL, selling below it). `sideMultiplier` encodes the sign.
 */
import { toBps } from './prices';
import {
  sideMultiplier,
  type BenchmarkPrices,
  type BenchmarkType,
  type ExecutionBenchmark,
  type Side,
  type SlippageReport,
} from './types';

/** The eight supported benchmark types, in catalog order. */
export const BENCHMARK_TYPES: readonly BenchmarkType[] = [
  'ARRIVAL',
  'DECISION',
  'VWAP',
  'TWAP',
  'CLOSE',
  'OPEN',
  'MID',
  'LAST',
];

/** Resolve a benchmark price from the benchmark set. */
export function benchmarkPrice(type: BenchmarkType, prices: BenchmarkPrices): number {
  switch (type) {
    case 'ARRIVAL':
      return prices.arrival;
    case 'DECISION':
      return prices.decision;
    case 'VWAP':
      return prices.vwap;
    case 'TWAP':
      return prices.twap;
    case 'CLOSE':
      return prices.close;
    case 'OPEN':
      return prices.open;
    case 'MID':
      return prices.mid;
    case 'LAST':
      return prices.last;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

/**
 * Slippage in basis points relative to `benchmark` for a given side:
 * `side · (execPrice − benchmark) / benchmark · 10000`. Positive is a cost.
 */
export function slippageBps(execPrice: number, benchmark: number, side: Side): number {
  return sideMultiplier(side) * toBps(execPrice - benchmark, benchmark);
}

/** Slippage in currency: `side · (execPrice − benchmark) · quantity`. Positive is a cost. */
export function slippageCurrency(
  execPrice: number,
  benchmark: number,
  side: Side,
  quantity: number,
): number {
  return sideMultiplier(side) * (execPrice - benchmark) * quantity;
}

/** Compare an execution to a single benchmark. `favorable` is true when execution beat the benchmark. */
export function compareBenchmark(
  type: BenchmarkType,
  execPrice: number,
  prices: BenchmarkPrices,
  side: Side,
  quantity: number,
): ExecutionBenchmark {
  const price = benchmarkPrice(type, prices);
  const bps = slippageBps(execPrice, price, side);
  return {
    type,
    price,
    slippageBps: bps,
    slippageCurrency: slippageCurrency(execPrice, price, side, quantity),
    favorable: bps < 0,
  };
}

/** Compare an execution to all eight benchmarks. */
export function benchmarkComparison(
  execPrice: number,
  prices: BenchmarkPrices,
  side: Side,
  quantity: number,
): readonly ExecutionBenchmark[] {
  return BENCHMARK_TYPES.map((type) => compareBenchmark(type, execPrice, prices, side, quantity));
}

/** The slippage report across the primary benchmarks (basis points, cost sign). */
export function slippageReport(
  execPrice: number,
  prices: BenchmarkPrices,
  side: Side,
): SlippageReport {
  return {
    vsArrivalBps: slippageBps(execPrice, prices.arrival, side),
    vsDecisionBps: slippageBps(execPrice, prices.decision, side),
    vsVwapBps: slippageBps(execPrice, prices.vwap, side),
    vsTwapBps: slippageBps(execPrice, prices.twap, side),
    vsMidBps: slippageBps(execPrice, prices.mid, side),
    vsCloseBps: slippageBps(execPrice, prices.close, side),
  };
}
