/**
 * Backtesting Engine DTOs. The canonical shapes are owned by the shared
 * `@platform/backtesting-sdk` (single source of truth across the service and this
 * UI); this module re-exports them so both tiers speak the same vocabulary. Inert
 * data only — no simulation, no metric computation, no optimization.
 */
export type {
  ApprovalStatus,
  ArtifactKind,
  Backtest,
  BacktestApproval,
  BacktestArtifact,
  BacktestComparison,
  BacktestConfiguration,
  BacktestDependency,
  BacktestFamily,
  BacktestLineage,
  BacktestMetric,
  BacktestOwner,
  BacktestReport,
  BacktestResult,
  BacktestReview,
  BacktestRun,
  BacktestScenario,
  BacktestSession,
  BacktestStage,
  BacktestValidation,
  BacktestVersion,
  DependencyKind,
  DependencyStatus,
  LineageNode,
  LineageNodeKind,
  MetadataEntry,
  MetricDescriptor,
  MetricKey,
  ParameterSet,
  ReviewStatus,
  RunStatus,
  ScenarioKind,
  ValidationStatus,
} from '@platform/backtesting-sdk';
