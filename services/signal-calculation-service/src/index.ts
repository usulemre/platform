/**
 * @services/signal-calculation-service — the canonical Signal Calculation Engine.
 *
 * The production computation engine that transforms quantitative features into standardized trading
 * signals. Like the Feature Calculation Engine (and unlike the orchestration engines), this service
 * performs REAL, deterministic, causal computation (via `@platform/signal-calculation-sdk`, which
 * derives its features from `@platform/feature-calculation-sdk`): it exposes the signal catalog and
 * dependency graph, an execution pipeline (executor → reproducibility metadata → validation →
 * cache/result registry) with a dependency-aware scheduler, a validation pipeline (length, finite,
 * value-range, determinism and point-in-time causality checks), a metadata generator, a result
 * registry, a benchmark runner, signal comparison and Signal Registry integration. It integrates
 * with the Feature Calculation Engine, Feature Store, Signal Engine, Backtesting Engine, Portfolio
 * Construction Engine, Execution Simulator, Live Trading Platform, Validation Foundation, Workflow
 * Engine and Configuration Foundation through infrastructure INTERFACES only.
 *
 * No persistence, caching backend, database or transport is implemented here beyond in-memory v1
 * adapters; all computations are point-in-time (PIT-3 / CP-3) and reproducible (RP-1). The engine
 * computes signal values only — sizing, allocation and execution belong to downstream engines.
 */
export * from './domain/models';
export * from './domain/hashing';
export * from './domain/executors';
export * from './domain/dependency-graph';
export * from './domain/validation';
export * from './domain/metadata';
export * from './domain/pipeline';
export * from './domain/benchmark';

export * from './application/signal-calculation-service';

export * from './infrastructure/ports';
export {
  InMemoryMarketData,
  InMemorySignalCache,
  InMemorySignalResultStore,
  InMemorySignalStore,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export {
  SYNTHETIC_DATASETS,
  syntheticBars,
  syntheticSeries,
} from './infrastructure/in-memory/synthetic-data';

export * from './composition';
