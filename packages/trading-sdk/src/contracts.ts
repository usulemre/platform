/**
 * Canonical Live Trading Platform contracts — the shared, transport-agnostic models the
 * live-trading service and its UIs both speak. Inert data only; NO exchange/broker SDK,
 * NO API keys, NO HTTP/REST client, NO WebSocket, NO FIX, NO order execution, NO
 * PnL/exposure computation, no secrets. Strategies, portfolios, signals, simulations and
 * accounts are referenced by ref ONLY. Quantities, prices, balances, exposures and metric
 * VALUES are supplied as inert strings — nothing is computed or transmitted here.
 *
 * Credentials are NEVER modelled: connections reference a secret broker by an opaque
 * `credentialRef` only (resolved by the secrets broker in infrastructure, never here).
 */
import type { BrokerKind, ProviderId } from './connectors';
import type { MetricKey } from './metrics';
import type { DeploymentStage } from './stages';
import type {
  ApprovalStatus,
  ConnectionStatus,
  DependencyStatus,
  ExecutionMode,
  HealthStatus,
  KillSwitchStatus,
  OrderStatus,
  RuntimeStatus,
  ValidationStatus,
} from './statuses';

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type PositionSide = 'LONG' | 'SHORT' | 'FLAT';
export type TimelineKind = 'DEPLOYMENT' | 'ORDER' | 'POSITION' | 'HEALTH' | 'EMERGENCY' | 'SESSION';
export type DependencyKind =
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'SIGNAL'
  | 'SIMULATION'
  | 'BACKTEST'
  | 'ACCOUNT';
export type LineageNodeKind =
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'SIGNAL'
  | 'SIMULATION'
  | 'BACKTEST'
  | 'DEPLOYMENT'
  | 'TRANSFORM';
export type EmergencyKind = 'PAUSE' | 'STOP' | 'EMERGENCY_STOP' | 'ROLLBACK' | 'KILL_SWITCH';
export type AuditKind =
  | 'DEPLOYMENT'
  | 'APPROVAL'
  | 'RUNTIME'
  | 'ORDER'
  | 'EMERGENCY'
  | 'KILL_SWITCH'
  | 'CONNECTION';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface TradingOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** A trading account (referenced; no credentials, no balances stored inline as secrets). */
export interface TradingAccount {
  readonly id: string;
  readonly name: string;
  readonly brokerKind: BrokerKind;
  readonly provider: ProviderId;
  readonly mode: ExecutionMode;
  readonly baseCurrency: string;
  readonly status: ConnectionStatus;
}

/** An account balance line (all values inert supplied strings). */
export interface AccountBalance {
  readonly id: string;
  readonly accountId: string;
  readonly asset: string;
  readonly total: string;
  readonly available: string;
  readonly reserved: string;
}

/**
 * A broker/exchange connection ABSTRACTION. It references an opaque secret by
 * `credentialRef` only — this SDK never holds an API key, endpoint or SDK handle.
 */
export interface BrokerConnection {
  readonly id: string;
  readonly provider: ProviderId;
  readonly brokerKind: BrokerKind;
  readonly label: string;
  readonly mode: ExecutionMode;
  readonly status: ConnectionStatus;
  readonly credentialRef: string;
  readonly note: string;
}

/** An exchange connection abstraction (a broker connection to a crypto exchange). */
export type ExchangeConnection = BrokerConnection;

/** A production trading session (a bounded window of a running deployment). */
export interface TradingSession {
  readonly id: string;
  readonly label: string;
  readonly mode: ExecutionMode;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly note: string;
}

/** The runtime view of the deployed strategy (state is inert; runs elsewhere). */
export interface RunningStrategy {
  readonly id: string;
  readonly strategyRef: string;
  readonly status: RuntimeStatus;
  readonly mode: ExecutionMode;
  readonly uptime: string;
  readonly startedAt?: string;
  readonly note: string;
}

