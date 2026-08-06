/**
 * Broker Gateway view models — UI-facing, pre-formatted shapes produced by the mappers so components
 * carry no logic. Inert presentation data only; the lifecycle/health/capability rules live in
 * `@platform/broker-sdk`. No exchange/broker/FIX.
 */
import type { Tone } from './format';

export interface Chip {
  readonly label: string;
  readonly tone: Tone;
}
export interface MetaRow {
  readonly label: string;
  readonly value: string;
}
export interface Kpi {
  readonly label: string;
  readonly value: string;
  readonly tone?: Tone;
}

export interface BrokerRowVm {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly kind: string;
  readonly transport: string;
  readonly environment: Chip;
  readonly region: string;
  readonly status: Chip;
  readonly health: Chip;
  readonly score: string;
  readonly latency: string;
  readonly updatedLabel: string;
}

export interface SummaryVm {
  readonly kpis: readonly Kpi[];
  readonly byStatus: readonly {
    readonly label: string;
    readonly count: number;
    readonly tone: Tone;
  }[];
}

export interface ConnectivityRowVm {
  readonly brokerId: string;
  readonly name: string;
  readonly provider: string;
  readonly status: Chip;
  readonly health: Chip;
  readonly score: string;
  readonly latency: string;
  readonly errorRate: string;
  readonly reconnects: number;
  readonly lastHeartbeatLabel: string;
}

export interface HealthCheckVm {
  readonly id: string;
  readonly label: string;
  readonly level: Chip;
  readonly detail: string;
}
export interface HealthRowVm {
  readonly brokerId: string;
  readonly name: string;
  readonly health: Chip;
  readonly score: string;
  readonly checks: readonly HealthCheckVm[];
}

export interface ConnectionRowVm {
  readonly brokerId: string;
  readonly name: string;
  readonly transport: string;
  readonly status: Chip;
  readonly endpointRef: string;
  readonly latency: string;
  readonly reconnects: number;
  readonly connectedLabel: string;
  readonly lastHeartbeatLabel: string;
  readonly actions: readonly Chip[];
}

export interface SessionRowVm {
  readonly id: string;
  readonly brokerName: string;
  readonly provider: string;
  readonly state: Chip;
  readonly tokenRef: string;
  readonly openedLabel: string;
  readonly expiresLabel: string;
  readonly lastActivityLabel: string;
}

export interface PositionRowVm {
  readonly symbol: string;
  readonly quantity: string;
  readonly averagePrice: string;
  readonly assetClass: string;
  readonly side: Chip;
}
export interface BalanceRowVm {
  readonly currency: string;
  readonly total: string;
  readonly available: string;
}
export interface OrderRowVm {
  readonly brokerOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: string;
  readonly filled: string;
  readonly remaining: string;
}
export interface AccountVm {
  readonly brokerId: string;
  readonly brokerName: string;
  readonly accountRef: string;
  readonly type: string;
  readonly baseCurrency: string;
  readonly positionsCount: number;
  readonly grossExposure: string;
  readonly totalBalance: string;
  readonly openOrders: number;
  readonly syncedLabel: string;
  readonly positions: readonly PositionRowVm[];
  readonly balances: readonly BalanceRowVm[];
  readonly orders: readonly OrderRowVm[];
}

export interface PositionSyncVm {
  readonly brokerId: string;
  readonly brokerName: string;
  readonly accountRef: string;
  readonly longCount: number;
  readonly shortCount: number;
  readonly grossExposure: string;
  readonly netExposure: string;
  readonly syncedLabel: string;
  readonly positions: readonly PositionRowVm[];
}
export interface BalanceSyncVm {
  readonly brokerId: string;
  readonly brokerName: string;
  readonly accountRef: string;
  readonly totalValue: string;
  readonly availableValue: string;
  readonly currencies: number;
  readonly syncedLabel: string;
  readonly balances: readonly BalanceRowVm[];
}
export interface OrderSyncVm {
  readonly brokerId: string;
  readonly brokerName: string;
  readonly accountRef: string;
  readonly total: number;
  readonly open: number;
  readonly filled: number;
  readonly syncedLabel: string;
  readonly orders: readonly OrderRowVm[];
}

export interface ProviderRowVm {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly transport: string;
  readonly assetClasses: readonly string[];
  readonly capabilityCount: number;
  readonly registeredBrokers: number;
  readonly placeholder: boolean;
}
export interface CapabilityRowVm {
  readonly capability: string;
  readonly label: string;
  readonly domain: string;
  readonly supportedCount: number;
  readonly providers: readonly { readonly providerId: string; readonly supported: boolean }[];
}

export interface MetricsVm {
  readonly kpis: readonly Kpi[];
  readonly byStatus: readonly {
    readonly label: string;
    readonly count: number;
    readonly tone: Tone;
  }[];
  readonly byProvider: readonly { readonly providerId: string; readonly count: number }[];
  readonly capabilityCoverage: readonly { readonly label: string; readonly count: number }[];
}

export interface AuditRowVm {
  readonly id: string;
  readonly brokerId: string;
  readonly brokerName: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly atLabel: string;
}

export interface EventVm {
  readonly id: string;
  readonly type: string;
  readonly status?: Chip;
  readonly message: string;
  readonly actor: string;
  readonly atLabel: string;
  readonly tone: Tone;
}

export interface BrokerDetailVm {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly kind: string;
  readonly transport: string;
  readonly environment: Chip;
  readonly region: string;
  readonly status: Chip;
  readonly health: Chip;
  readonly kpis: readonly Kpi[];
  readonly meta: readonly MetaRow[];
  readonly capabilities: readonly {
    readonly type: string;
    readonly label: string;
    readonly enabled: boolean;
  }[];
  readonly checks: readonly HealthCheckVm[];
  readonly permittedActions: readonly Chip[];
  readonly connection: ConnectionRowVm;
  readonly session?: SessionRowVm;
  readonly account?: AccountVm;
  readonly events: readonly EventVm[];
  readonly failoverBrokerId?: string;
}

export interface GatewaySessionVm {
  readonly id: string;
  readonly startedLabel: string;
  readonly configVersion: number;
  readonly brokerCount: number;
  readonly connectedCount: number;
  readonly healthyCount: number;
}

export interface BrokerRef {
  readonly id: string;
  readonly name: string;
  readonly status: Chip;
}
