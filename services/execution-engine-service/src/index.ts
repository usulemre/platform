/**
 * @services/execution-engine-service — the canonical Execution Engine.
 *
 * The execution orchestration engine that receives approved orders from the OMS and determines how
 * they should be executed according to execution policies. It implements REAL, deterministic
 * execution-workflow logic (the `@platform/execution-engine-sdk` state machine + the policy
 * framework): execution planning, the lifecycle (order received → execution planned → execution
 * validated → waiting for venue → executing → partially executed → completed / cancelled / failed),
 * the actions retry / pause / resume / cancel / replay, slice bookkeeping, sessions, event-sourced
 * replay, search, metrics and health. It integrates with the Order Management System, Portfolio
 * Optimization Engine, Risk Engine, Execution Simulator, Live Trading Platform, Monitoring Module,
 * Audit Center, Notification Center, Validation Foundation, Workflow Engine and Configuration
 * Foundation through infrastructure INTERFACES only.
 *
 * It is broker-independent: NO broker SDK, NO exchange API, NO FIX, NO REST/WebSocket transport, NO
 * order execution and NO persistence beyond in-memory v1 adapters. Every lifecycle transition is
 * enforced by the state machine; routing to a venue is an abstraction dispatched through a port.
 */
export * from './domain/policy-evaluators';
export * from './domain/planner';
export * from './domain/validation';
export * from './domain/lifecycle';
export * from './domain/executors';
export * from './domain/sessions';
export * from './domain/search';
export * from './domain/metrics';
export * from './domain/health';
export * from './domain/replay';

export * from './application/execution-engine-service';

export * from './infrastructure/ports';
export {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryExecutionStore,
  InMemoryNotifications,
  InMemorySessionStore,
  StaticConfiguration,
  StubExecutionVenue,
  StubOms,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { EXECUTIONS, SESSIONS } from './infrastructure/in-memory/seed';

export * from './composition';
