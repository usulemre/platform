import { describe, it, expect } from 'vitest';
import {
  BENCHMARK_CATALOG,
  BENCHMARK_TYPES,
  TCA_METRIC_CATALOG,
  aggregate,
  analyzeExecution,
  analyzeExecutions,
  averageExecutionPrice,
  benchmarkComparison,
  commissionReport,
  compareVenues,
  costAttribution,
  costBreakdown,
  effectiveSpreadBps,
  executedNotional,
  executedQuantity,
  executionEfficiency,
  executionScore,
  fillRate,
  gradeFor,
  implementationShortfall,
  marketImpactReport,
  participationRate,
  realizedSpreadBps,
  slippageBps,
  slippageReport,
  transactionCost,
  weightedAverageExecutionPrice,
  type BenchmarkPrices,
  type ExecutionInput,
  type Fill,
} from '../src/index';

const FILLS: readonly Fill[] = [
  { quantity: 600, price: 100.1, at: '2026-08-01T15:00:00.000Z', venue: 'XNAS' },
  { quantity: 400, price: 100.35, at: '2026-08-01T15:01:00.000Z', venue: 'XNAS' },
];

const BENCH: BenchmarkPrices = {
  arrival: 100.0,
  decision: 99.9,
  vwap: 100.15,
  twap: 100.2,
  open: 99.95,
  close: 100.4,
  mid: 100.05,
  last: 100.3,
};

function buyInput(overrides: Partial<ExecutionInput> = {}): ExecutionInput {
  return {
    id: 'TCA-1',
    orderId: 'ORD-1',
    symbol: 'AAPL',
    side: 'BUY',
    orderQuantity: 1000,
    fills: FILLS,
    benchmarks: BENCH,
    commission: 5,
    spreadBps: 4,
    marketVolume: 50_000,
    midAfter: 100.2,
    venue: 'XNAS',
    mode: 'PAPER',
    executedAt: '2026-08-01T15:01:00.000Z',
    ...overrides,
  };
}

describe('prices', () => {
  it('averages fill prices equally', () => {
    expect(averageExecutionPrice(FILLS)).toBeCloseTo((100.1 + 100.35) / 2, 10);
  });
  it('weights execution price by quantity', () => {
    expect(weightedAverageExecutionPrice(FILLS)).toBeCloseTo(
      (600 * 100.1 + 400 * 100.35) / 1000,
      10,
    );
  });
  it('sums executed quantity and notional', () => {
    expect(executedQuantity(FILLS)).toBe(1000);
    expect(executedNotional(FILLS)).toBeCloseTo(600 * 100.1 + 400 * 100.35, 6);
  });
  it('returns NaN for empty fills', () => {
    expect(averageExecutionPrice([])).toBeNaN();
    expect(weightedAverageExecutionPrice([])).toBeNaN();
  });
  it('computes participation and fill rates with guards', () => {
    expect(participationRate(1000, 50_000)).toBeCloseTo(0.02, 10);
    expect(participationRate(1000, 0)).toBe(0);
    expect(fillRate(1000, 1000)).toBe(1);
    expect(fillRate(1500, 1000)).toBe(1); // clamped
    expect(fillRate(1000, 0)).toBe(0);
  });
});

describe('slippage', () => {
  const waep = weightedAverageExecutionPrice(FILLS);
  it('is positive (a cost) for a BUY above the benchmark', () => {
    expect(slippageBps(waep, BENCH.arrival, 'BUY')).toBeGreaterThan(0);
  });
  it('flips sign for a SELL', () => {
    expect(slippageBps(waep, BENCH.arrival, 'SELL')).toBeCloseTo(
      -slippageBps(waep, BENCH.arrival, 'BUY'),
      10,
    );
  });
  it('marks favorable when execution beats the benchmark', () => {
    const rows = benchmarkComparison(waep, BENCH, 'BUY', 1000);
    expect(rows).toHaveLength(8);
    const close = rows.find((r) => r.type === 'CLOSE')!; // close 100.4 > waep => favorable buy
    expect(close.favorable).toBe(true);
    expect(close.slippageBps).toBeLessThan(0);
  });
  it('reports slippage against the primary benchmarks', () => {
    const rep = slippageReport(waep, BENCH, 'BUY');
    expect(rep.vsArrivalBps).toBeCloseTo(slippageBps(waep, BENCH.arrival, 'BUY'), 10);
    expect(rep.vsVwapBps).toBeCloseTo(slippageBps(waep, BENCH.vwap, 'BUY'), 10);
  });
});

