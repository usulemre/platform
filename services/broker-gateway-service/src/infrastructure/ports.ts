/**
 * Infrastructure INTERFACES (ports) for the broker-gateway service. The application and domain layers
 * depend only on these abstractions; concrete adapters are injected at composition time. NO
 * implementation here: no database, no exchange SDK, no broker SDK, no FIX, no HTTP/WebSocket
 * transport, no connectivity. Upstream/peer subsystems (Execution Engine, Smart Order Router, Order
 * Management System, Market Data Platform, Live Trading Platform, Monitoring Module, Audit Center,
 * Notification Center, Configuration Foundation, Validation Foundation, Workflow Engine) are reached
 * through these abstractions by reference only. Providers are resolved through the provider registry.
 */
import type {
  Broker,
  BrokerCapabilityType,
  BrokerProviderPort,
  ProviderId,
} from '@platform/broker-sdk';

/** Broker store — the gateway's own read/write persistence boundary. */
export interface BrokerStorePort {
  list(): Promise<readonly Broker[]>;
  getById(id: string): Promise<Broker | null>;
  save(broker: Broker): Promise<void>;
}

/**
 * Provider registry — resolves an injected provider adapter (a `BrokerProviderPort`) by id. This is
 * the ONLY seam through which a concrete provider (`@platform/providers/*`) reaches the gateway;
 * swapping placeholder adapters for live ones is a composition change, nothing else.
 */
export interface ProviderRegistryPort {
  providerIds(): readonly ProviderId[];
  resolve(id: ProviderId): BrokerProviderPort | null;
  supports(id: ProviderId, capability: BrokerCapabilityType): boolean;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}

/** Validation Foundation — whether a broker configuration passed pre-registration validation. */
export interface ValidationPort {
  isValid(brokerId: string): Promise<boolean>;
}

/** Workflow Engine — schedule a gateway workflow (e.g. reconnect backoff). */
export interface WorkflowPort {
  scheduleGatewayTask(brokerId: string, task: string): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly brokerId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly brokerId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

/** Monitoring Module — publish a broker health/connectivity signal (evaluated elsewhere). */
export interface MonitoringPort {
  publishHealth(signal: {
    readonly brokerId: string;
    readonly level: string;
    readonly score: number;
    readonly at: string;
  }): Promise<void>;
}

export interface GatewayBusEvent {
  readonly id: string;
  readonly brokerId: string;
  readonly type: string;
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: GatewayBusEvent): Promise<void>;
}
