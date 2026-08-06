/**
 * In-memory adapters for the signal-calculation service ports (development/test only). NO database,
 * NO network. The market-data adapter serves deterministic synthetic OHLCV; the cache and result
 * store are simple maps; the signal-store and workflow adapters record intent. The signal
 * generation run against this data is REAL (from the SDK).
 */
import type { OhlcvSeries } from '@platform/signal-calculation-sdk';
import type { SignalResult, SignalResultMetadata } from '../../domain/models';
import type {
  ConfigurationPort,
  MarketDataPort,
  SignalCache,
  SignalResultStore,
  SignalStorePort,
  WorkflowPort,
} from '../ports';
import { SYNTHETIC_DATASETS, syntheticSeries } from './synthetic-data';

/** Market Data Platform — deterministic synthetic datasets, memoized per ref. */
export class InMemoryMarketData implements MarketDataPort {
  private readonly cache = new Map<string, OhlcvSeries>();

  async getSeries(datasetRef: string): Promise<OhlcvSeries> {
    const existing = this.cache.get(datasetRef);
    if (existing) return existing;
    const dataset = SYNTHETIC_DATASETS.find((entry) => entry.ref === datasetRef);
    if (!dataset) throw new RangeError(`unknown dataset '${datasetRef}'`);
    const series = syntheticSeries(dataset.bars, dataset.seed);
    this.cache.set(datasetRef, series);
    return series;
  }

  async listDatasets(): Promise<readonly { ref: string; label: string; bars: number }[]> {
    return SYNTHETIC_DATASETS.map((dataset) => ({
      ref: dataset.ref,
      label: dataset.label,
      bars: dataset.bars,
    }));
  }
}

/** Signal Registry — records registered signal metadata in memory. */
export class InMemorySignalStore implements SignalStorePort {
  readonly registered: SignalResultMetadata[] = [];
  async register(metadata: SignalResultMetadata): Promise<void> {
    this.registered.push(metadata);
  }
}

/** In-memory signal cache keyed by the deterministic cache key. */
export class InMemorySignalCache implements SignalCache {
  private readonly store = new Map<string, SignalResult>();
  has(key: string): boolean {
    return this.store.has(key);
  }
  get(key: string): SignalResult | undefined {
    return this.store.get(key);
  }
  set(key: string, result: SignalResult): void {
    this.store.set(key, result);
  }
  clear(): void {
    this.store.clear();
  }
  get size(): number {
    return this.store.size;
  }
}

/** In-memory signal result registry keyed by manifest hash. */
export class InMemorySignalResultStore implements SignalResultStore {
  private readonly byManifest = new Map<string, SignalResult>();
  private readonly order: SignalResult[] = [];
  save(result: SignalResult): void {
    if (!this.byManifest.has(result.metadata.manifestHash)) this.order.push(result);
    this.byManifest.set(result.metadata.manifestHash, result);
  }
  getByManifest(manifestHash: string): SignalResult | undefined {
    return this.byManifest.get(manifestHash);
  }
  list(): readonly SignalResult[] {
    return this.order;
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleComputation(): Promise<void> {
    /* no-op */
  }
}

/** Configuration Foundation — static, non-secret configuration by key. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
