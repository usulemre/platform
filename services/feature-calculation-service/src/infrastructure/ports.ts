/**
 * Infrastructure INTERFACES (ports) for the feature-calculation service. The application and
 * domain layers depend only on these abstractions; concrete adapters are injected at composition
 * time. NO implementation here. The engine computes REAL features (via the SDK) but reaches
 * datasets, the feature store, caching, result storage, workflows and configuration only through
 * these abstractions. Other subsystems (Market Data Platform, Feature Store, Research Engine,
 * Backtesting Engine, Signal Engine, Validation Foundation, Workflow Engine, Configuration
 * Foundation) are reached by reference only.
 */
import type { FeatureKey, OhlcvSeries } from '@platform/feature-calculation-sdk';
import type { FeatureResult, FeatureResultMetadata } from '../domain/models';

/** Market Data Platform — resolve a typed OHLCV dataset by ref (point-in-time, read-only). */
export interface MarketDataPort {
  getSeries(datasetRef: string): Promise<OhlcvSeries>;
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  >;
}

/** Feature Store — register a computed feature result's metadata (Feature Registry Integration). */
export interface FeatureStorePort {
  register(metadata: FeatureResultMetadata): Promise<void>;
}

/**
 * Feature Cache — memoize computed results by cache key. Deterministic key = dataset + feature +
 * params. Implementations may be in-memory or distributed; the engine only needs get/set/has.
 */
export interface FeatureCache {
  has(key: string): boolean;
  get(key: string): FeatureResult | undefined;
  set(key: string, result: FeatureResult): void;
  clear(): void;
  readonly size: number;
}

/** Feature Result Registry — store computed results by manifest hash for later retrieval. */
export interface FeatureResultStore {
  save(result: FeatureResult): void;
  getByManifest(manifestHash: string): FeatureResult | undefined;
  list(): readonly FeatureResult[];
}

/** Workflow Engine — schedule computation / validation workflows. */
export interface WorkflowPort {
  scheduleComputation(featureKey: FeatureKey, datasetRef: string): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
