/**
 * Infrastructure INTERFACES (ports) for the order-management service. The application and domain
 * layers depend only on these abstractions; concrete adapters are injected at composition time. NO
 * implementation here: no database, no cache, no broker SDK, no exchange API, no FIX, no HTTP/
 * WebSocket transport, no order execution. Other subsystems (Portfolio Optimization Engine, Risk
 * Engine, Execution Simulator, Live Trading Platform, Signal Calculation Engine, Workflow Engine,
 * Validation Foundation, Configuration Foundation, Monitoring Module, Audit Center, Notification
 * Center) are reached through these abstractions by reference only.
 */
import type { Order, OrderRoute } from '@platform/order-sdk';

/** Order store — the OMS's own read/write persistence boundary (single source of truth for orders). */
export interface OrderStorePort {
  list(): Promise<readonly Order[]>;
  getById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

/**
 * Execution Gateway — the abstraction boundary to the (external) Execution Simulator / Live Trading
 * Platform. The OMS NEVER contacts a broker or exchange, NEVER holds a credential, and NEVER speaks
 * REST/WebSocket/FIX; it only routes governed order intents through this port. Concrete venues live
 * downstream.
 */
export interface ExecutionGatewayPort {
  route(orderId: string, route: OrderRoute): Promise<void>;
  submit(orderId: string): Promise<void>;
  cancel(orderId: string): Promise<void>;
}

/** Risk Engine — whether an order cleared pre-trade risk approval (decided elsewhere). */
export interface RiskPort {
  isApproved(orderId: string): Promise<boolean>;
}

/** Workflow Engine — schedule an approval workflow. */
export interface WorkflowPort {
  scheduleApproval(orderId: string): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly orderId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly orderId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

export interface OrderBusEvent {
  readonly id: string;
  readonly orderId: string;
  readonly type: string;
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: OrderBusEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
