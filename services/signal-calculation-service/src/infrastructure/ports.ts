/**
 * Infrastructure INTERFACES (ports) for the signal-calculation service. The application and domain
 * layers depend only on these abstractions; concrete adapters are injected at composition time. NO
 * implementation here. The engine computes REAL signals (via the SDK, which derives real features)
 * but reaches datasets, the signal registry, caching, result storage, workflows and configuration
 * only through these abstractions. Other subsystems (Feature Calculation Engine, Feature Store,
 * Signal Engine, Backtesting Engine, Portfolio Construction Engine, Execution Simulator, Live
 * Trading Platform, Validation Foundation, Workflow Engine, Configuration Foundation) are reached by
 * reference only — this engine computes signal values and never sizes, allocates or executes.
 */
import type { OhlcvSeries, SignalKey } from '@platform/signal-calculation-sdk';
import type { SignalResult, SignalResultMetadata } from '../domain/models';

/** Market Data Platform — resolve a typed OHLCV dataset by ref (point-in-time, read-only). */
export interface MarketDataPort {
  getSeries(datasetRef: string): Promise<OhlcvSeries>;
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  >;
}

/** Signal Registry Integration — register a computed signal result's metadata. */
export interface SignalStorePort {
  register(metadata: SignalResultMetadata): Promise<void>;
}

/**
 * Signal Cache — memoize computed results by cache key. Deterministic key = dataset + signal +
 * params. Implementations may be in-memory or distributed; the engine only needs get/set/has.
 */
export interface SignalCache {
  has(key: string): boolean;
  get(key: string): SignalResult | undefined;
  set(key: string, result: SignalResult): void;
  clear(): void;
  readonly size: number;
}

/** Signal Result Registry — store computed results by manifest hash for later retrieval. */
export interface SignalResultStore {
  save(result: SignalResult): void;
  getByManifest(manifestHash: string): SignalResult | undefined;
  list(): readonly SignalResult[];
}

/** Workflow Engine — schedule computation / validation workflows. */
export interface WorkflowPort {
  scheduleComputation(signalKey: SignalKey, datasetRef: string): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
