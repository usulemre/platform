/**
 * @services/portfolio-optimization-service — the canonical Portfolio Optimization Engine.
 *
 * The production computation engine that constructs optimal portfolios from approved trading signals
 * and estimated risk. Like the Feature/Signal Calculation Engines (and unlike the orchestration
 * engines), this service performs REAL, deterministic numerical optimization (via
 * `@platform/portfolio-optimization-sdk`): it exposes the optimizer catalog and dependency graph, an
 * execution pipeline (estimate → optimize → metrics → validation → cache/result registry) with a
 * dependency-aware scheduler, a validation pipeline (finiteness, constraint feasibility, determinism
 * and method-appropriate objective checks), a metadata generator, a result registry, an efficient-
 * frontier explorer, optimizer comparison, a benchmark runner and registry integration. It
 * integrates with the Signal/Feature Calculation Engines, Portfolio Construction Engine, Risk
 * Engine, Backtesting Engine, Execution Simulator, Live Trading Platform, Validation Foundation,
 * Workflow Engine and Configuration Foundation through infrastructure INTERFACES only.
 *
 * No persistence, caching backend, database or transport is implemented here beyond in-memory v1
 * adapters; all computations are deterministic and reproducible (RP-1). The engine computes weights
 * only — deploying capital, risk sign-off and execution belong to downstream engines.
 */
export * from './domain/models';
export * from './domain/hashing';
export * from './domain/input';
export * from './domain/executors';
export * from './domain/dependency-graph';
export * from './domain/validation';
export * from './domain/metadata';
export * from './domain/pipeline';
export * from './domain/benchmark';

export * from './application/portfolio-optimization-service';

export * from './infrastructure/ports';
export {
  InMemoryMarketData,
  InMemoryOptimizationCache,
  InMemoryOptimizationResultStore,
  InMemoryOptimizationStore,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export { SYNTHETIC_UNIVERSES, syntheticUniverse } from './infrastructure/in-memory/synthetic-data';

export * from './composition';
