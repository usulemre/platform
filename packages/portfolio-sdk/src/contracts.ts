/**
 * Canonical Portfolio Construction Engine contracts — the shared, transport-agnostic
 * models the portfolio-construction service and its researcher-facing UI both speak.
 * Inert data only; no optimization, no weight calculation, no risk computation, no
 * secrets. Signals, strategies, features, datasets, backtests, experiments and other
 * portfolios are referenced by ref ONLY. Target weights, bounds and metric VALUES are
 * supplied as inert strings — nothing is computed here.
 */
import type { MetricKey } from './metrics';
import type { PortfolioStage } from './stages';
import type {
  ApprovalStatus,
  ConstraintStatus,
  DependencyStatus,
  OptimizationStatus,
  ReviewStatus,
  ValidationStatus,
} from './statuses';

export type ConstraintKind =
  | 'WEIGHT'
  | 'EXPOSURE'
  | 'TURNOVER'
  | 'RISK'
  | 'LIQUIDITY'
  | 'CONCENTRATION'
  | 'SECTOR';
export type DependencyKind =
  | 'SIGNAL'
  | 'STRATEGY'
  | 'FEATURE'
  | 'DATASET'
  | 'BACKTEST'
  | 'EXPERIMENT'
  | 'RISK';
export type LineageNodeKind =
  | 'SIGNAL'
  | 'STRATEGY'
  | 'FEATURE'
  | 'DATASET'
  | 'BACKTEST'
  | 'EXPERIMENT'
  | 'PORTFOLIO'
  | 'TRANSFORM';
export type ArtifactKind = 'DEFINITION' | 'ALLOCATION' | 'CONSTRAINTS' | 'ATTRIBUTION' | 'MANIFEST';
export type PositionSide = 'LONG' | 'SHORT';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface PortfolioOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** The investable universe a portfolio draws from (by reference). */
export interface PortfolioUniverse {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly assetClasses: readonly string[];
  readonly instrumentCount: number;
}

/** A reusable construction template (allocation model + constraint kinds). */
export interface PortfolioTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly allocationModel: string;
  readonly constraintKinds: readonly ConstraintKind[];
}

/** A selected input signal (referenced only; never re-adjudicated). */
export interface PortfolioSignalSelection {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly weightHint: string;
  readonly status: DependencyStatus;
}

/** A declared constraint (its bound is an inert label; evaluation happens elsewhere). */
export interface PortfolioConstraint {
  readonly id: string;
  readonly kind: ConstraintKind;
  readonly label: string;
  readonly bound: string;
  readonly status: ConstraintStatus;
  readonly note?: string;
}

/** A single target holding — weight is an inert supplied string, never computed. */
export interface PortfolioHolding {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly assetClass: string;
  readonly side: PositionSide;
  readonly targetWeight: string;
}

/** The declarative allocation configuration (what to allocate — never how). */
export interface PortfolioAllocation {
  readonly allocationModel: string;
  readonly baseCurrency: string;
  readonly rebalanceFrequency: string;
  readonly holdings: readonly PortfolioHolding[];
  readonly notes: string;
}

/** A single optimization request (executed by the external optimizer, elsewhere). */
export interface PortfolioOptimizationRequest {
  readonly id: string;
  readonly status: OptimizationStatus;
  readonly objective: string;
  readonly attempt: number;
  readonly progress: number;
  readonly requestedAt?: string;
  readonly completedAt?: string;
  readonly note: string;
}

/** An interactive working session on a portfolio. */
export interface PortfolioSession {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

/** A portfolio characteristic value (inert; the value is supplied, not computed). */
export interface PortfolioMetric {
  readonly key: MetricKey;
  readonly value: string;
}

/** A cross-portfolio comparison definition (values pulled from each portfolio). */
export interface PortfolioComparison {
  readonly id: string;
  readonly name: string;
  readonly portfolioIds: readonly string[];
  readonly metricKeys: readonly MetricKey[];
  readonly createdAt: string;
  readonly note: string;
}

export interface PortfolioReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: PortfolioStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface PortfolioApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

export interface PortfolioDependency {
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

export interface PortfolioLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface PortfolioArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
}

export interface PortfolioValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface PortfolioVersion {
  readonly version: string;
  readonly stage: PortfolioStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time snapshot reference of a portfolio version. */
export interface PortfolioSnapshot {
  readonly portfolioId: string;
  readonly version: string;
  readonly stage: PortfolioStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/**
 * A registered portfolio DEFINITION — the unit the Portfolio Construction Engine
 * manages. (The aggregate root; `PortfolioDefinition` is an alias.)
 */
export interface Portfolio {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: PortfolioStage;
  readonly version: string;
  readonly templateRef?: string;
  readonly universe: PortfolioUniverse;
  readonly signalSelection: readonly PortfolioSignalSelection[];
  readonly constraints: readonly PortfolioConstraint[];
  readonly allocation: PortfolioAllocation;
  readonly optimization: PortfolioOptimizationRequest;
  readonly optimizationRequests: readonly PortfolioOptimizationRequest[];
  readonly sessions: readonly PortfolioSession[];
  readonly metrics: readonly PortfolioMetric[];
  readonly validation: PortfolioValidation;
  readonly approval: ApprovalStatus;
  readonly reviews: readonly PortfolioReview[];
  readonly approvals: readonly PortfolioApproval[];
  readonly dependencies: readonly PortfolioDependency[];
  readonly lineage: PortfolioLineage;
  readonly artifacts: readonly PortfolioArtifact[];
  readonly versions: readonly PortfolioVersion[];
  readonly snapshots: readonly PortfolioSnapshot[];
  readonly owner: PortfolioOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly experimentRef?: string;
  readonly backtestRef?: string;
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** Alias — the portfolio DEFINITION is the registered aggregate above. */
export type PortfolioDefinition = Portfolio;

/** A grouping of related portfolios under a namespace. */
export interface PortfolioFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly portfolioCount: number;
}
