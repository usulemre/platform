/**
 * Unit tests for the canonical {@link MarketDataQueryEngine}: filtering, inclusive time-range
 * semantics, deterministic ordering, limit enforcement, latest-value efficiency, sequence filtering,
 * order-book retrieval/reconstruction, canonical error mapping, cancellation, metrics, and health.
 * Runs against the in-memory reference engine through the public storage façade.
 */
import { ManualClock } from '@platform/market-data-ingestion';
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MarketDataQueryEngine,
  MarketDataQueryRepository,
  MarketDataStorage,
  QueryError,
  type StorageEngine,
} from '../../src/index';
import { candlestick, orderBookDelta, orderBookSnapshot, ticker, trade, T0 } from '../helpers';

const INST = 'BINANCE:BTC-USDT';
const OTHER = 'BINANCE:ETH-USDT';

async function seededStorage(): Promise<MarketDataStorage> {
  const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
  await storage.writeBatch([
    trade({ instrumentId: INST, tradeId: 1, timestamps: ts(T0 + 1000) }),
    trade({ instrumentId: INST, tradeId: 2, timestamps: ts(T0 + 2000) }),
    trade({ instrumentId: INST, tradeId: 3, timestamps: ts(T0 + 3000) }),
    trade({ instrumentId: OTHER, tradeId: 4, timestamps: ts(T0 + 1500) }),
  ]);
  return storage;
}

function ts(eventTime: number) {
  return { eventTime, exchangeTime: eventTime, receiveTime: eventTime, processingTime: eventTime };
}

describe('MarketDataQueryEngine — filtering & ordering', () => {
  let engine: MarketDataQueryEngine;

  beforeEach(async () => {
    engine = (await seededStorage()).engineQueries;
  });

  it('filters by instrument and returns canonical records ascending by primary time', async () => {
    const rows = await engine.query({ instrumentId: INST, kind: 'trade' });
    expect(rows.map((r) => (r as { tradeId: number }).tradeId)).toEqual([1, 2, 3]);
  });

  it('orders descending on request (deterministic)', async () => {
    const rows = await engine.query({ instrumentId: INST, kind: 'trade', order: 'desc' });
    expect(rows.map((r) => (r as { tradeId: number }).tradeId)).toEqual([3, 2, 1]);
  });

  it('applies inclusive [from, to] time-range semantics on the primary timestamp', async () => {
    const rows = await engine.query({
      instrumentId: INST,
      kind: 'trade',
      timeRange: { from: T0 + 2000, to: T0 + 3000 }, // both bounds inclusive
    });
    expect(rows.map((r) => (r as { tradeId: number }).tradeId)).toEqual([2, 3]);
  });

  it('supports multi-instrument queries', async () => {
    const rows = await engine.query({ instrumentIds: [INST, OTHER], kind: 'trade' });
    expect(rows.map((r) => (r as { tradeId: number }).tradeId)).toEqual([1, 4, 2, 3]);
  });

  it('enforces an explicit limit', async () => {
    const rows = await engine.query({ instrumentId: INST, kind: 'trade', limit: 2 });
    expect(rows).toHaveLength(2);
  });
});

describe('MarketDataQueryEngine — multi-type', () => {
  it('merges multiple market-data types into one canonical, time-ordered result', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.writeBatch([
      trade({ instrumentId: INST, tradeId: 1, timestamps: ts(T0 + 1000) }),
      candlestick({ instrumentId: INST, openTime: T0 + 2000 }),
    ]);
    const rows = await storage.engineQueries.query({
      instrumentId: INST,
      marketDataTypes: ['TRADES', 'OHLCV'],
    });
    expect(rows.map((r) => r.kind)).toEqual(['trade', 'candlestick']);
  });
});

describe('MarketDataQueryEngine — latest', () => {
  it('returns the most recent record for an instrument and kind', async () => {
    const engine = (await seededStorage()).engineQueries;
    const latest = await engine.latest<NormalizedMarketDataRecord & { tradeId: number }>(
      INST,
      'trade',
    );
    expect(latest?.tradeId).toBe(3);
  });

  it('returns null when the instrument has no data of that kind', async () => {
    const engine = (await seededStorage()).engineQueries;
    expect(await engine.latest('UNKNOWN:X', 'trade')).toBeNull();
  });
});

describe('MarketDataQueryEngine — sequence filtering', () => {
  it('restricts results to the inclusive sequence range and drops kinds without a sequence', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.writeBatch([
      trade({ instrumentId: INST, tradeId: 10, timestamps: ts(T0 + 1000) }),
      trade({ instrumentId: INST, tradeId: 20, timestamps: ts(T0 + 2000) }),
      trade({ instrumentId: INST, tradeId: 30, timestamps: ts(T0 + 3000) }),
      ticker({ instrumentId: INST, timestamps: ts(T0 + 4000) }), // no provenance.sequence
    ]);
    const rows = await storage.engineQueries.query({
      instrumentId: INST,
      sequenceRange: { from: 20, to: 30 },
    });
    expect(rows.map((r) => (r as { tradeId: number }).tradeId)).toEqual([20, 30]);
  });
});

