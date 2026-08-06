/**
 * Performance Analytics Engine repository boundary — the ONLY data abstraction the
 * application service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches the service tier, an analytics runtime, or persistence.
 */
import type {
  PerformanceReport,
  ReportFamily,
  PerformanceComparison,
  Benchmark,
  MetricDefinition,
  MetricCategoryDescriptor,
  SubjectKind,
} from '@platform/performance-sdk';
import type { ReportQuery } from '../domain/query';

export type { ReportQuery };

export interface PerformanceRepository {
  listReports(query: ReportQuery): Promise<readonly PerformanceReport[]>;
  getReport(id: string): Promise<PerformanceReport | null>;
  listFamilies(): Promise<readonly ReportFamily[]>;
  metricCatalog(): Promise<readonly MetricDefinition[]>;
  metricCategories(): Promise<readonly MetricCategoryDescriptor[]>;
  listBenchmarks(): Promise<readonly Benchmark[]>;
  reportsBySubject(subjectKind: SubjectKind): Promise<readonly PerformanceReport[]>;
  reviewQueue(): Promise<readonly PerformanceReport[]>;
  approvalQueue(): Promise<readonly PerformanceReport[]>;
  listComparisons(): Promise<readonly PerformanceComparison[]>;
  getComparison(id: string): Promise<PerformanceComparison | null>;
}