describe('spread and impact decomposition', () => {
  const waep = weightedAverageExecutionPrice(FILLS);
  it('effective spread = realized spread + price impact', () => {
    const eff = effectiveSpreadBps(waep, BENCH.mid, 'BUY');
    const realized = realizedSpreadBps(waep, BENCH.mid, 100.2, 'BUY');
    const priceImpact = ((2 * (100.2 - BENCH.mid)) / BENCH.mid) * 10000;
    expect(eff).toBeCloseTo(realized + priceImpact, 8);
  });
  it('market impact is additive: total = permanent + temporary', () => {
    const rep = marketImpactReport(waep, BENCH.arrival, 100.2, 'BUY');
    expect(rep.totalBps).toBeCloseTo(rep.permanentBps + rep.temporaryBps, 10);
  });
});

describe('implementation shortfall', () => {
  it('adds execution, opportunity and commission costs', () => {
    const waep = weightedAverageExecutionPrice(FILLS);
    const is = implementationShortfall({
      side: 'BUY',
      decisionPrice: BENCH.decision,
      weightedAvgPrice: waep,
      finalPrice: BENCH.last,
      executedQty: 1000,
      orderQty: 1000,
      commission: 5,
    });
    const expectedExec = (waep - BENCH.decision) * 1000;
    expect(is.executionCostCurrency).toBeCloseTo(expectedExec, 6);
    expect(is.opportunityCostCurrency).toBe(0); // fully filled
    expect(is.currency).toBeCloseTo(expectedExec + 5, 6);
  });
  it('charges opportunity cost on the unfilled portion', () => {
    const waep = weightedAverageExecutionPrice(FILLS);
    const is = implementationShortfall({
      side: 'BUY',
      decisionPrice: BENCH.decision,
      weightedAvgPrice: waep,
      finalPrice: BENCH.last,
      executedQty: 1000,
      orderQty: 1500,
      commission: 5,
    });
    expect(is.opportunityCostCurrency).toBeCloseTo((BENCH.last - BENCH.decision) * 500, 6);
  });
});

describe('cost breakdown', () => {
  const waep = weightedAverageExecutionPrice(FILLS);
  const notional = waep * 1000;
  const cost = costBreakdown({
    execPrice: waep,
    arrival: BENCH.arrival,
    midAfter: 100.2,
    side: 'BUY',
    quotedSpreadBps: 4,
    commission: 5,
    notional,
  });
  it('is exactly additive in basis points', () => {
    expect(
      cost.slippageBps + cost.spreadBps + cost.marketImpactBps + cost.commissionBps,
    ).toBeCloseTo(cost.totalBps, 8);
  });
  it('is exactly additive in currency', () => {
    expect(
      cost.slippageCurrency +
        cost.spreadCurrency +
        cost.marketImpactCurrency +
        cost.commissionCurrency,
    ).toBeCloseTo(cost.totalCurrency, 6);
  });
  it('reports commission per share and bps', () => {
    const rep = commissionReport(5, notional, 1000);
    expect(rep.perShare).toBeCloseTo(0.005, 10);
    expect(rep.commissionBps).toBeCloseTo((5 / notional) * 10000, 10);
  });
  it('attribution shares sum to ~1 and cover four components', () => {
    const attr = costAttribution(cost);
    expect(attr.components).toHaveLength(4);
    expect(attr.components.reduce((a, c) => a + c.share, 0)).toBeCloseTo(1, 8);
  });
});

