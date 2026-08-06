/**
 * In-memory adapters for the feature-calculation service ports (development/test only). NO
 * database, NO network. The market-data adapter serves deterministic synthetic OHLCV; the cache
 * and result store are simple maps; the feature-store and workflow adapters record intent. The
 * calculations run against this data are REAL (from the SDK).
 */
import type { OhlcvSeries } from '@platform/feature-calculation-sdk';
import type { FeatureResult, FeatureResultMetadata } from '../../domain/models';
import type {
  ConfigurationPort,
  FeatureCache,
  FeatureResultStore,
  FeatureStorePort,
  MarketDataPort,
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

/** Feature Store — records registered feature metadata in memory. */
export class InMemoryFeatureStore implements FeatureStorePort {
  readonly registered: FeatureResultMetadata[] = [];
  async register(metadata: FeatureResultMetadata): Promise<void> {
    this.registered.push(metadata);
  }
}

/** In-memory feature cache keyed by the deterministic cache key. */
export class InMemoryFeatureCache implements FeatureCache {
  private readonly store = new Map<string, FeatureResult>();
  has(key: string): boolean {
    return this.store.has(key);
  }
  get(key: string): FeatureResult | undefined {
    return this.store.get(key);
  }
  set(key: string, result: FeatureResult): void {
    this.store.set(key, result);
  }
  clear(): void {
    this.store.clear();
  }
  get size(): number {
    return this.store.size;
  }
}

/** In-memory feature result registry keyed by manifest hash. */
export class InMemoryFeatureResultStore implements FeatureResultStore {
  private readonly byManifest = new Map<string, FeatureResult>();
  private readonly order: FeatureResult[] = [];
  save(result: FeatureResult): void {
    if (!this.byManifest.has(result.metadata.manifestHash)) this.order.push(result);
    this.byManifest.set(result.metadata.manifestHash, result);
  }
  getByManifest(manifestHash: string): FeatureResult | undefined {
    return this.byManifest.get(manifestHash);
  }
  list(): readonly FeatureResult[] {
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
