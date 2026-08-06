/**
 * @services/order-management-service — the canonical Order Management System (OMS).
 *
 * The single source of truth for all orders before they are routed to execution venues. It manages
 * the complete order lifecycle with REAL, deterministic lifecycle logic (the `@platform/order-sdk`
 * state machine): create → validated → pending approval → approved → queued → submitted → accepted →
 * partially filled → filled / cancelled / rejected / expired, plus the actions replace / amend /
 * suspend / resume / cancel / retry, fill bookkeeping, pre-trade validation, event-sourced replay,
 * search, metrics and health. It integrates with the Portfolio Optimization Engine, Risk Engine,
 * Execution Simulator, Live Trading Platform, Signal Calculation Engine, Workflow Engine, Validation
 * Foundation, Configuration Foundation, Monitoring Module, Audit Center and Notification Center
 * through infrastructure INTERFACES only.
 *
 * It holds NO broker SDK, NO exchange API, NO FIX, NO HTTP/WebSocket transport, NO order execution
 * and NO persistence beyond in-memory v1 adapters. Every lifecycle transition is enforced by the
 * state machine; routing to an execution venue is an abstraction dispatched through a gateway port.
 */
export * from './domain/lifecycle';
export * from './domain/validation';
export * from './domain/search';
export * from './domain/metrics';
export * from './domain/health';
export * from './domain/replay';

export * from './application/order-management-service';

export * from './infrastructure/ports';
export {
  InMemoryAudit,
  InMemoryEventBus,
  InMemoryNotifications,
  InMemoryOrderStore,
  StaticConfiguration,
  StubExecutionGateway,
  StubRisk,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { ORDERS } from './infrastructure/in-memory/seed';

export * from './composition';
