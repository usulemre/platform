/**
 * @services/smart-order-router-service — the canonical Smart Order Router (SOR).
 *
 * The venue selection and order routing engine that receives routing requests from the Execution
 * Engine and determines the optimal execution venue according to configurable routing policies. It
 * implements REAL, deterministic routing logic (the `@platform/sor-sdk` state machine + policy
 * framework + venue ranking framework): the routing lifecycle (execution request → venue discovery →
 * venue filtering → policy evaluation → venue ranking → route selection → route validation → route
 * confirmed → execution ready, or routing failed), the actions re-route / fallback / retry /
 * blacklist / recover, the venue registry, and search / metrics / health / event-sourced replay. It
 * integrates with the Execution Engine, Order Management System, Connector Management, Live Trading
 * Platform, Risk Engine, Monitoring Module, Configuration Foundation, Validation Foundation, Workflow
 * Engine, Audit Center and Notification Center through infrastructure INTERFACES only.
 *
 * It is broker-independent: NO exchange SDK, NO broker SDK, NO FIX, NO REST/WebSocket transport, NO
 * connectivity and NO persistence beyond in-memory v1 adapters. Every lifecycle transition is
 * enforced by the state machine; the venue is an abstraction and execution happens downstream.
 */
export * from './domain/policy-evaluators';
export * from './domain/routing';
export * from './domain/lifecycle';
export * from './domain/venues';
export * from './domain/search';
export * from './domain/metrics';
export * from './domain/health';
export * from './domain/replay';

export * from './application/smart-order-router-service';

export * from './infrastructure/ports';
export {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  InMemoryRoutingStore,
  InMemoryVenueStore,
  StaticConfiguration,
  StubExecutionEngine,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { ROUTINGS } from './infrastructure/in-memory/seed';

export * from './composition';
