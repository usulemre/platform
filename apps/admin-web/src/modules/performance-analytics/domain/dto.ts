/**
 * Performance Analytics Engine DTOs. The canonical shapes are owned by the shared
 * `@platform/performance-sdk` (single source of truth across the service and this UI); this
 * module re-exports them so both tiers speak the same vocabulary. Inert data only — no
 * formulas, no metric calculation, no statistical algorithms.
 */
export type {
  AnalyticsCapability,
  ApprovalStatus,
  ArtifactKind,
  Benchmark,
  BenchmarkComparison,
  BenchmarkComparisonRow,
  BenchmarkKind,
  ComputationStatus,
  DependencyKind,
  DependencyStatus,
  MetadataEntry,
  MetricCategory,
  MetricCategoryDescriptor,
  MetricDefinition,
  MetricKey,
  PerformanceApproval,
  PerformanceArtifact,
  PerformanceComparison,
  PerformanceDependency,
  PerformanceMetric,
  PerformanceOwner,
  PerformanceReport,
  PerformanceReview,
  PerformanceSeries,
  PerformanceSeriesPoint,
  PerformanceSnapshot,
  PerformanceTimelineEvent,
  PerformanceValidation,
  ReportFamily,
  ReportStage,
  ReportVersion,
  ReviewStatus,
  SubjectKind,
  TimelineKind,
  ValidationStatus,
} from '@platform/performance-sdk';
