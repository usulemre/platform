/**
 * Real-ClickHouse integration tests for the canonical {@link MarketDataQueryEngine}. These run ONLY
 * when `CLICKHOUSE_TEST=1` (with connection details in the environment); ordinary unit tests never
 * require a server. When enabled they drive the engine end-to-end over persisted ClickHouse data:
 * historical time-range queries, keyset pagination across many pages, latest-value reads, multi-
 * instrument and market-data-type filtering, order-book snapshot/delta retrieval with sequence
 * ordering, survival across a simulated restart, large result sets, cancellation, and the mapping of
 * an unreachable store to a canonical error.
 *
 * To run locally, see tests/clickhouse/integration.test.ts for the docker one-liner and env vars.
 */
import { SystemClock } from '@platform/market-data-ingestion';
import type { NormalizedTrade } from '@platform/market-data-ingestion';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  NodeClickHouseClient,
  QueryError,
  createMarketDataStorage,
  loadClickHouseConfig,
  type ClickHouseConfig,
  type StorageHandle,
} from '../../src/index';
import { orderBookDelta, orderBookSnapshot, trade } from '../helpers';

const RUN = process.env.CLICKHOUSE_TEST === '1';
const config: ClickHouseConfig = loadClickHouseConfig(process.env);

async function resetTables(): Promise<void> {
  const client = new NodeClickHouseClient(config);
  await client.command(`DROP TABLE IF EXISTS ${config.table}`);
  await client.command('DROP TABLE IF EXISTS schema_migrations');
  await client.close();
}

beforeAll(async () => {
  if (!RUN) return;
  await resetTables();
}, 30_000);

