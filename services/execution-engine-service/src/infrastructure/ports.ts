/**
 * Infrastructure INTERFACES (ports) for the execution-engine service. The application and domain
 * layers depend only on these abstractions; concrete adapters are injected at composition time. NO
 * implementation here: no database, no cache, no broker SDK, no exchange API, no FIX, no HTTP/
 * WebSocket transport, no order execution. Other subsystems (Order Management System, Portfolio
 * Optimization Engine, Risk Engine, Execution Simulator, Live Trading Platform, Monitoring Module,
 * Audit Center, Notification Center, Validation Foundation, Workflow Engine, Configuration
 * Foundation) are reached through these abstractions by reference only.
 */
import type { Execution, ExecutionSession } from '@platform/execution-engine-sdk';

/** A venue-route intent (an abstraction; never a real broker/exchange endpoint). */
export interface VenueRoute {
  readonly venue: string;
  readonly mode: string;
}

/** Execution store — the engine's own read/write persistence boundary. */
export interface ExecutionStorePort {
  list(): Promise<readonly Execution[]>;
  getById(id: string): Promise<Execution | null>;
  save(execution: Execution): Promise<void>;
}

/** Session store — the execution sessions. */
export interface SessionStorePort {
  list(): Promise<readonly ExecutionSession[]>;
  getById(id: string): Promise<ExecutionSession | null>;
  save(session: ExecutionSession): Promise<void>;
}

/**
 * Execution Venue — the abstraction boundary to the (external) Execution Simulator / Live Trading
 * Platform. The engine NEVER contacts a broker or exchange, NEVER holds a credential, and NEVER
 * speaks REST/WebSocket/FIX; it only routes governed execution intents through this port. Concrete
 * venues live downstream.
 */
export interface ExecutionVenuePort {
  route(executionId: string, route: VenueRoute): Promise<void>;
  cancel(executionId: string): Promise<void>;
}

/** Order Management System — acknowledge receipt of an approved order for execution. */
export interface OmsPort {
  acknowledge(orderId: string, executionId: string): Promise<void>;
}

/** Risk Engine — whether an execution cleared pre-execution risk approval (decided elsewhere). */
export interface RiskPort {
  isApproved(orderId: string): Promise<boolean>;
}

/** Workflow Engine — schedule an execution workflow. */
export interface WorkflowPort {
  scheduleExecution(executionId: string): Promise<void>;
}

/** Audit Center — append a tamper-evident audit entry (store is elsewhere). */
export interface AuditPort {
  record(entry: {
    readonly executionId: string;
    readonly actor: string;
    readonly action: string;
    readonly at: string;
  }): Promise<void>;
}

/** Notification Center — notify a role/channel (delivery is elsewhere). */
export interface NotificationPort {
  notify(message: {
    readonly executionId: string;
    readonly channel: string;
    readonly summary: string;
  }): Promise<void>;
}

export interface ExecutionBusEvent {
  readonly id: string;
  readonly executionId: string;
  readonly type: string;
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: ExecutionBusEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
