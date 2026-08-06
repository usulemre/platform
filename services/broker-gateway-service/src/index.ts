/**
 * @services/broker-gateway-service — the canonical Broker Gateway.
 *
 * The ONLY component responsible for communicating with external execution venues. It provides a
 * unified, provider-independent interface for brokers, exchanges and execution venues and isolates the
 * rest of the platform from provider-specific implementations. It implements the REAL, deterministic
 * gateway orchestration (the `@platform/broker-sdk` state machine + capability contracts + health
 * rules): the broker lifecycle (register → configure → authenticate → connect → healthy ↔ degraded →
 * disconnected → archived), the actions (reconnect / failover / health check / heartbeat / recovery),
 * the provider registry, capability routing, health/connectivity, gateway metrics, session and
 * account-synchronization views, and event-sourced replay. Providers are injected through the
 * `BrokerProviderPort` capability contract (placeholder adapters in `@platform/providers/*`).
 *
 * It integrates with the Execution Engine, Smart Order Router, Order Management System, Market Data
 * Platform, Live Trading Platform, Monitoring Module, Audit Center, Notification Center, Configuration
 * Foundation, Validation Foundation and Workflow Engine through infrastructure INTERFACES only. It is
 * technology-independent: NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport, NO
 * connectivity and NO persistence beyond in-memory v1 adapters. Provider implementations are never
 * hardcoded — they are resolved through the registry.
 */
export * from './domain/lifecycle';
export * from './domain/metrics';
export * from './domain/registry';
export * from './domain/sync';
export * from './domain/sessions';
export * from './domain/search';
export * from './domain/replay';

export * from './application/broker-gateway-service';

export * from './infrastructure/ports';
export {
  InMemoryAudit,
  InMemoryBrokerStore,
  InMemoryEventBus,
  InMemoryMonitoring,
  InMemoryNotifications,
  InMemoryProviderRegistry,
  StaticConfiguration,
  StubValidation,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { BROKERS } from './infrastructure/in-memory/seed';

export * from './composition';
