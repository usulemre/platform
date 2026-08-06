/**
 * Canonical Performance Analytics Engine contracts — the shared, transport-agnostic models
 * the performance-analytics service and its UIs both speak. Inert data only; NO formulas,
 * NO metric calculation, NO statistical algorithms, no secrets. Strategies, portfolios,
 * backtests, live sessions and simulations are referenced by ref ONLY. Metric VALUES,
 * series points and benchmark values are supplied as inert strings — nothing is computed
 * here. The analytics runtime computes; this vocabulary only carries the results.
 */
import type { MetricCategory, MetricKey } from './metrics';
import type { ReportStage } from './stages';
import type {
  ApprovalStatus,
  ComputationStatus,
  DependencyStatus,
  ReviewStatus,
  SubjectKind,
  ValidationStatus,
} from './statuses';

export type BenchmarkKind = 'INDEX' | 'PEER' | 'RISK_FREE' | 'CUSTOM';
export type ArtifactKind = 'REPORT' | 'SERIES' | 'TEARSHEET' | 'MANIFEST';
export type TimelineKind = 'REPORT' | 'COMPUTATION' | 'REVIEW' | 'APPROVAL' | 'SNAPSHOT';
export type DependencyKind =
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'BACKTEST'
  | 'LIVE_SESSION'
  | 'SIMULATION'
  | 'DATASET';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface PerformanceOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** A metric VALUE within a report (inert; the value is supplied by the runtime, not computed). */
export interface PerformanceMetric {
  readonly key: MetricKey;
  readonly value: string;
  /** The metric-catalog version this value was produced under (metric versioning). */
  readonly definitionVersion: string;
}

/** A single point in a performance series (inert supplied value). */
export interface PerformanceSeriesPoint {
  readonly t: string;
  readonly value: string;
}

/** A named performance series (e.g. equity, drawdown) — inert supplied points, never computed. */
export interface PerformanceSeries {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly points: readonly PerformanceSeriesPoint[];
}

/** A benchmark reference (an index, peer set, risk-free, or custom). */
export interface Benchmark {
  readonly id: string;
  readonly name: string;
  readonly kind: BenchmarkKind;
  readonly ref: string;
  readonly description: string;
}

/** A benchmark comparison row (subject vs benchmark value; both supplied, never computed). */
export interface BenchmarkComparisonRow {
  readonly key: MetricKey;
  readonly subjectValue: string;
  readonly benchmarkValue: string;
}

/** A benchmark comparison for a report (values pulled from the report and the benchmark). */
export interface BenchmarkComparison {
  readonly id: string;
  readonly benchmark: Benchmark;
  readonly rows: readonly BenchmarkComparisonRow[];
  readonly note: string;
}

export interface PerformanceReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: ReportStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface PerformanceApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

export interface PerformanceArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
}

export interface PerformanceTimelineEvent {
  readonly id: string;
  readonly kind: TimelineKind;
  readonly label: string;
  readonly detail: string;
  readonly at: string;
}

export interface PerformanceDependency {
  readonly id: string;
  readonly kind: DependencyKind;
  readonly ref: string;
  readonly name: string;
  readonly status: DependencyStatus;
}

export interface PerformanceValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface ReportVersion {
  readonly version: string;
  readonly stage: ReportStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time performance snapshot reference. */
export interface PerformanceSnapshot {
  readonly reportId: string;
  readonly version: string;
  readonly stage: ReportStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/**
 * A registered performance REPORT — the unit the Performance Analytics Engine manages. It
 * evaluates a subject (strategy / portfolio / backtest / live session / simulation) using
 * the canonical metric catalog; all values are supplied by the analytics runtime.
 */
export interface PerformanceReport {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: ReportStage;
  readonly computation: ComputationStatus;
  readonly version: string;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly subjectName: string;
  readonly window: string;
  readonly metrics: readonly PerformanceMetric[];
  readonly series: readonly PerformanceSeries[];
  readonly benchmark?: BenchmarkComparison;
  readonly validation: PerformanceValidation;
  readonly approval: ApprovalStatus;
  readonly reviews: readonly PerformanceReview[];
  readonly approvals: readonly PerformanceApproval[];
  readonly artifacts: readonly PerformanceArtifact[];
  readonly timeline: readonly PerformanceTimelineEvent[];
  readonly dependencies: readonly PerformanceDependency[];
  readonly versions: readonly ReportVersion[];
  readonly snapshots: readonly PerformanceSnapshot[];
  readonly owner: PerformanceOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related reports under a namespace. */
export interface ReportFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly reportCount: number;
}

/** A cross-report comparison definition (values pulled from each report). */
export interface PerformanceComparison {
  readonly id: string;
  readonly name: string;
  readonly kind: 'STRATEGY' | 'PORTFOLIO' | 'MIXED';
  readonly reportIds: readonly string[];
  readonly metricKeys: readonly MetricKey[];
  readonly createdAt: string;
  readonly note: string;
}

/** Convenience re-export of the metric category type for consumers. */
export type { MetricCategory };
