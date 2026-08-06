import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_CAPABILITIES,
  REPORT_STAGES,
  METRIC_CATALOG,
  METRIC_CATEGORIES,
  describeMetric,
  metricsInCategory,
  reportKey,
  describeStage,
  nextStage,
} from '@platform/performance-sdk';
import { resolveByKey, searchReports } from '../src/domain/discovery';
import { overallApproval, proposedNextStage } from '../src/domain/lifecycle';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  reportsBySubject,
  reviewQueue,
} from '../src/domain/derivations';
import { createPerformanceAnalyticsService } from '../src/composition';
import { REPORTS, COMPARISONS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-04T00:00:00.000Z';
const equityBt = REPORTS.find((r) => r.id === 'PR-EQUITY-BT')!;

describe('@platform/performance-sdk vocabulary', () => {
  it('orders 7 report stages and 20 metric definitions (definitions only)', () => {
    expect(REPORT_STAGES).toHaveLength(7);
    expect(REPORT_STAGES[0]).toBe('DRAFT');
    expect(REPORT_STAGES[6]).toBe('ARCHIVED');
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('REVIEW').gate).toBe(true);
    expect(describeStage('APPROVED').gate).toBe(true);
    expect(METRIC_CATALOG).toHaveLength(20);
    expect(describeMetric('sharpe_ratio')?.category).toBe('RISK_ADJUSTED');
    expect(describeMetric('sharpe_ratio')?.formulaDescription).toContain(
      'computed by the analytics runtime',
    );
  });

  it('groups the catalog into 7 categories and exposes capabilities', () => {
    expect(METRIC_CATEGORIES).toHaveLength(7);
    expect(metricsInCategory('RETURN').map((m) => m.key)).toContain('cagr');
    expect(metricsInCategory('DRAWDOWN').length).toBe(3);
    expect(ANALYTICS_CAPABILITIES.length).toBeGreaterThanOrEqual(10);
    expect(reportKey('Equities', 'Reversal', 'Equity BT')).toBe('equities/reversal/equity-bt');
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace, stage and subject kind', () => {
    expect(searchReports(REPORTS, { namespace: 'fx' }).every((r) => r.namespace === 'fx')).toBe(
      true,
    );
    expect(searchReports(REPORTS, { stage: 'PUBLISHED' })).toHaveLength(1);
    expect(searchReports(REPORTS, { subjectKind: 'PORTFOLIO' })).toHaveLength(1);
  });

  it('resolves a report by its canonical key', () => {
    const key = reportKey(equityBt.namespace, equityBt.family, equityBt.name);
    expect(resolveByKey(REPORTS, key)?.id).toBe('PR-EQUITY-BT');
    expect(resolveByKey(REPORTS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('derives approval, next stage, queues and subject filters', () => {
    expect(overallApproval(equityBt)).toBe('APPROVED');
    expect(proposedNextStage(equityBt)).toBe('ARCHIVED');
    expect(reviewQueue(REPORTS).some((r) => r.id === 'PR-EQUITY-PORT')).toBe(true);
    expect(approvalQueue(REPORTS).some((r) => r.id === 'PR-FX-LIVE')).toBe(true);
    expect(reportsBySubject(REPORTS, 'BACKTEST').length).toBe(1);
    expect(reportsBySubject(REPORTS, 'LIVE_SESSION').length).toBe(1);
    expect(currentVersion(equityBt)?.version).toBe('2.0.0');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const assembled = assembleComparison(COMPARISONS[0]!, REPORTS);
    expect(assembled.rows).toHaveLength(2);
    expect(assembled.rows[0]!.values.sharpe_ratio).toBe('1.32');
    expect(assembled.rows.find((r) => r.reportId === 'PR-EQUITY-PORT')?.values.sharpe_ratio).toBe(
      '1.48',
    );
  });
});

describe('PerformanceAnalyticsService (over in-memory ports)', () => {
  const service = createPerformanceAnalyticsService();

  it('lists the registry, catalog, categories and benchmarks', async () => {
    expect(await service.listReports()).toHaveLength(REPORTS.length);
    expect(service.metricCatalog()).toHaveLength(20);
    expect(service.metricCategories()).toHaveLength(7);
    expect((await service.listBenchmarks()).length).toBe(3);
    expect(await service.getReport('nope')).toBeNull();
  });

  it('summarizes by stage, subject, computation and metric-catalog size', async () => {
    const summary = await service.getSummary();
    expect(summary.totalReports).toBe(REPORTS.length);
    expect(summary.computed).toBe(3);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.published).toBe(1);
    expect(summary.metrics).toBe(20);
    expect(summary.byStage.length).toBeGreaterThan(0);
    expect(summary.bySubject.length).toBe(5);
  });

  it('assembles a comparison and lists subject reports', async () => {
    expect((await service.getComparison('PCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
    expect((await service.reportsBySubject('STRATEGY')).length).toBe(1);
  });

  it('records computation/review/approval requests; false for unknown', async () => {
    expect(await service.requestComputation('PR-CRYPTO-SIM', AT)).toBe(true);
    expect(await service.requestReview('PR-EQUITY-PORT', AT)).toBe(true);
    expect(await service.requestApproval('PR-FX-LIVE', AT)).toBe(true);
    expect(await service.requestComputation('nope', AT)).toBe(false);
  });

  it('reflects validation status decided elsewhere', async () => {
    expect(await service.isValidated('PR-EQUITY-BT')).toBe(true);
    expect(await service.isValidated('PR-VOL-STRAT')).toBe(false);
  });
});
