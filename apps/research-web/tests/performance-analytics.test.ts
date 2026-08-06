import { describe, it, expect } from 'vitest';
import {
  ANALYTICS_CAPABILITIES,
  REPORT_STAGES,
  METRIC_CATALOG,
  METRIC_CATEGORIES,
  reportKey,
} from '@platform/performance-sdk';
import { applyReportQuery } from '../src/modules/performance-analytics/domain/query';
import {
  toComparisonVm,
  toDetailVm,
  toListItemVm,
  toMetricCatalogVm,
  toSummaryVm,
} from '../src/modules/performance-analytics/domain/mappers';
import { PerformanceAdminService } from '../src/modules/performance-analytics/application/performance-analytics-service';
import {
  MockPerformanceRepository,
  PERFORMANCE_SEED,
} from '../src/modules/performance-analytics/data/mock-repository';

const { reports, families, comparisons } = PERFORMANCE_SEED;
const equityBt = reports.find((r) => r.id === 'PR-EQUITY-BT')!;

describe('@platform/performance-sdk vocabulary is shared', () => {
  it('exposes 7 report stages, 20 metric definitions and 7 categories', () => {
    expect(REPORT_STAGES).toHaveLength(7);
    expect(METRIC_CATALOG).toHaveLength(20);
    expect(METRIC_CATEGORIES).toHaveLength(7);
    expect(ANALYTICS_CAPABILITIES.length).toBeGreaterThanOrEqual(10);
  });
});

describe('applyReportQuery (pure filter/sort/search)', () => {
  it('filters by namespace, stage and subject kind', () => {
    expect(applyReportQuery(reports, { namespace: 'fx' }).every((r) => r.namespace === 'fx')).toBe(
      true,
    );
    expect(applyReportQuery(reports, { stage: 'PUBLISHED' })).toHaveLength(1);
    expect(applyReportQuery(reports, { subjectKind: 'PORTFOLIO' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, subject, owner and tags', () => {
    const result = applyReportQuery(reports, { search: 'reversal' });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.id).toBe('PR-EQUITY-BT');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with subject/stage/computation tones', () => {
    const vm = toListItemVm(equityBt);
    expect(vm.subject.label).toBe('Backtest');
    expect(vm.stage.label).toBe('Published');
    expect(vm.computation.label).toBe('Completed');
  });

  it('maps a detail with 7 stage steps, grouped metrics, benchmark and deep-linked deps', () => {
    const vm = toDetailVm(equityBt);
    expect(vm.key).toBe(reportKey(equityBt.namespace, equityBt.family, equityBt.name));
    expect(vm.stages).toHaveLength(7);
    expect(vm.metricGroups.length).toBeGreaterThan(0);
    expect(vm.metricGroups.some((g) => g.category === 'RISK_ADJUSTED')).toBe(true);
    expect(vm.benchmark?.rows.length).toBeGreaterThan(0);
    expect(vm.dependencies.find((d) => d.kind === 'BACKTEST')?.href).toBe(
      '/backtesting/bt-reversal',
    );
    expect(vm.subject.href).toBe('/backtesting/bt-reversal');
  });

  it('groups the metric catalog into categories (definitions only)', () => {
    const groups = toMetricCatalogVm(METRIC_CATALOG);
    expect(groups.length).toBe(7);
    const returns = groups.find((g) => g.category === 'RETURN')!;
    expect(returns.definitions.map((d) => d.key)).toContain('cagr');
    expect(returns.definitions[0]!.formulaDescription).toContain('runtime');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const vm = toComparisonVm(comparisons[0]!, reports);
    expect(vm.rows).toHaveLength(2);
    const row = vm.rows.find((r) => r.reportId === 'PR-EQUITY-BT')!;
    expect(row.cells.find((c) => c.key === 'sharpe_ratio')?.value).toBe('1.32');
  });

  it('summarizes by stage and subject', () => {
    const summary = toSummaryVm(
      reports,
      families.length,
      comparisons.length,
      METRIC_CATALOG.length,
    );
    expect(summary.totalReports).toBe(reports.length);
    expect(summary.computed).toBe(3);
    expect(summary.metrics).toBe(20);
    expect(summary.bySubject.length).toBe(5);
  });
});

describe('PerformanceAdminService (over the mock repository)', () => {
  const service = new PerformanceAdminService(new MockPerformanceRepository());

  it('lists reports, catalog, benchmarks and a single detail', async () => {
    expect(await service.listReports()).toHaveLength(reports.length);
    expect((await service.getMetricCatalog()).length).toBe(7);
    expect((await service.getMetricDefinition('sharpe_ratio'))?.label).toBe('Sharpe ratio');
    expect((await service.listBenchmarks()).length).toBe(3);
    expect(await service.getReport('nope')).toBeNull();
  });

  it('exposes subject reports, queues and comparisons', async () => {
    expect((await service.getSubjectReports('BACKTEST')).length).toBe(1);
    expect((await service.getReviewQueue()).some((i) => i.id === 'PR-EQUITY-PORT')).toBe(true);
    expect((await service.getApprovalQueue()).some((i) => i.id === 'PR-FX-LIVE')).toBe(true);
    expect((await service.getComparison('PCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalReports).toBe(reports.length);
  });
});
