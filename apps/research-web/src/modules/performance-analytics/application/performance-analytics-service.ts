/**
 * Performance Analytics Engine application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No infrastructure, no
 * formulas, no metric calculation, no statistical algorithms, no persistence. Aggregation and
 * comparison assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toBenchmarkListVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toFamilyVm,
  toListItemVm,
  toMetricCatalogVm,
  toMetricDefinitionVm,
  toReviewQueueItemVm,
  toSubjectItemVm,
  toSummaryVm,
} from '../domain/mappers';
import type { ReportQuery } from '../domain/query';
import type { SubjectKind } from '../domain/dto';
import type {
  BenchmarkListVm,
  ComparisonListItemVm,
  ComparisonVm,
  MetricCategoryGroupVm,
  MetricDefinitionVm,
  PerformanceSummaryVm,
  QueueItemVm,
  ReportDetailVm,
  ReportFamilyVm,
  ReportListItemVm,
} from '../domain/view-model';
import type { PerformanceRepository } from '../data/repository';

export class PerformanceAdminService {
  constructor(private readonly repository: PerformanceRepository) {}

  async listReports(query: ReportQuery = {}): Promise<ReportListItemVm[]> {
    return (await this.repository.listReports(query)).map(toListItemVm);
  }

  async getReport(id: string): Promise<ReportDetailVm | null> {
    const report = await this.repository.getReport(id);
    return report ? toDetailVm(report) : null;
  }

  async listFamilies(): Promise<ReportFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  /** Metric Catalog — canonical definitions grouped by category (descriptors only). */
  async getMetricCatalog(): Promise<MetricCategoryGroupVm[]> {
    return toMetricCatalogVm(await this.repository.metricCatalog());
  }

  /** Metric Explorer — a single metric definition by key. */
  async getMetricDefinition(key: string): Promise<MetricDefinitionVm | null> {
    const definition = (await this.repository.metricCatalog()).find((entry) => entry.key === key);
    return definition ? toMetricDefinitionVm(definition) : null;
  }

  async listBenchmarks(): Promise<BenchmarkListVm[]> {
    return (await this.repository.listBenchmarks()).map(toBenchmarkListVm);
  }

  async getSubjectReports(subjectKind: SubjectKind): Promise<QueueItemVm[]> {
    return (await this.repository.reportsBySubject(subjectKind)).map(toSubjectItemVm);
  }

  async getReviewQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.reviewQueue()).map(toReviewQueueItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  async listComparisons(): Promise<ComparisonListItemVm[]> {
    return (await this.repository.listComparisons()).map(toComparisonListItemVm);
  }

  async getComparison(id: string): Promise<ComparisonVm | null> {
    const comparison = await this.repository.getComparison(id);
    if (!comparison) return null;
    const reports = await this.repository.listReports({});
    return toComparisonVm(comparison, reports);
  }

  async getSummary(): Promise<PerformanceSummaryVm> {
    const [reports, families, comparisons, metrics] = await Promise.all([
      this.repository.listReports({}),
      this.repository.listFamilies(),
      this.repository.listComparisons(),
      this.repository.metricCatalog(),
    ]);
    return toSummaryVm(reports, families.length, comparisons.length, metrics.length);
  }
}
