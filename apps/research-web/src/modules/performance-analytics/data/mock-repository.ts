/**
 * In-memory mock adapter for the Performance Analytics Engine UI. Synthetic performance
 * METADATA ONLY — NO formulas, NO metric calculation, NO statistical algorithms, no
 * persistence. Strategy/portfolio/backtest/live-session/simulation references use the other
 * modules' ids so cross-links resolve; metric VALUES, series points and benchmark values are
 * inert strings. This is the UI's own mock, independent of the service tier. Metric
 * DEFINITIONS come from the shared SDK catalog.
 */
import {
  METRIC_CATALOG,
  METRIC_CATEGORIES,
  type PerformanceReport,
  type ReportFamily,
  type PerformanceComparison,
  type Benchmark,
  type MetricDefinition,
  type MetricCategoryDescriptor,
  type SubjectKind,
} from '@platform/performance-sdk';
import { applyReportQuery, type ReportQuery } from '../domain/query';
import type { PerformanceRepository } from './repository';
import { PERFORMANCE_SEED } from './seed';

const {
  reports: REPORTS,
  families: FAMILIES,
  comparisons: COMPARISONS,
  benchmarks: BENCHMARKS,
} = PERFORMANCE_SEED;

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockPerformanceRepository implements PerformanceRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async listReports(query: ReportQuery): Promise<readonly PerformanceReport[]> {
    await this.delay();
    return applyReportQuery(REPORTS, query);
  }

  async getReport(id: string): Promise<PerformanceReport | null> {
    await this.delay();
    return REPORTS.find((report) => report.id === id) ?? null;
  }

  async listFamilies(): Promise<readonly ReportFamily[]> {
    await this.delay();
    return FAMILIES;
  }

  async metricCatalog(): Promise<readonly MetricDefinition[]> {
    await this.delay();
    return METRIC_CATALOG;
  }

  async metricCategories(): Promise<readonly MetricCategoryDescriptor[]> {
    await this.delay();
    return METRIC_CATEGORIES;
  }

  async listBenchmarks(): Promise<readonly Benchmark[]> {
    await this.delay();
    return BENCHMARKS;
  }

  async reportsBySubject(subjectKind: SubjectKind): Promise<readonly PerformanceReport[]> {
    await this.delay();
    return REPORTS.filter((report) => report.subjectKind === subjectKind);
  }

  async reviewQueue(): Promise<readonly PerformanceReport[]> {
    await this.delay();
    return REPORTS.filter(
      (report) => report.stage === 'REVIEW' || report.reviews.some((r) => r.status === 'PENDING'),
    );
  }

  async approvalQueue(): Promise<readonly PerformanceReport[]> {
    await this.delay();
    return REPORTS.filter((report) =>
      report.approvals.some((approval) => approval.status === 'PENDING'),
    );
  }

  async listComparisons(): Promise<readonly PerformanceComparison[]> {
    await this.delay();
    return COMPARISONS;
  }

  async getComparison(id: string): Promise<PerformanceComparison | null> {
    await this.delay();
    return COMPARISONS.find((comparison) => comparison.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export { PERFORMANCE_SEED };
