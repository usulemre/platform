/**
 * The **storage factory** — the composition root that selects and wires the storage engine from
 * configuration. Production selects `ClickHouseStorageEngine`; `memory` selects the in-memory
 * reference engine (isolated unit tests only). For ClickHouse it verifies connectivity, runs
 * migrations, and hydrates the engine BEFORE returning — and if ClickHouse is unreachable it **throws
 * explicitly** rather than falling back to RAM, so market data is never silently discarded.
 */
import { SystemClock, type Clock } from '@platform/market-data-ingestion';
import { StorageEngineError } from '../errors';
import { InMemoryStorageEngine, type StorageEngine } from '../engine/storage-engine';
import { MarketDataStorage } from '../storage';
import type { RetentionPolicy } from '../retention/retention-manager';
import { ClickHouseStorageEngine } from './clickhouse-storage-engine';
import { NodeClickHouseClient, type ClickHouseClient } from './client';
import { ClickHouseHealthMonitor, type StorageConnectivityReport } from './health';
import { ClickHouseMetrics } from './metrics';
import { MigrationRunner } from './migrations';
import type { ClickHouseConfig } from './config';

export interface StorageFactoryDeps {
  readonly clock?: Clock;
  /** Recorded `applied_at` for migrations; defaults to the clock. */
  readonly now?: number;
  /** Inject a ClickHouse client (tests). Defaults to the real {@link NodeClickHouseClient}. */
  readonly clientFactory?: (config: ClickHouseConfig) => ClickHouseClient;
  readonly retention?: RetentionPolicy;
  readonly chMetrics?: ClickHouseMetrics;
}

/** A wired storage instance and its lifecycle handles. */
export interface StorageHandle {
  readonly storage: MarketDataStorage;
  readonly engine: StorageEngine;
  /** Verify live connectivity (pings ClickHouse; always true for the in-memory engine). */
  verifyConnectivity(): Promise<boolean>;
  /** A connectivity health report (ClickHouse-backed handles ping the server). */
  health(now?: number): Promise<StorageConnectivityReport>;
  close(): Promise<void>;
}

/**
 * Build a fully-wired {@link MarketDataStorage} for the given config. For the `clickhouse` driver this
 * connects, migrates, and hydrates; it throws {@link StorageEngineError} if the server is unreachable.
 */
export async function createMarketDataStorage(
  config: ClickHouseConfig,
  deps: StorageFactoryDeps = {},
): Promise<StorageHandle> {
  const clock = deps.clock ?? new SystemClock();

  if (config.driver === 'memory') {
    const engine = new InMemoryStorageEngine();
    const storage = new MarketDataStorage({
      engine,
      clock,
      ...(deps.retention ? { retention: deps.retention } : {}),
    });
    return {
      storage,
      engine,
      verifyConnectivity: async () => true,
      health: async (now = clock.now()) => ({
        status: 'HEALTHY',
        reachable: true,
        detail: 'In-memory engine (no external dependency).',
        checkedAt: now,
      }),
      close: async () => {},
    };
  }

  // Production: ClickHouse. Fail explicitly on unavailability — never fall back to RAM.
  const client = deps.clientFactory ? deps.clientFactory(config) : new NodeClickHouseClient(config);
  const reachable = await client.ping();
  if (!reachable) {
    await client.close();
    throw new StorageEngineError(
      'ClickHouse is unreachable; refusing to start market-data storage (no in-memory fallback).',
      'ENGINE_UNAVAILABLE',
    );
  }

  const chMetrics = deps.chMetrics ?? new ClickHouseMetrics();
  await new MigrationRunner(client, config.table).migrate(deps.now ?? clock.now());

  const engine = new ClickHouseStorageEngine(client, {
    table: config.table,
    maxBatchSize: config.maxBatchSize,
    clock,
    metrics: chMetrics,
  });
  await engine.initialize();

  const storage = new MarketDataStorage({
    engine,
    clock,
    ...(deps.retention ? { retention: deps.retention } : {}),
  });
  const healthMonitor = new ClickHouseHealthMonitor(engine, chMetrics);

  return {
    storage,
    engine,
    verifyConnectivity: () => engine.ping(),
    health: (now = clock.now()) => healthMonitor.check(now),
    close: () => engine.close(),
  };
}
