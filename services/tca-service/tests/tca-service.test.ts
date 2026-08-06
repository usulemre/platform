import { describe, it, expect } from 'vitest';
import { analyzeExecution } from '@platform/tca-sdk';
import { buildCostReport } from '../src/domain/reports';
import { buildScorecards } from '../src/domain/scorecards';
import { computeTcaMetrics } from '../src/domain/metrics';
import { applyExecutionSearch } from '../src/domain/search';
import { EXECUTIONS } from '../src/infrastructure/in-memory/seed';
import { createTcaService } from '../src/composition';

const AT = '2026-08-05T12:00:00.000Z';
const ANALYZED = EXECUTIONS.map(analyzeExecution);

/* --------------------------------- unit --------------------------------- */

describe('seed executions', () => {
  it('are well-formed post-trade records', () => {
    expect(EXECUTIONS.length).toBeGreaterThanOrEqual(12);
    for (const e of EXECUTIONS) {
      expect(e.fills.length).toBeGreaterThan(0);
      const executed = e.fills.reduce((q, f) => q + f.quantity, 0);
      expect(executed).toBeGreaterThan(0);
      expect(executed).toBeLessThanOrEqual(e.orderQuantity);
      expect(e.benchmarks.arrival).toBeGreaterThan(0);
    }
  });
  it('analyze into finite, complete analytics', () => {
    for (const a of ANALYZED) {
      expect(Number.isFinite(a.cost.totalBps)).toBe(true);
      expect(a.quality.score).toBeGreaterThanOrEqual(0);
      expect(a.quality.score).toBeLessThanOrEqual(100);
      expect(a.benchmarks).toHaveLength(8);
      expect(
        a.cost.slippageBps + a.cost.spreadBps + a.cost.marketImpactBps + a.cost.commissionBps,
      ).toBeCloseTo(a.cost.totalBps, 6);
    }
  });
});

describe('search (pure)', () => {
  it('filters by symbol/venue/side/mode and search term', () => {
    expect(
      applyExecutionSearch(EXECUTIONS, { symbol: 'AAPL' }).every((e) => e.symbol === 'AAPL'),
    ).toBe(true);
    expect(applyExecutionSearch(EXECUTIONS, { side: 'SELL' }).every((e) => e.side === 'SELL')).toBe(
      true,
    );
    expect(applyExecutionSearch(EXECUTIONS, { mode: 'LIVE' }).every((e) => e.mode === 'LIVE')).toBe(
      true,
    );
    expect(
      applyExecutionSearch(EXECUTIONS, { search: 'tsla' }).every((e) => e.symbol === 'TSLA'),
    ).toBe(true);
  });
  it('sorts deterministically', () => {
    const asc = applyExecutionSearch(EXECUTIONS, { sortBy: 'executedAt', sortDir: 'asc' });
    for (let i = 1; i < asc.length; i += 1)
      expect(asc[i]!.executedAt >= asc[i - 1]!.executedAt).toBe(true);
  });
});

describe('cost report (pure)', () => {
  it('groups by venue with additive totals and worst-first ordering', () => {
    const report = buildCostReport(ANALYZED, 'VENUE', AT);
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.rows.reduce((n, r) => n + r.executions, 0)).toBe(ANALYZED.length);
    for (let i = 1; i < report.rows.length; i += 1)
      expect(report.rows[i]!.avgTotalCostBps).toBeLessThanOrEqual(
        report.rows[i - 1]!.avgTotalCostBps,
      );
    expect(report.totals.executions).toBe(ANALYZED.length);
  });
  it('supports symbol/side/mode grouping', () => {
    expect(buildCostReport(ANALYZED, 'SYMBOL', AT).rows.length).toBeGreaterThan(1);
    expect(buildCostReport(ANALYZED, 'SIDE', AT).rows.length).toBe(2);
    expect(buildCostReport(ANALYZED, 'MODE', AT).rows.length).toBeGreaterThanOrEqual(2);
  });
});

describe('scorecards (pure)', () => {
  it('scores venues best-first with a grade distribution', () => {
    const cards = buildScorecards(ANALYZED, 'VENUE');
    expect(cards.length).toBeGreaterThan(0);
    for (let i = 1; i < cards.length; i += 1)
      expect(cards[i]!.avgScore).toBeLessThanOrEqual(cards[i - 1]!.avgScore);
    for (const c of cards) {
      expect('ABCDF').toContain(c.grade);
      expect(c.gradeDistribution.reduce((n, b) => n + b.count, 0)).toBe(c.executions);
      expect(c.bestScore).toBeGreaterThanOrEqual(c.worstScore);
    }
  });
});

describe('metrics (pure)', () => {
  it('rolls up totals, venues, grades and benchmark averages', () => {
    const m = computeTcaMetrics(ANALYZED);
    expect(m.totals.executions).toBe(ANALYZED.length);
    expect(m.byVenue.length).toBeGreaterThan(0);
    expect(m.benchmarkAverages).toHaveLength(8);
    expect(m.byGrade.reduce((n, g) => n + g.count, 0)).toBe(ANALYZED.length);
  });
});

/* ------------------------------ integration ------------------------------ */

describe('TcaService (integration over in-memory ports)', () => {
  it('lists, analyzes and aggregates', async () => {
    const service = createTcaService();
    expect((await service.listExecutions()).length).toBe(EXECUTIONS.length);
    const one = await service.analyze('TCA-0001');
    expect(one?.weightedAverageExecutionPrice).toBeGreaterThan(0);
    expect(await service.analyze('NOPE')).toBeNull();
    const agg = await service.aggregate();
    expect(agg.executions).toBe(EXECUTIONS.length);
    expect((await service.venueComparison()).length).toBeGreaterThan(0);
    expect((await service.metrics()).benchmarkAverages).toHaveLength(8);
    expect((await service.costReport('VENUE', AT)).rows.length).toBeGreaterThan(0);
    expect((await service.scorecards('SYMBOL')).length).toBeGreaterThan(0);
    expect(service.listBenchmarks()).toHaveLength(8);
    expect(service.listMetricDefinitions().length).toBeGreaterThan(0);
  });

  it('ingests a new execution and analyzes it', async () => {
    const service = createTcaService();
    const seed = EXECUTIONS[0]!;
    const analytics = await service.ingestExecution({ ...seed, id: 'TCA-NEW-1' }, 'tester', AT);
    expect(analytics?.id).toBe('TCA-NEW-1');
    expect((await service.getExecution('TCA-NEW-1'))?.id).toBe('TCA-NEW-1');
  });
});