/** A production order (state is inert; no order is transmitted here). */
export interface TradingOrder {
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

/** A production position (open or closed; values inert supplied strings). */
export interface TradingPosition {
  readonly id: string;
  readonly symbol: string;
  readonly side: PositionSide;
  readonly quantity: string;
  readonly averagePrice: string;
  readonly marketValue: string;
  readonly unrealizedPnl: string;
  readonly realizedPnl: string;
  readonly open: boolean;
}

/** The reflected production portfolio state (all values inert supplied strings). */
export interface TradingPortfolio {
  readonly baseCurrency: string;
  readonly equity: string;
  readonly cash: string;
  readonly grossExposure: string;
  readonly netExposure: string;
  readonly realizedPnl: string;
  readonly unrealizedPnl: string;
}

/** A granted trading permission (governs what a deployment may do). */
export interface TradingPermission {
  readonly id: string;
  readonly capability: string;
  readonly granted: boolean;
  readonly note: string;
}

/** Reflected production health (reported by monitoring; never computed here). */
export interface TradingHealth {
  readonly status: HealthStatus;
  readonly checks: readonly {
    readonly id: string;
    readonly label: string;
    readonly status: HealthStatus;
    readonly detail: string;
  }[];
  readonly checkedAt?: string;
  readonly note: string;
}

/** A production trading indicator value (inert; supplied, not computed). */
export interface TradingMetric {
  readonly key: MetricKey;
  readonly value: string;
}

/** A single ordered trading-timeline event. */
export interface TradingTimelineEvent {
  readonly id: string;
  readonly kind: TimelineKind;
  readonly label: string;
  readonly detail: string;
  readonly at: string;
}

/** A recorded emergency action (executed by an authorized human; reflected here). */
export interface EmergencyAction {
  readonly id: string;
  readonly kind: EmergencyKind;
  readonly actor: string;
  readonly reason: string;
  readonly at: string;
}

/**
 * The kill switch — ALWAYS available to authorized humans, NEVER gated by AI. Engaging it
 * forces the deployment to HALT. Modelled as inert state + operator reference only.
 */
export interface KillSwitch {
  readonly status: KillSwitchStatus;
  readonly armedBy: string;
  readonly engagedBy?: string;
  readonly engagedAt?: string;
  readonly note: string;
}

/** A single tamper-evident trading audit entry (who / what / when / why). */
export interface TradingAudit {
  readonly id: string;
  readonly kind: AuditKind;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly occurredAt: string;
}

export interface TradingApproval {
  readonly id: string;
  readonly role: string;
  readonly kind: 'RISK' | 'DEPLOYMENT';
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
  readonly counterSignedBy?: string;
}

/**
 * The time-boxed governance authorization token required for LIVE execution (ARCH §2.9).
 * Modelled as an inert reference + validity window; possession is required to reach a
 * live `RUNNING` deployment. Absent/expired ⇒ paper/shadow only.
 */
export interface AuthorizationToken {
  readonly ref: string;
  readonly issuedBy: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly scope: string;
  readonly valid: boolean;
}

export interface DeploymentDependency {
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

export interface DeploymentLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface DeploymentValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface DeploymentVersion {
  readonly version: string;
  readonly stage: DeploymentStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time snapshot reference of a deployment version. */
export interface DeploymentSnapshot {
  readonly deploymentId: string;
  readonly version: string;
  readonly stage: DeploymentStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/**
 * A registered production DEPLOYMENT — the unit the Live Trading Platform manages. It
 * promotes a validated, paper-traded strategy into governed production. Default posture is
 * paper/shadow; live requires a valid authorization token.
 */
export interface Deployment {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: DeploymentStage;
  readonly mode: ExecutionMode;
  readonly version: string;
  readonly account: TradingAccount;
  readonly connection: BrokerConnection;
  readonly session?: TradingSession;
  readonly runtime: RunningStrategy;
  readonly authorization?: AuthorizationToken;
  readonly orders: readonly TradingOrder[];
  readonly positions: readonly TradingPosition[];
  readonly portfolio: TradingPortfolio;
  readonly balances: readonly AccountBalance[];
  readonly permissions: readonly TradingPermission[];
  readonly health: TradingHealth;
  readonly metrics: readonly TradingMetric[];
  readonly timeline: readonly TradingTimelineEvent[];
  readonly approvals: readonly TradingApproval[];
  readonly emergencyActions: readonly EmergencyAction[];
  readonly killSwitch: KillSwitch;
  readonly validation: DeploymentValidation;
  readonly dependencies: readonly DeploymentDependency[];
  readonly lineage: DeploymentLineage;
  readonly audit: readonly TradingAudit[];
  readonly versions: readonly DeploymentVersion[];
  readonly snapshots: readonly DeploymentSnapshot[];
  readonly owner: TradingOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly strategyRef?: string;
  readonly portfolioRef?: string;
  readonly simulationRef?: string;
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related deployments under a namespace. */
export interface DeploymentFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly deploymentCount: number;
}
