/**
 * @services/live-trading-service — the canonical Live Trading Platform.
 *
 * The production trading platform that promotes validated, paper-traded strategies into
 * governed production. It manages the deployment lifecycle (candidate → deployment request
 * → risk approval → deployment approval → production ready → running → paused → stopped →
 * archived), broker connectivity ABSTRACTIONS, order-lifecycle orchestration, account
 * management, deployment governance, the always-available emergency stop and kill switch,
 * production health, trading metrics and audit. It integrates with the Execution
 * Simulator, Risk Engine, Portfolio Construction Engine, Signal Engine, Market Data
 * Platform, Connector Management, Configuration Foundation, Validation Foundation, Workflow
 * Engine, Authentication, Audit Center, Monitoring Module and Notification Center through
 * infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle + runtime-control rules,
 * derivations), an application layer, and infrastructure ports; the only adapters shipped
 * in v1 are in-memory mocks. It NEVER contains an exchange SDK, broker SDK, API key,
 * HTTP/REST client, WebSocket or FIX; it performs no order execution, no PnL/exposure
 * computation, no statistics, no persistence, no caching, no database and no direct
 * infrastructure access. Default posture is paper/shadow; live requires a valid governance
 * authorization token, and the kill switch is always honoured (never gated by AI).
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/live-trading-service';

export * from './infrastructure/ports';
export {
  InMemoryAccountQuery,
  InMemoryConnectionQuery,
  InMemoryDeploymentQuery,
  InMemoryFamilyQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { DEPLOYMENTS, FAMILIES, ACCOUNTS, CONNECTIONS } from './infrastructure/in-memory/seed';

export * from './composition';