describe('MarketDataQueryEngine — order book', () => {
  async function bookStorage(): Promise<MarketDataStorage> {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.writeBatch([
      orderBookSnapshot({ instrumentId: INST, lastUpdateId: 100 }),
      orderBookDelta({
        instrumentId: INST,
        firstUpdateId: 101,
        finalUpdateId: 101,
        bids: [{ price: 49_990, quantity: 9 }],
        asks: [],
      }),
      orderBookDelta({
        instrumentId: INST,
        firstUpdateId: 102,
        finalUpdateId: 102,
        bids: [{ price: 49_980, quantity: 4 }],
        asks: [],
      }),
    ]);
    return storage;
  }

  it('retrieves snapshots and deltas ordered by their update-id sequence', async () => {
    const engine = (await bookStorage()).engineQueries;
    const snaps = await engine.orderBookSnapshots(INST);
    expect(snaps.map((s) => s.lastUpdateId)).toEqual([100]);
    const deltas = await engine.orderBookDeltas(INST);
    expect(deltas.map((d) => d.finalUpdateId)).toEqual([101, 102]);
  });

  it('filters deltas by an overlapping sequence range without dropping bridging deltas', async () => {
    const engine = (await bookStorage()).engineQueries;
    const deltas = await engine.orderBookDeltas(INST, { sequenceRange: { from: 102, to: 200 } });
    expect(deltas.map((d) => d.finalUpdateId)).toEqual([102]);
  });

  it('reconstructs the book deterministically via the existing reconstruction logic', async () => {
    const engine = (await bookStorage()).engineQueries;
    const book = await engine.reconstructOrderBook(INST);
    expect(book?.snapshotUpdateId).toBe(100);
    expect(book?.lastUpdateId).toBe(102);
    expect(book?.appliedDeltas).toBe(2);
    expect(book?.gapDetected).toBe(false);
  });
});

describe('MarketDataQueryEngine — validation & error mapping', () => {
  let engine: MarketDataQueryEngine;
  beforeEach(async () => {
    engine = (await seededStorage()).engineQueries;
  });

  it('rejects an invalid limit before touching storage', async () => {
    await expect(engine.query({ instrumentId: INST, limit: 0 })).rejects.toMatchObject({
      code: 'LIMIT_INVALID',
    });
  });

  it('rejects an inverted time range', async () => {
    await expect(
      engine.query({ instrumentId: INST, timeRange: { from: 10, to: 5 } }),
    ).rejects.toMatchObject({ code: 'TIME_RANGE_INVALID' });
  });

  it('rejects an unsupported market-data type', async () => {
    await expect(
      engine.query({ instrumentId: INST, marketDataType: 'NOT_A_TYPE' as never }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MARKET_DATA_TYPE' });
  });

  it('rejects a malformed cursor', async () => {
    await expect(
      engine.query({ instrumentId: INST, cursor: 'not-a-valid-cursor' }),
    ).rejects.toMatchObject({ code: 'CURSOR_INVALID' });
  });

  it('surfaces a cancelled query as a canonical QUERY_CANCELLED error', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      engine.query({ instrumentId: INST, signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'QUERY_CANCELLED' });
  });

  it('maps a raw storage failure to STORAGE_UNAVAILABLE (no raw error leaks)', async () => {
    const failing = new MarketDataQueryEngine({
      repository: new MarketDataQueryRepository({ engine: throwingEngine() }),
      clock: new ManualClock(T0),
    });
    const error = await failing.query({ instrumentId: INST }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(QueryError);
    expect((error as QueryError).code).toBe('STORAGE_UNAVAILABLE');
    expect((error as QueryError).message).not.toMatch(/clickhouse|sql/i);
  });
});

describe('MarketDataQueryEngine — metrics & health', () => {
  it('records query metrics including pagination, latest, and order-book usage', async () => {
    const engine = (await seededStorage()).engineQueries;
    await engine.query({ instrumentId: INST, kind: 'trade' });
    await engine.paginate({ instrumentId: INST, kind: 'trade', limit: 2 });
    await engine.latest(INST, 'trade');
    const m = engine.metrics();
    expect(m.queriesRun).toBeGreaterThanOrEqual(3);
    expect(m.paginationQueries).toBe(1);
    expect(m.latestQueries).toBe(1);
    expect(m.rowsReturned).toBeGreaterThan(0);
  });

  it('reports HEALTHY for an in-memory backend with no failures', async () => {
    const engine = (await seededStorage()).engineQueries;
    const health = await engine.health(T0);
    expect(health.status).toBe('HEALTHY');
    expect(health.reachable).toBe(true);
  });

  it('reports DEGRADED after a query failure even while reachable', async () => {
    const engine = (await seededStorage()).engineQueries;
    await engine.query({ instrumentId: INST, limit: -1 }).catch(() => undefined);
    const health = await engine.health(T0);
    expect(health.status).toBe('DEGRADED');
    expect(health.failures).toBeGreaterThan(0);
  });

  it('reports UNAVAILABLE when the storage liveness probe fails', async () => {
    const engine = new MarketDataQueryEngine({
      repository: new MarketDataQueryRepository({ engine: throwingEngine() }),
      clock: new ManualClock(T0),
      availabilityProbe: { ping: async () => false },
    });
    const health = await engine.health(T0);
    expect(health.status).toBe('UNAVAILABLE');
    expect(health.reachable).toBe(false);
  });
});

/** A storage engine that fails every read with a canonical storage error (simulates DB down). */
function throwingEngine(): StorageEngine {
  return {
    async write() {
      return { persisted: 0, duplicates: 0, upserts: 0 };
    },
    async read() {
      const { StorageEngineError } = await import('../../src/errors');
      throw new StorageEngineError('storage down', 'ENGINE_UNAVAILABLE');
    },
    listPartitions() {
      return [`${INST}|TRADES|2023-11-14`];
    },
    async dropPartition() {
      return 0;
    },
    count() {
      return 0;
    },
  };
}
