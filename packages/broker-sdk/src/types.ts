/**
 * The canonical Broker Gateway domain models. Immutable, provenance-bearing records that describe a
 * broker's registration, configuration, connection, session, account synchronization state, declared
 * capabilities, health and audit trail. Inert data shapes only — NO exchange SDK, NO broker SDK, NO
 * FIX, NO REST/WebSocket transport, NO connectivity. Snapshots (positions/balances/orders) are the
 * result of a capability read performed elsewhere by a provider adapter; this SDK never fetches them.
 */
import type { BrokerAction, BrokerEventType, BrokerStatus } from './lifecycle';
import type { BrokerCapabilityType } from './capabilities';
import type { AssetClass, ProviderId, ProviderKind, ProviderTransport } from './providers';

export type Environment = 'SANDBOX' | 'PAPER' | 'LIVE';

/** A declared, per-broker capability binding. */
export interface BrokerCapability {
  readonly type: BrokerCapabilityType;
  readonly enabled: boolean;
  readonly lastCheckedAt?: string;
}

/** The connection configuration for a broker (secrets ALWAYS by reference — never inline). */
export interface GatewayConfiguration {
  readonly brokerId: string;
  readonly providerId: ProviderId;
  /** Reference to the endpoint config in the Configuration Foundation (not a URL/secret). */
  readonly endpointRef: string;
  /** Reference to the brokered credential (never the secret itself). */
  readonly credentialRef: string;
  readonly transport: ProviderTransport;
  readonly environment: Environment;
  readonly heartbeatIntervalMs: number;
  readonly reconnectMaxAttempts: number;
  readonly capabilities: readonly BrokerCapabilityType[];
  readonly version: number;
}

/** The transport connection state for a broker. */
export interface BrokerConnection {
  readonly brokerId: string;
  readonly transport: ProviderTransport;
  readonly endpointRef: string;
  readonly status: BrokerStatus;
  readonly connectedAt?: string;
  readonly disconnectedAt?: string;
  readonly lastHeartbeatAt?: string;
  readonly reconnectAttempts: number;
  readonly latencyMs: number;
}

export type SessionState = 'OPEN' | 'EXPIRED' | 'CLOSED';

/** A broker (provider) session — authentication/session token by reference. */
export interface BrokerSession {
  readonly id: string;
  readonly brokerId: string;
  readonly state: SessionState;
  readonly tokenRef: string;
  readonly openedAt: string;
  readonly expiresAt?: string;
  readonly closedAt?: string;
  readonly lastActivityAt?: string;
}

/** A point-in-time position snapshot (result of a QUERY_POSITIONS capability read elsewhere). */
export interface PositionSnapshot {
  readonly symbol: string;
  readonly quantity: number;
  readonly averagePrice: number;
  readonly assetClass: AssetClass;
}

/** A point-in-time balance snapshot (result of a QUERY_BALANCES capability read elsewhere). */
export interface BalanceSnapshot {
  readonly currency: string;
  readonly total: number;
  readonly available: number;
}

/** A point-in-time order-sync record (result of a QUERY_ORDER capability read elsewhere). */
export interface OrderSyncRecord {
  readonly brokerOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: string;
  readonly filledQuantity: number;
  readonly remainingQuantity: number;
}

/** A broker account with its synchronized positions/balances/orders. */
export interface BrokerAccount {
  readonly id: string;
  readonly brokerId: string;
  readonly accountRef: string;
  readonly type: 'CASH' | 'MARGIN' | 'DERIVATIVES';
  readonly baseCurrency: string;
  readonly positions: readonly PositionSnapshot[];
  readonly balances: readonly BalanceSnapshot[];
  readonly orders: readonly OrderSyncRecord[];
  readonly syncedAt: string;
}

export type HealthLevel = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE';

export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly level: HealthLevel;
  readonly detail: string;
}

/** The computed health of a broker at a point in time. */
export interface BrokerHealth {
  readonly brokerId: string;
  readonly level: HealthLevel;
  readonly score: number;
  readonly heartbeatAgeMs: number;
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly checks: readonly HealthCheck[];
  readonly evaluatedAt: string;
}

/** A lifecycle event on a broker. */
export interface BrokerEvent {
  readonly id: string;
  readonly brokerId: string;
  readonly type: BrokerEventType;
  readonly status?: BrokerStatus;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
}

/** A recorded lifecycle state (for replay). */
export interface BrokerStateRecord {
  readonly status: BrokerStatus;
  readonly at: string;
  readonly note: string;
}

/** A tamper-evident audit entry for a broker. */
export interface BrokerAudit {
  readonly id: string;
  readonly brokerId: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly at: string;
}

/** The canonical broker aggregate — the full, immutable gateway record for one broker. */
export interface Broker {
  readonly id: string;
  readonly name: string;
  readonly providerId: ProviderId;
  readonly providerName: string;
  readonly kind: ProviderKind;
  readonly transport: ProviderTransport;
  readonly environment: Environment;
  readonly region: string;
  readonly status: BrokerStatus;
  readonly assetClasses: readonly AssetClass[];
  readonly capabilities: readonly BrokerCapability[];
  readonly configuration: GatewayConfiguration;
  readonly connection: BrokerConnection;
  readonly session?: BrokerSession;
  readonly account?: BrokerAccount;
  readonly health: BrokerHealth;
  readonly failoverBrokerId?: string;
  readonly events: readonly BrokerEvent[];
  readonly states: readonly BrokerStateRecord[];
  readonly audit: readonly BrokerAudit[];
  readonly reconnectAttempts: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A gateway-level session — the aggregate operating state of the gateway across its brokers. */
export interface GatewaySession {
  readonly id: string;
  readonly startedAt: string;
  readonly configVersion: number;
  readonly brokerCount: number;
  readonly connectedCount: number;
  readonly healthyCount: number;
}

/* ------------------------------ metrics ------------------------------ */

export interface StatusBucket {
  readonly status: BrokerStatus;
  readonly count: number;
}
export interface ProviderBucket {
  readonly providerId: ProviderId;
  readonly count: number;
}

/** Gateway-level metrics across a set of brokers. */
export interface BrokerMetrics {
  readonly total: number;
  readonly registered: number;
  readonly connected: number;
  readonly healthy: number;
  readonly degraded: number;
  readonly disconnected: number;
  readonly archived: number;
  readonly connectedRate: number;
  readonly healthyRate: number;
  readonly averageLatencyMs: number;
  readonly averageHealthScore: number;
  readonly totalReconnects: number;
  readonly byStatus: readonly StatusBucket[];
  readonly byProvider: readonly ProviderBucket[];
  readonly capabilityCoverage: readonly {
    readonly type: BrokerCapabilityType;
    readonly count: number;
  }[];
}

export interface BrokerHistory {
  readonly brokerId: string;
  readonly states: readonly BrokerStateRecord[];
  readonly events: readonly BrokerEvent[];
}

export type { BrokerAction, BrokerStatus, BrokerEventType };
