/**
 * Infrastructure INTERFACES (ports) for the tca-service. The application and domain layers depend
 * only on these abstractions; concrete adapters are injected at composition time. NO implementation
 * here: no database, no cache, no exchange SDK, no broker SDK, no FIX, no HTTP/WebSocket transport, no
 * connectivity. Upstream subsystems (Execution Engine, Smart Order Router, Order Management System,
 * Live Trading Platform, Market Data Platform, Performance Analytics Engine, Risk Analytics Engine,
 * Monitoring Module, Configuration Foundation, Validation Foundation, Workflow Engine) are reached
 * through these abstractions by reference only. Executions are analyzed post-trade; the service never
 * contacts a venue.
 */
import type { BenchmarkPrices, ExecutionInput } from '@platform/tca-sdk';

/**
 * Execution store — the post-trade record of executions (fills + benchmarks + explicit costs) sourced
 * from the Execution Engine / OMS / Live Trading Platform. The TCA service reads these records and
 * analyzes them; it never reaches an exchange or broker.
 */
export interface ExecutionStorePort {
  list(): Promise<readonly ExecutionInput[]>;
  getById(id: string): Promise<ExecutionInput | null>;
  save(execution: ExecutionInput): Promise<void>;
}

/**
 * Market Data Platform — resolves point-in-time benchmark prices (arrival/decision/VWAP/TWAP/…) for a
 * symbol over an execution interval, used to enrich an execution that arrives without benchmarks. A
 * read-only reference abstraction; no market-data feed or connectivity lives here.
 */
export interface MarketDataPort {
  benchmarksFor(symbol: string, from: string, to: string): Promise<BenchmarkPrices | null>;
}

/** Validation Foundation — whether an execution record passed post-trade data validation. */
export interface ValidationPort {
  isValid(executionId: string): Promise<boolean>;
}

/** Workflow Engine — schedule a TCA analysis workflow. */
export interface WorkflowPort {
  scheduleAnalysis(executionId: string): Promise<void>;
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

export interface TcaBusEvent {
  readonly id: string;
  readonly executionId: string;
  readonly type: string;
  readonly message: string;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: TcaBusEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
