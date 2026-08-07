/**
 * Real ClickHouse integration tests. These run ONLY when `CLICKHOUSE_TEST=1` (with connection details
 * in the environment); ordinary unit tests never require a server. When enabled they exercise the
 * production `ClickHouseStorageEngine` against a live ClickHouse instance and prove ACTUAL persistence
 * — including survival across a simulated process restart.
 *
 * To run locally:
 *   docker run -d --name ch -e CLICKHOUSE_DB=market_data -e CLICKHOUSE_USER=mds \
 *     -e CLICKHOUSE_PASSWORD=mds_test_pw -p 18123:8123 clickhouse/clickhouse-server:24.8
 *   CLICKHOUSE_TEST=1 CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=18123 CLICKHOUSE_USER=mds \
 *     CLICKHOUSE_PASSWORD=mds_test_pw CLICKHOUSE_DATABASE=market_data pnpm --filter @platform/market-data-storage test
 */
import { SystemClock } from '@platform/market-data-ingestion';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NodeClickHouseClient,
  createMarketDataStorage,
  loadClickHouseConfig,
  type ClickHouseConfig,
  type StorageHandle,
} from '../../src/index';
import { runStorageContract } from '../shared/engine-contract';
import { trade } from '../helpers';

const RUN = process.env.CLICKHOUSE_TEST === '1';
const config: ClickHouseConfig = loadClickHouseConfig(process.env);

async function resetTables(): Promise<void> {
  const client = new NodeClickHouseClient(config);
  await client.command(`DROP TABLE IF EXISTS ${config.table}`);
  await client.command('DROP TABLE IF EXISTS schema_migrations');
  await client.close();
}

// One-time clean slate so migrations recreate the schema from scratch.
beforeAll(async () => {
  if (!RUN) return;
  await resetTables();
}, 30_000);

// Run the shared StorageEngine contract against the REAL ClickHouse engine.
if (RUN) {
  runStorageContract('clickhouse', async () => {
    const handle = await createMarketDataStorage(config, { clock: new SystemClock() });
    return { storage: handle.storage, engine: handle.engine, cleanup: () => handle.close() };
  });
}

describe.skipIf(!RUN)('ClickHouse persistence & operations', () => {
  let handle: StorageHandle;

  beforeAll(async () => {
    handle = await createMarketDataStorage(config, { clock: new SystemClock() });
  }, 30_000);

  afterAll(async () => {
    await handle?.close();
  });

  it('persists market data that SURVIVES a process restart', async () => {
    const inst = 'BINANCE:RESTART-USDT';
    await handle.storage.writeBatch([trade({ instrumentId: inst, tradeId: 111, price: 42_000 })]);
    // Simulate a restart: tear down this handle entirely and build a fresh one (new client + engine).
    await handle.close();

    const restarted = await createMarketDataStorage(config, { clock: new SystemClock() });
    try {
      const rows = await restarted.storage.trades.byInstrument(inst);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tradeId).toBe(111);
      expect(rows[0]?.price).toBe(42_000);
      // The rebuilt engine also re-hydrated its partition catalog from ClickHouse.
      expect(restarted.storage.partitions().some((p) => p.startsWith(inst))).toBe(true);
    } finally {
      // Re-open the shared handle for the remaining tests.
      handle = await createMarketDataStorage(config, { clock: new SystemClock() });
      await restarted.close();
    }
  }, 30_000);

  it('ingests a high-volume batch and queries it back', async () => {
    const inst = 'BINANCE:BULK-USDT';
    const batch = Array.from({ length: 2_000 }, (_, i) =>
      trade({ instrumentId: inst, tradeId: i + 1 }),
    );
    const result = await handle.storage.writeBatch(batch);
    expect(result.persisted).toBe(2_000);
    const rows = await handle.storage.trades.byInstrument(inst);
    expect(rows).toHaveLength(2_000);
  }, 30_000);

  it('handles concurrent writes without loss', async () => {
    const inst = 'BINANCE:CONC-USDT';
    await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        handle.storage.writeBatch([trade({ instrumentId: inst, tradeId: i + 1 })]),
      ),
    );
    const rows = await handle.storage.trades.byInstrument(inst);
    expect(rows).toHaveLength(50);
  }, 30_000);

  it('expires data through ClickHouse partition drop (retention)', async () => {
    const DAY = 86_400_000;
    const oldTime = Date.parse('2020-01-01T00:00:00.000Z');
    const retained = await createMarketDataStorage(config, {
      clock: new SystemClock(),
      retention: { retentionDurationMs: 30 * DAY },
    });
    try {
      const inst = 'BINANCE:RETAIN-USDT';
      await retained.storage.writeBatch([
        trade({
          instrumentId: inst,
          tradeId: 1,
          timestamps: { eventTime: oldTime, receiveTime: oldTime, processingTime: oldTime },
        }),
      ]);
      expect(await retained.storage.trades.byInstrument(inst)).toHaveLength(1);
      // `now` sits just past the old record's retention window but BEFORE the other tests'
      // (2023-dated) partitions, so retention expires only this old partition — proving
      // partition-drop retention works without disturbing the rest of the persisted data.
      const report = await retained.storage.applyRetention(Date.parse('2020-03-15T00:00:00.000Z'));
      expect(report.totalEntries).toBeGreaterThanOrEqual(1);
      expect(await retained.storage.trades.byInstrument(inst)).toHaveLength(0);
    } finally {
      await retained.close();
    }
  }, 30_000);

  it('reports HEALTHY and verifies real connectivity', async () => {
    expect(await handle.verifyConnectivity()).toBe(true);
    const health = await handle.health();
    expect(health.reachable).toBe(true);
    expect(health.status).toBe('HEALTHY');
  });

  it('fails explicitly (no in-memory fallback) when ClickHouse is unreachable', async () => {
    const unreachable: ClickHouseConfig = { ...config, port: 19_919 };
    await expect(
      createMarketDataStorage(unreachable, { clock: new SystemClock() }),
    ).rejects.toThrow(/unreachable/i);
  });
});
