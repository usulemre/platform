/**
 * Infrastructure INTERFACES (ports) for the smart-order-router service. The application and domain
 * layers depend only on these abstractions; concrete adapters are injected at composition time. NO
 * implementation here: no database, no cache, no exchange SDK, no broker SDK, no FIX, no HTTP/
 * WebSocket transport, no connectivity. Other subsystems (Execution Engine, Order Management System,
 * Connector Management, Live Trading Platform, Risk Engine, Monitoring Module, Configuration
 * Foundation, Validation Foundation, Workflow Engine, Audit Center, Notification Center) are reached
 * through these abstractions by reference only.
 */
import type { Routing, Venue } from '@platform/sor-sdk';

/** Routing store — the router's own read/write persistence boundary. */
export interface RoutingStorePort {
  list(): Promise<readonly Routing[]>;
  getById(id: string): Promise<Routing | null>;
  save(routing: Routing): Promise<void>;
}

/**
 * Venue registry — the venue catalog and blacklist state, sourced from Connector Management. The
 * router NEVER contacts a venue; it only reads venue reference data and status through this port.
 */
export interface VenueStorePort {
  list(): Promise<readonly Venue[]>;
  getById(id: string): Promise<Venue | null>;
  blacklist(venueId: string): Promise<void>;
  recover(venueId: string): Promise<void>;
  blacklisted(): Promise<readonly string[]>;
}

/** Execution Engine — hand the confirmed route back for execution (an abstraction). */
export interface ExecutionEnginePort {
  handOff(executionId: string, venueId: string): Promise<void>;
}

/** Risk Engine — whether a route cleared pre-execution risk (decided elsewhere). */
export interface RiskPort {
  isApproved(orderId: string, venueId: string): Promise<boolean>;
}

/** Workflow Engine — schedule a routing workflow. */
export interface WorkflowPort {
  scheduleRouting(routingId: string): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly routingId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly routingId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

export interface RoutingBusEvent {
  readonly id: string;
  readonly routingId: string;
  readonly type: string;
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: RoutingBusEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