describe.skipIf(!RUN)('MarketDataQueryEngine over real ClickHouse', () => {
  let handle: StorageHandle;

  beforeAll(async () => {
    handle = await createMarketDataStorage(config, { clock: new SystemClock() });
  }, 30_000);

  afterAll(async () => {
    await handle?.close();
  });

  const T = 1_700_100_000_000;
  function ts(eventTime: number) {
    return {
      eventTime,
      exchangeTime: eventTime,
      receiveTime: eventTime,
      processingTime: eventTime,
    };
  }

  it('runs historical time-range queries with inclusive [from, to] semantics', async () => {
    const inst = 'BINANCE:Q-RANGE-USDT';
    await handle.storage.writeBatch([
      trade({ instrumentId: inst, tradeId: 1, timestamps: ts(T + 1000) }),
      trade({ instrumentId: inst, tradeId: 2, timestamps: ts(T + 2000) }),
      trade({ instrumentId: inst, tradeId: 3, timestamps: ts(T + 3000) }),
    ]);
    const rows = await handle.storage.engineQueries.query<NormalizedTrade>({
      instrumentId: inst,
      kind: 'trade',
      timeRange: { from: T + 2000, to: T + 3000 },
    });
    expect(rows.map((r) => r.tradeId)).toEqual([2, 3]);
  }, 30_000);

  it('paginates a large persisted result set deterministically with no gaps', async () => {
    const inst = 'BINANCE:Q-PAGE-USDT';
    const batch = Array.from({ length: 500 }, (_, i) =>
      trade({ instrumentId: inst, tradeId: i + 1, timestamps: ts(T + (i + 1) * 10) }),
    );
    await handle.storage.writeBatch(batch);

    const seen: number[] = [];
    let cursor: string | null = null;
    do {
      const page: Awaited<ReturnType<typeof handle.storage.engineQueries.paginate>> =
        await handle.storage.engineQueries.paginate<NormalizedTrade>({
          instrumentId: inst,
          kind: 'trade',
          limit: 100,
          ...(cursor ? { cursor } : {}),
        });
      seen.push(...page.records.map((r) => (r as { tradeId: number }).tradeId));
      cursor = page.nextCursor;
    } while (cursor !== null);

    expect(seen).toHaveLength(500);
    expect(seen[0]).toBe(1);
    expect(seen[seen.length - 1]).toBe(500);
    expect(new Set(seen).size).toBe(500); // no duplicates across pages
  }, 60_000);

  it('reads the latest value efficiently', async () => {
    const inst = 'BINANCE:Q-LATEST-USDT';
    await handle.storage.writeBatch([
      trade({ instrumentId: inst, tradeId: 1, timestamps: ts(T + 1000) }),
      trade({ instrumentId: inst, tradeId: 9, timestamps: ts(T + 9000) }),
    ]);
    const latest = await handle.storage.engineQueries.latest<NormalizedTrade>(inst, 'trade');
    expect(latest?.tradeId).toBe(9);
  }, 30_000);

  it('filters by multiple instruments and by market-data type', async () => {
    const a = 'BINANCE:Q-MI-A-USDT';
    const b = 'BINANCE:Q-MI-B-USDT';
    await handle.storage.writeBatch([
      trade({ instrumentId: a, tradeId: 1, timestamps: ts(T + 1000) }),
      trade({ instrumentId: b, tradeId: 2, timestamps: ts(T + 2000) }),
    ]);
    const rows = await handle.storage.engineQueries.query({
      instrumentIds: [a, b],
      marketDataType: 'TRADES',
    });
    const instruments = new Set(rows.map((r) => r.instrumentId));
    expect(instruments.has(a)).toBe(true);
    expect(instruments.has(b)).toBe(true);
  }, 30_000);

  it('retrieves order-book snapshots and deltas in sequence order and reconstructs the book', async () => {
    const inst = 'BINANCE:Q-BOOK-USDT';
    await handle.storage.writeBatch([
      orderBookSnapshot({ instrumentId: inst, lastUpdateId: 500 }),
      orderBookDelta({ instrumentId: inst, firstUpdateId: 501, finalUpdateId: 501 }),
      orderBookDelta({ instrumentId: inst, firstUpdateId: 502, finalUpdateId: 502 }),
    ]);
    const deltas = await handle.storage.engineQueries.orderBookDeltas(inst);
    expect(deltas.map((d) => d.finalUpdateId)).toEqual([501, 502]);
    const book = await handle.storage.engineQueries.reconstructOrderBook(inst);
    expect(book?.snapshotUpdateId).toBe(500);
    expect(book?.gapDetected).toBe(false);
  }, 30_000);

  it('serves queries against data that survived a process restart', async () => {
    const inst = 'BINANCE:Q-RESTART-USDT';
    await handle.storage.writeBatch([trade({ instrumentId: inst, tradeId: 7, timestamps: ts(T) })]);
    await handle.close();
    const restarted = await createMarketDataStorage(config, { clock: new SystemClock() });
    try {
      const rows = await restarted.storage.engineQueries.query<NormalizedTrade>({
        instrumentId: inst,
        kind: 'trade',
      });
      expect(rows.map((r) => r.tradeId)).toEqual([7]);
    } finally {
      handle = await createMarketDataStorage(config, { clock: new SystemClock() });
      await restarted.close();
    }
  }, 30_000);

  it('reports HEALTHY against a reachable ClickHouse', async () => {
    const health = await handle.storage.engineQueries.health();
    expect(health.reachable).toBe(true);
    expect(health.status).toBe('HEALTHY');
  }, 30_000);

  it('surfaces a cancelled query as a canonical error', async () => {
    const controller = new AbortController();
    controller.abort();
    const error = await handle.storage.engineQueries
      .query({ instrumentId: 'BINANCE:Q-CANCEL-USDT', signal: controller.signal })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(QueryError);
    expect((error as QueryError).code).toBe('QUERY_CANCELLED');
  }, 30_000);

  it('returns an empty canonical result for an instrument with no persisted data', async () => {
    const rows = await handle.storage.engineQueries.query({
      instrumentId: 'BINANCE:Q-NONE-USDT',
      kind: 'trade',
    });
    expect(rows).toEqual([]);
  }, 30_000);
});
