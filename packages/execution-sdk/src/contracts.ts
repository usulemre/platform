/**
 * Canonical Execution Simulator contracts — the shared, transport-agnostic models the
 * execution-simulator service and its UIs both speak. Inert data only; NO execution
 * algorithm, NO exchange/broker connectivity, NO FIX, NO WebSocket, NO fill/price
 * calculation, no secrets. Portfolios, strategies, backtests, signals and experiments
 * are referenced by ref ONLY. Quantities, prices, exposures and metric VALUES are
 * supplied as inert strings — nothing is computed or transmitted here.
 */
import type { MetricKey } from './metrics';
import type { SimulationStage } from './stages';
import type {
  ApprovalStatus,
  DependencyStatus,
  OrderStatus,
  ReviewStatus,
  RunStatus,
  ValidationStatus,
} from './statuses';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type Liquidity = 'MAKER' | 'TAKER';
export type PositionSide = 'LONG' | 'SHORT' | 'FLAT';
export type TimelineKind = 'SESSION' | 'ORDER' | 'FILL' | 'POSITION';
export type DependencyKind =
  | 'PORTFOLIO'
  | 'STRATEGY'
  | 'BACKTEST'
  | 'SIGNAL'
  | 'FEATURE'
  | 'EXPERIMENT'
  | 'DATASET';
export type LineageNodeKind =
  | 'PORTFOLIO'
  | 'STRATEGY'
  | 'BACKTEST'
  | 'SIGNAL'
  | 'FEATURE'
  | 'EXPERIMENT'
  | 'DATASET'
  | 'SIMULATION'
  | 'TRANSFORM';
export type ArtifactKind = 'BLOTTER' | 'FILLS' | 'POSITIONS' | 'REPORT' | 'MANIFEST';
export type ReportKind = 'EXECUTION_SUMMARY' | 'TCA' | 'BLOTTER' | 'MANIFEST';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface ExecutionOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** A reusable simulation scenario template. */
export interface ScenarioTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly fillModel: string;
  readonly venueModel: string;
}

/** The declarative simulation scenario (what to simulate — never how). */
export interface SimulationScenario {
  readonly id: string;
  readonly label: string;
  readonly universe: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly fillModel: string;
  readonly venueModel: string;
  readonly latencyModel: string;
  readonly parameters: readonly MetadataEntry[];
  readonly notes: string;
}

/** A single simulation attempt of a session (executed by the simulator). */
export interface SessionRun {
  readonly id: string;
  readonly status: RunStatus;
  readonly attempt: number;
  readonly progress: number;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly note: string;
}

/** A simulated order (state is inert; no state machine executes here). */
export interface ExecutionOrder {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: string;
  readonly limitPrice?: string;
  readonly filledQuantity: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

/** A simulated fill (quantity/price are inert; produced by the simulator). */
export interface ExecutionFill {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly quantity: string;
  readonly price: string;
  readonly liquidity: Liquidity;
  readonly venue: string;
  readonly filledAt: string;
}

/** A simulated position (values are inert; reflected, never computed). */
export interface ExecutionPosition {
  readonly id: string;
  readonly symbol: string;
  readonly side: PositionSide;
  readonly quantity: string;
  readonly averagePrice: string;
  readonly marketValue: string;
}

/** The simulated portfolio state (all values inert supplied strings). */
export interface ExecutionPortfolio {
  readonly baseCurrency: string;
  readonly cash: string;
  readonly equity: string;
  readonly grossExposure: string;
  readonly netExposure: string;
  readonly realizedPnl: string;
  readonly unrealizedPnl: string;
}

/** A single ordered execution-timeline event. */
export interface ExecutionTimelineEvent {
  readonly id: string;
  readonly kind: TimelineKind;
  readonly label: string;
  readonly detail: string;
  readonly at: string;
}

/** A replay of a completed session (deterministic re-simulation, elsewhere). */
export interface ExecutionReplay {
  readonly id: string;
  readonly sourceSessionId: string;
  readonly status: RunStatus;
  readonly note: string;
  readonly createdAt: string;
}

/** An execution indicator value (inert; the value is supplied, not computed). */
export interface ExecutionMetric {
  readonly key: MetricKey;
  readonly value: string;
}

export interface ExecutionReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: SimulationStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface ExecutionApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

export interface ExecutionReport {
  readonly id: string;
  readonly kind: ReportKind;
  readonly title: string;
  readonly ref: string;
  readonly generatedAt: string;
  readonly summary: string;
}

export interface ExecutionArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
}

export interface ExecutionDependency {
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

export interface ExecutionLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface ExecutionValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface ExecutionVersion {
  readonly version: string;
  readonly stage: SimulationStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time snapshot reference of a session version. */
export interface ExecutionSnapshot {
  readonly sessionId: string;
  readonly version: string;
  readonly stage: SimulationStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/** A registered simulation SESSION — the unit the Execution Simulator manages. */
export interface SimulationSession {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: SimulationStage;
  readonly version: string;
  readonly templateRef?: string;
  readonly scenario: SimulationScenario;
  readonly run: SessionRun;
  readonly runs: readonly SessionRun[];
  readonly orders: readonly ExecutionOrder[];
  readonly fills: readonly ExecutionFill[];
  readonly positions: readonly ExecutionPosition[];
  readonly portfolio: ExecutionPortfolio;
  readonly timeline: readonly ExecutionTimelineEvent[];
  readonly replays: readonly ExecutionReplay[];
  readonly metrics: readonly ExecutionMetric[];
  readonly validation: ExecutionValidation;
  readonly approval: ApprovalStatus;
  readonly reviews: readonly ExecutionReview[];
  readonly approvals: readonly ExecutionApproval[];
  readonly reports: readonly ExecutionReport[];
  readonly artifacts: readonly ExecutionArtifact[];
  readonly dependencies: readonly ExecutionDependency[];
  readonly lineage: ExecutionLineage;
  readonly versions: readonly ExecutionVersion[];
  readonly snapshots: readonly ExecutionSnapshot[];
  readonly owner: ExecutionOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly portfolioRef?: string;
  readonly strategyRef?: string;
  readonly backtestRef?: string;
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related sessions under a namespace. */
export interface SimulationFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly sessionCount: number;
}

/** A cross-session comparison definition (values pulled from each session). */
export interface SimulationComparison {
  readonly id: string;
  readonly name: string;
  readonly sessionIds: readonly string[];
  readonly metricKeys: readonly MetricKey[];
  readonly createdAt: string;
  readonly note: string;
}
