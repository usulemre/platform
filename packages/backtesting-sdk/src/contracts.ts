/**
 * Canonical Backtesting Engine contracts — the shared, transport-agnostic models
 * the backtesting service and its researcher-facing UI both speak. Inert data
 * only; no simulation, no performance-metric computation, no optimization, no
 * secrets. Datasets, features, signals, experiments, portfolios and other
 * backtests are referenced by ref ONLY. Metric VALUES are supplied as inert
 * strings — nothing is computed here.
 */
import type { MetricKey } from './metrics';
import type { BacktestStage } from './stages';
import type {
  ApprovalStatus,
  DependencyStatus,
  ReviewStatus,
  RunStatus,
  ValidationStatus,
} from './statuses';

export type ScenarioKind = 'HISTORICAL' | 'WALK_FORWARD' | 'ROLLING_WINDOW';
export type DependencyKind =
  | 'DATASET'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'EXPERIMENT';
export type LineageNodeKind =
  | 'DATASET'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'EXPERIMENT'
  | 'BACKTEST'
  | 'TRANSFORM';
export type ArtifactKind = 'REPORT' | 'EQUITY_CURVE' | 'TRADES' | 'ATTRIBUTION' | 'MANIFEST';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface BacktestOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** A named set of parameters for a backtest (values are inert labels). */
export interface ParameterSet {
  readonly id: string;
  readonly name: string;
  readonly params: readonly MetadataEntry[];
}

/** An evaluation scenario (historical / walk-forward / rolling window). */
export interface BacktestScenario {
  readonly id: string;
  readonly kind: ScenarioKind;
  readonly label: string;
  readonly window: string;
  readonly description: string;
}

/** The declarative backtest configuration (what to simulate — never how). */
export interface BacktestConfiguration {
  readonly scenario: BacktestScenario;
  readonly universe: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly frequency: string;
  readonly costModel: string;
  readonly parameterSets: readonly ParameterSet[];
  readonly notes: string;
}

/** A single execution attempt of a backtest (executed elsewhere). */
export interface BacktestRun {
  readonly id: string;
  readonly status: RunStatus;
  readonly attempt: number;
  readonly progress: number;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly note: string;
}

/** An interactive working session on a backtest. */
export interface BacktestSession {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

/** A metric value produced by a run (inert; the value is supplied, not computed). */
export interface BacktestMetric {
  readonly key: MetricKey;
  readonly value: string;
}

/** The result of a completed run (references artifacts by ref only). */
export interface BacktestResult {
  readonly id: string;
  readonly runId: string;
  readonly parameterSetId: string;
  readonly metrics: readonly BacktestMetric[];
  readonly summary: string;
}

/** A generated report reference (the artifact lives in the artifact store). */
export interface BacktestReport {
  readonly id: string;
  readonly title: string;
  readonly ref: string;
  readonly generatedAt: string;
  readonly summary: string;
}

/** A cross-backtest comparison definition (values pulled from each backtest). */
export interface BacktestComparison {
  readonly id: string;
  readonly name: string;
  readonly backtestIds: readonly string[];
  readonly metricKeys: readonly MetricKey[];
  readonly createdAt: string;
  readonly note: string;
}

export interface BacktestReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: BacktestStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface BacktestApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

export interface BacktestDependency {
  readonly id: string;
  readonly kind: DependencyKind;
  readonly ref: string;
  readonly name: string;
  readonly status: DependencyStatus;
}

export interface LineageNode {
  readonly id: string;
  readonly kind: LineageNodeKind;
  readonly ref: string;
  readonly label: string;
}

export interface BacktestLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface BacktestArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
}

export interface BacktestValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface BacktestVersion {
  readonly version: string;
  readonly stage: BacktestStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time snapshot reference of a backtest version. */
export interface BacktestSnapshot {
  readonly backtestId: string;
  readonly version: string;
  readonly stage: BacktestStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/** A registered backtest — the unit the Backtesting Engine manages. */
export interface Backtest {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: BacktestStage;
  readonly version: string;
  readonly configuration: BacktestConfiguration;
  readonly run: BacktestRun;
  readonly runs: readonly BacktestRun[];
  readonly sessions: readonly BacktestSession[];
  readonly results: readonly BacktestResult[];
  readonly reports: readonly BacktestReport[];
  readonly metrics: readonly BacktestMetric[];
  readonly validation: BacktestValidation;
  readonly approval: ApprovalStatus;
  readonly reviews: readonly BacktestReview[];
  readonly approvals: readonly BacktestApproval[];
  readonly dependencies: readonly BacktestDependency[];
  readonly lineage: BacktestLineage;
  readonly artifacts: readonly BacktestArtifact[];
  readonly versions: readonly BacktestVersion[];
  readonly owner: BacktestOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly experimentRef?: string;
  readonly portfolioRef?: string;
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related backtests under a namespace. */
export interface BacktestFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly backtestCount: number;
}
