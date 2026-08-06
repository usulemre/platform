/**
 * Infrastructure INTERFACES (ports) for the portfolio-optimization service. The application and
 * domain layers depend only on these abstractions; concrete adapters are injected at composition
 * time. NO implementation here. The engine computes REAL optimizations (via the SDK) but reaches
 * universes (asset returns), the registry, caching, result storage, workflows and configuration only
 * through these abstractions. Other subsystems (Signal Calculation Engine, Feature Calculation
 * Engine, Portfolio Construction Engine, Risk Engine, Backtesting Engine, Execution Simulator, Live
 * Trading Platform, Validation Foundation, Workflow Engine, Configuration Foundation) are reached by
 * reference only — this engine computes weights and never deploys capital or executes.
 */
import type { OptimizerKey } from '@platform/portfolio-optimization-sdk';
import type { Universe } from '../domain/input';
import type { OptimizationResultRecord, OptimizationResultMetadata } from '../domain/models';

/** Market Data Platform — resolve a universe (assets + returns matrix + sectors) by ref. */
export interface MarketDataPort {
  getUniverse(universeRef: string): Promise<Universe>;
  listUniverses(): Promise<
    readonly {
      readonly ref: string;
      readonly label: string;
      readonly assets: number;
      readonly periods: number;
    }[]
  >;
}

/** Portfolio Construction / Registry — register a computed allocation's metadata. */
export interface OptimizationStorePort {
  register(metadata: OptimizationResultMetadata): Promise<void>;
}

/**
 * Optimization Cache — memoize computed results by cache key (universe + method + params +
 * constraints). Implementations may be in-memory or distributed; the engine only needs get/set/has.
 */
export interface OptimizationCache {
  has(key: string): boolean;
  get(key: string): OptimizationResultRecord | undefined;
  set(key: string, result: OptimizationResultRecord): void;
  clear(): void;
  readonly size: number;
}

/** Optimization Result Registry — store computed results by manifest hash for later retrieval. */
export interface OptimizationResultStore {
  save(result: OptimizationResultRecord): void;
  getByManifest(manifestHash: string): OptimizationResultRecord | undefined;
  list(): readonly OptimizationResultRecord[];
}

/** Workflow Engine — schedule optimization / validation workflows. */
export interface WorkflowPort {
  scheduleOptimization(optimizerKey: OptimizerKey, universeRef: string): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
