/**
 * Real adapter over the governed API gateway (performance-analytics service). NOT wired in v1.
 * Transport ONLY, through the `@platform/api-client` boundary — never infrastructure, never an
 * analytics runtime, never persistence. The metric catalog is served by the SDK for
 * definitions, or by the gateway when live.
 */
import type { ApiClient } from '@platform/api-client';
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
import type { ReportQuery } from '../domain/query';
import type { PerformanceRepository } from './repository';

function buildQueryString(query: ReportQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.namespace && query.namespace !== 'ALL') params.set('namespace', query.namespace);
  if (query.stage && query.stage !== 'ALL') params.set('stage', query.stage);
  if (query.subjectKind && query.subjectKind !== 'ALL')
    params.set('subjectKind', query.subjectKind);
  if (query.tag) params.set('tag', query.tag);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiPerformanceRepository implements PerformanceRepository {
  constructor(private readonly api: ApiClient) {}

  listReports(query: ReportQuery): Promise<readonly PerformanceReport[]> {
    return this.api.request<readonly PerformanceReport[]>(
      `/performance-analytics/reports${buildQueryString(query)}`,
    );
  }

  async getReport(id: string): Promise<PerformanceReport | null> {
    try {
      return await this.api.request<PerformanceReport>(`/performance-analytics/reports/${id}`);
    } catch {
      return null;
    }
  }

  listFamilies(): Promise<readonly ReportFamily[]> {
    return this.api.request<readonly ReportFamily[]>('/performance-analytics/families');
  }

  async metricCatalog(): Promise<readonly MetricDefinition[]> {
    return METRIC_CATALOG;
  }

  async metricCategories(): Promise<readonly MetricCategoryDescriptor[]> {
    return METRIC_CATEGORIES;
  }

  listBenchmarks(): Promise<readonly Benchmark[]> {
    return this.api.request<readonly Benchmark[]>('/performance-analytics/benchmarks');
  }

  reportsBySubject(subjectKind: SubjectKind): Promise<readonly PerformanceReport[]> {
    return this.api.request<readonly PerformanceReport[]>(
      `/performance-analytics/reports?subjectKind=${subjectKind}`,
    );
  }

  reviewQueue(): Promise<readonly PerformanceReport[]> {
    return this.api.request<readonly PerformanceReport[]>('/performance-analytics/queues/review');
  }

  approvalQueue(): Promise<readonly PerformanceReport[]> {
    return this.api.request<readonly PerformanceReport[]>('/performance-analytics/queues/approval');
  }

  listComparisons(): Promise<readonly PerformanceComparison[]> {
    return this.api.request<readonly PerformanceComparison[]>('/performance-analytics/comparisons');
  }

  async getComparison(id: string): Promise<PerformanceComparison | null> {
    try {
      return await this.api.request<PerformanceComparison>(
        `/performance-analytics/comparisons/${id}`,
      );
    } catch {
      return null;
    }
  }
}
