/**
 * Performance-analytics application service — the orchestration surface of the canonical
 * Performance Analytics Engine. It coordinates the report lifecycle (draft → requested →
 * computed → review → approved → published → archived), discovery/search, the metric
 * catalog/registry, benchmarks, subject-filtered reports, comparisons, the review and
 * approval queues, and computation/review/approval requests across the other subsystems
 * (Backtesting Engine, Execution Simulator, Live Trading Platform, Portfolio Construction
 * Engine, Research Engine, Validation Foundation, Workflow Engine, Configuration Foundation,
 * Monitoring Module, Analytics Runtime) through ports ONLY.
 *
 * It holds no infrastructure, no formulas, no metric calculation, no statistical algorithms
 * and no persistence. Search, aggregation, queue selection, subject filtering and comparison
 * assembly are pure domain decisions. Metric values are computed by the external analytics
 * runtime and reflected here; validation verdicts and approvals are decided elsewhere (CP-5).
 */
import {
  METRIC_CATALOG,
  METRIC_CATEGORIES,
  type Benchmark,
  type MetricCategoryDescriptor,
  type MetricDefinition,
  type PerformanceComparison,
  type PerformanceReport,
  type ReportFamily,
  type ReportStage,
  type ReportVersion,
  type SubjectKind,
} from '@platform/performance-sdk';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  reportsBySubject,
  reviewQueue,
  type AssembledComparison,
} from '../domain/derivations';
import { resolveByKey, searchReports, type ReportSearch } from '../domain/discovery';
import { proposedNextStage } from '../domain/lifecycle';
import type {
  AnalyticsRuntimePort,
  BenchmarkQueryPort,
  ComparisonQueryPort,
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  ReportQueryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface PerformanceAnalyticsSummary {
  readonly totalReports: number;
  readonly computed: number;
  readonly inReview: number;
  readonly awaitingApproval: number;
  readonly published: number;
  readonly families: number;
  readonly comparisons: number;
  readonly metrics: number;
  readonly byStage: readonly { readonly stage: ReportStage; readonly count: number }[];
  readonly bySubject: readonly { readonly subjectKind: SubjectKind; readonly count: number }[];
}

export interface PerformanceAnalyticsServiceDeps {
  readonly reports: ReportQueryPort;
  readonly families: FamilyQueryPort;
  readonly comparisons: ComparisonQueryPort;
  readonly benchmarks: BenchmarkQueryPort;
  readonly runtime: AnalyticsRuntimePort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class PerformanceAnalyticsService {
  constructor(private readonly deps: PerformanceAnalyticsServiceDeps) {}

  /** Performance Reports — every registered report. */
  listReports(): Promise<readonly PerformanceReport[]> {
    return this.deps.reports.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchReports(query: ReportSearch = {}): Promise<readonly PerformanceReport[]> {
    return searchReports(await this.deps.reports.list(), query);
  }

  /** Report details — resolve one report by id. */
  getReport(id: string): Promise<PerformanceReport | null> {
    return this.deps.reports.getById(id);
  }

  /** Resolve a report by its canonical `namespace/family/name` key. */
  async resolveReport(key: string): Promise<PerformanceReport | null> {
    return resolveByKey(await this.deps.reports.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<ReportVersion | null> {
    const report = await this.deps.reports.getById(id);
    return report ? currentVersion(report) : null;
  }

  /** The stage a report would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<ReportStage | null> {
    const report = await this.deps.reports.getById(id);
    return report ? proposedNextStage(report) : null;
  }

  /** Report family browsing. */
  listFamilies(): Promise<readonly ReportFamily[]> {
    return this.deps.families.list();
  }

  /** The Metric Catalog — canonical metric definitions (descriptors only; nothing computed). */
  metricCatalog(): readonly MetricDefinition[] {
    return METRIC_CATALOG;
  }

  /** The Metric Registry categories. */
  metricCategories(): readonly MetricCategoryDescriptor[] {
    return METRIC_CATEGORIES;
  }

  /** Benchmarks. */
  listBenchmarks(): Promise<readonly Benchmark[]> {
    return this.deps.benchmarks.list();
  }

  /** Reports evaluating a given subject kind (strategy / portfolio / backtest / live session). */
  async reportsBySubject(subjectKind: SubjectKind): Promise<readonly PerformanceReport[]> {
    return reportsBySubject(await this.deps.reports.list(), subjectKind);
  }

  /** Performance Review queue — reports in a review stage. */
  async reviewQueue(): Promise<readonly PerformanceReport[]> {
    return reviewQueue(await this.deps.reports.list());
  }

  /** Reports awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly PerformanceReport[]> {
    return approvalQueue(await this.deps.reports.list());
  }

  /** Performance comparisons. */
  listComparisons(): Promise<readonly PerformanceComparison[]> {
    return this.deps.comparisons.list();
  }

  /** Assemble a comparison table by pulling each report's supplied metric values. */
  async getComparison(id: string): Promise<AssembledComparison | null> {
    const comparison = await this.deps.comparisons.getById(id);
    if (!comparison) return null;
    return assembleComparison(comparison, await this.deps.reports.list());
  }

  /** Whether a report cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<PerformanceAnalyticsSummary> {
    const [reports, families, comparisons] = await Promise.all([
      this.deps.reports.list(),
      this.deps.families.list(),
      this.deps.comparisons.list(),
    ]);
    const stageCount = new Map<ReportStage, number>();
    for (const report of reports)
      stageCount.set(report.stage, (stageCount.get(report.stage) ?? 0) + 1);
    const subjectCount = new Map<SubjectKind, number>();
    for (const report of reports)
      subjectCount.set(report.subjectKind, (subjectCount.get(report.subjectKind) ?? 0) + 1);
    return {
      totalReports: reports.length,
      computed: reports.filter((r) => r.computation === 'COMPLETED').length,
      inReview: reviewQueue(reports).length,
      awaitingApproval: approvalQueue(reports).length,
      published: reports.filter((r) => r.stage === 'PUBLISHED' || r.stage === 'ARCHIVED').length,
      families: families.length,
      comparisons: comparisons.length,
      metrics: METRIC_CATALOG.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
      bySubject: [...subjectCount.entries()].map(([subjectKind, count]) => ({
        subjectKind,
        count,
      })),
    };
  }

  /**
   * Request metric computation from the analytics runtime. The metrics themselves are
   * computed by the external runtime; this only requests and records the request.
   */
  async requestComputation(reportId: string, at: string): Promise<boolean> {
    const report = await this.deps.reports.getById(reportId);
    if (!report) return false;
    await this.deps.runtime.requestComputation(reportId);
    await this.deps.workflow.scheduleComputation(reportId);
    await this.deps.bus.publish({
      id: `${reportId}:COMPUTATION_REQUESTED:${at}`,
      reportId,
      type: 'COMPUTATION_REQUESTED',
      message: `Computation requested for ${report.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request an independent review (verdict decided by the reviewer). */
  async requestReview(reportId: string, at: string): Promise<boolean> {
    const report = await this.deps.reports.getById(reportId);
    if (!report) return false;
    await this.deps.workflow.scheduleReview(reportId);
    await this.deps.bus.publish({
      id: `${reportId}:REVIEW_REQUESTED:${at}`,
      reportId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${report.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance approval (the decision is made by accountable humans). */
  async requestApproval(reportId: string, at: string): Promise<boolean> {
    const report = await this.deps.reports.getById(reportId);
    if (!report) return false;
    await this.deps.workflow.scheduleApproval(reportId);
    await this.deps.bus.publish({
      id: `${reportId}:APPROVAL_REQUESTED:${at}`,
      reportId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${report.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
