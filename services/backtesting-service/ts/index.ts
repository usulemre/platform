/**
 * @services/backtesting-service — the canonical Backtesting Engine.
 *
 * The orchestration platform for quantitative strategy evaluation: it manages the
 * lifecycle of backtesting projects (draft → configuration → validation → queued
 * → running → completed → review → approved → archived) and coordinates
 * historical simulations using approved datasets, features, signals, strategies
 * and portfolios. It integrates with the Research Engine, Market Data Platform,
 * Dataset/Experiment modules, Feature Store, Signal Engine, Portfolio module,
 * Validation Foundation, Workflow Engine, Configuration Foundation and Event &
 * Messaging Foundation through infrastructure INTERFACES only.
 *
 * It has a pure domain layer (discovery/search, lifecycle + run-control rules,
 * derivations + comparison assembly), an application layer, and infrastructure
 * ports; the only adapters shipped in v1 are in-memory mocks. No simulation
 * engine, no performance-metric computation, no optimization, no statistics, no
 * persistence, no caching, no database, no direct infrastructure access.
 */
export * from './domain/discovery';
export * from './domain/lifecycle';
export * from './domain/derivations';

export * from './application/backtesting-service';

export * from './infrastructure/ports';
export {
  InMemoryBacktestQuery,
  InMemoryComparisonQuery,
  InMemoryFamilyQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { BACKTESTS, FAMILIES, COMPARISONS } from './infrastructure/in-memory/seed';

export * from './composition';
