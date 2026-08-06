/**
 * @services/execution-simulator-service — the canonical Execution Simulator.
 *
 * The paper-trading and execution-simulation platform that validates execution workflows
 * before any strategy is promoted to live trading. It manages the lifecycle of
 * simulation sessions (draft → scenario configuration → validation → queued → running →
 * completed → review → approved → archived) and coordinates simulated order lifecycles,
 * fills, execution scenarios and portfolio state transitions. It integrates with the
 * Market Data Platform, Research Engine, Signal Engine, Backtesting Engine, Portfolio
 * Construction Engine, Risk Engine, Validation Foundation, Workflow Engine, Configuration
 * Foundation, Monitoring Module, Audit Center and Notification Center through
 * infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle + run-control rules,
 * derivations + comparison assembly), an application layer, and infrastructure ports; the
 * only adapters shipped in v1 are in-memory mocks. It NEVER communicates with an exchange
 * or broker, NEVER implements FIX or WebSocket, and contains no execution algorithm, no
 * fill/price/PnL computation, no statistics, no persistence, no caching, no database, no
 * direct infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/execution-simulator-service';

export * from './infrastructure/ports';
export {
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
  InMemorySessionQuery,
  InMemoryTemplateQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { SESSIONS, FAMILIES, TEMPLATES, COMPARISONS } from './infrastructure/in-memory/seed';

export * from './composition';