describe('scoring', () => {
  it('efficiency is within [0,1] and rewards a better price for a BUY', () => {
    const good = executionEfficiency(BENCH.arrival - 1, BENCH, 'BUY');
    const bad = executionEfficiency(BENCH.close + 1, BENCH, 'BUY');
    expect(good).toBeGreaterThanOrEqual(bad);
    expect(good).toBeLessThanOrEqual(1);
    expect(bad).toBeGreaterThanOrEqual(0);
  });
  it('score is 0-100 with weights summing to 1', () => {
    const s = executionScore({
      slippageBps: 5,
      marketImpactBps: 3,
      commissionBps: 1,
      efficiency: 0.8,
      participationRate: 0.02,
    });
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(s.components.reduce((a, c) => a + c.weight, 0)).toBeCloseTo(1, 10);
  });
  it('grades by band', () => {
    expect(gradeFor(95)).toBe('A');
    expect(gradeFor(85)).toBe('B');
    expect(gradeFor(75)).toBe('C');
    expect(gradeFor(65)).toBe('D');
    expect(gradeFor(40)).toBe('F');
  });
  it('a cheap execution scores higher than an expensive one', () => {
    const cheap = executionScore({
      slippageBps: 1,
      marketImpactBps: 1,
      commissionBps: 0.5,
      efficiency: 0.95,
      participationRate: 0.01,
    });
    const dear = executionScore({
      slippageBps: 45,
      marketImpactBps: 28,
      commissionBps: 18,
      efficiency: 0.1,
      participationRate: 0.9,
    });
    expect(cheap.score).toBeGreaterThan(dear.score);
  });
});

describe('analyzeExecution', () => {
  it('is deterministic', () => {
    expect(analyzeExecution(buyInput())).toEqual(analyzeExecution(buyInput()));
  });
  it('produces a complete, consistent analytics object', () => {
    const a = analyzeExecution(buyInput());
    expect(a.executedQuantity).toBe(1000);
    expect(a.weightedAverageExecutionPrice).toBeCloseTo(100.2, 10);
    expect(a.benchmarks).toHaveLength(8);
    expect(a.notional).toBeCloseTo(100.2 * 1000, 6);
    const tc = transactionCost(a);
    expect(tc.totalBps).toBeCloseTo(a.cost.totalBps, 10);
  });
  it('falls back to the last price when no post-trade mid is supplied', () => {
    const a = analyzeExecution(buyInput({ midAfter: undefined }));
    expect(Number.isFinite(a.impact.totalBps)).toBe(true);
  });
});

describe('aggregation', () => {
  const many = analyzeExecutions([
    buyInput({ id: 'A', venue: 'XNAS' }),
    buyInput({
      id: 'B',
      venue: 'ARCA',
      fills: [{ quantity: 1000, price: 100.5, at: BENCH.last, venue: 'ARCA' }],
    }),
    buyInput({ id: 'C', venue: 'XNAS' }),
  ]);
  it('compares venues and sorts by total cost ascending', () => {
    const venues = compareVenues(many);
    expect(venues.map((v) => v.venueId).sort()).toEqual(['ARCA', 'XNAS']);
    for (let i = 1; i < venues.length; i += 1)
      expect(venues[i]!.avgTotalCostBps).toBeGreaterThanOrEqual(venues[i - 1]!.avgTotalCostBps);
    expect(venues.find((v) => v.venueId === 'XNAS')!.executions).toBe(2);
  });
  it('rolls up a portfolio-level aggregate', () => {
    const agg = aggregate(many);
    expect(agg.executions).toBe(3);
    expect(agg.totalNotional).toBeGreaterThan(0);
    expect(agg.favorableRate).toBeGreaterThanOrEqual(0);
    expect(agg.favorableRate).toBeLessThanOrEqual(1);
  });
  it('handles the empty set without dividing by zero', () => {
    const agg = aggregate([]);
    expect(agg.executions).toBe(0);
    expect(agg.avgTotalCostBps).toBe(0);
    expect(agg.favorableRate).toBe(0);
  });
});

describe('catalogs', () => {
  it('exposes all eight benchmarks', () => {
    expect(BENCHMARK_CATALOG).toHaveLength(8);
    expect(BENCHMARK_CATALOG.map((b) => b.type).sort()).toEqual([...BENCHMARK_TYPES].sort());
  });
  it('describes metrics without embedding code', () => {
    expect(TCA_METRIC_CATALOG.length).toBeGreaterThan(0);
    for (const m of TCA_METRIC_CATALOG) {
      expect(m.description).not.toMatch(/[=*/]{1,}\s*10000|Math\.|=>/);
      expect(m.description.length).toBeGreaterThan(10);
    }
  });
});
