/**
 * In-memory adapters for the portfolio-optimization service ports (development/test only). NO
 * database, NO network. The market-data adapter serves deterministic synthetic universes; the cache
 * and result store are simple maps; the registry and workflow adapters record intent. The
 * optimizations run against this data are REAL (from the SDK).
 */
import type { Universe } from '../../domain/input';
import type { OptimizationResultRecord, OptimizationResultMetadata } from '../../domain/models';
import type {
  ConfigurationPort,
  MarketDataPort,
  OptimizationCache,
  OptimizationResultStore,
  OptimizationStorePort,
  WorkflowPort,
} from '../ports';
import { SYNTHETIC_UNIVERSES } from './synthetic-data';

/** Market Data Platform — deterministic synthetic universes. */
export class InMemoryMarketData implements MarketDataPort {
  async getUniverse(universeRef: string): Promise<Universe> {
    const universe = SYNTHETIC_UNIVERSES.find((entry) => entry.ref === universeRef);
    if (!universe) throw new RangeError(`unknown universe '${universeRef}'`);
    return universe;
  }

  async listUniverses(): Promise<
    readonly { ref: string; label: string; assets: number; periods: number }[]
  > {
    return SYNTHETIC_UNIVERSES.map((universe) => ({
      ref: universe.ref,
      label: universe.label,
      assets: universe.assets.length,
      periods: universe.returns.rows,
    }));
  }
}

/** Portfolio Construction / Registry — records registered allocation metadata in memory. */
export class InMemoryOptimizationStore implements OptimizationStorePort {
  readonly registered: OptimizationResultMetadata[] = [];
  async register(metadata: OptimizationResultMetadata): Promise<void> {
    this.registered.push(metadata);
  }
}

/** In-memory optimization cache keyed by the deterministic cache key. */
export class InMemoryOptimizationCache implements OptimizationCache {
  private readonly store = new Map<string, OptimizationResultRecord>();
  has(key: string): boolean {
    return this.store.has(key);
  }
  get(key: string): OptimizationResultRecord | undefined {
    return this.store.get(key);
  }
  set(key: string, result: OptimizationResultRecord): void {
    this.store.set(key, result);
  }
  clear(): void {
    this.store.clear();
  }
  get size(): number {
    return this.store.size;
  }
}

/** In-memory optimization result registry keyed by manifest hash. */
export class InMemoryOptimizationResultStore implements OptimizationResultStore {
  private readonly byManifest = new Map<string, OptimizationResultRecord>();
  private readonly order: OptimizationResultRecord[] = [];
  save(result: OptimizationResultRecord): void {
    if (!this.byManifest.has(result.metadata.manifestHash)) this.order.push(result);
    this.byManifest.set(result.metadata.manifestHash, result);
  }
  getByManifest(manifestHash: string): OptimizationResultRecord | undefined {
    return this.byManifest.get(manifestHash);
  }
  list(): readonly OptimizationResultRecord[] {
    return this.order;
  }
}

/** Workflow Engine — records scheduling intent only. */
export class StubWorkflow implements WorkflowPort {
  async scheduleOptimization(): Promise<void> {
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
