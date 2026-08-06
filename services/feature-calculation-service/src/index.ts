/**
 * @services/feature-calculation-service — the canonical Feature Calculation Engine.
 *
 * The production computation engine that calculates quantitative features from canonical market
 * datasets. Unlike the orchestration engines, this service performs REAL, deterministic, causal
 * calculations (via `@platform/feature-calculation-sdk`): it exposes the calculation catalog and
 * dependency graph, an execution pipeline (executor → reproducibility metadata → validation →
 * cache/result registry) with a dependency-aware scheduler, a validation pipeline (length, finite,
 * determinism and point-in-time causality checks), a metadata generator, a result registry, a
 * benchmark runner and Feature Store registry integration. It integrates with the Market Data
 * Platform, Feature Store, Research Engine, Backtesting Engine, Signal Engine, Validation
 * Foundation, Workflow Engine and Configuration Foundation through infrastructure INTERFACES only.
 *
 * No persistence, caching backend, database or transport is implemented here beyond in-memory v1
 * adapters; all computations are point-in-time (PIT-3 / CP-3) and reproducible (RP-1).
 */
export * from './domain/models';
export * from './domain/hashing';
export * from './domain/executors';
export * from './domain/dependency-graph';
export * from './domain/validation';
export * from './domain/metadata';
export * from './domain/pipeline';
export * from './domain/benchmark';

export * from './application/feature-calculation-service';

export * from './infrastructure/ports';
export {
  InMemoryFeatureCache,
  InMemoryFeatureResultStore,
  InMemoryFeatureStore,
  InMemoryMarketData,
  StaticConfiguration,
  StubWorkflow,
} from './infrastructure/in-memory/adapters';
export {
  SYNTHETIC_DATASETS,
  syntheticBars,
  syntheticSeries,
} from './infrastructure/in-memory/synthetic-data';

export * from './composition';
