import { ManualClock } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import {
  InMemoryStorageEngine,
  MarketDataWriter,
  StorageDeadLetterQueue,
  StorageMetrics,
  type EngineWriteReport,
  type StorageEngine,
  type StoredEntry,
} from '../src/index';
import { T0, trade } from './helpers';

function makeWriter(engine: StorageEngine, maxAttempts = 3) {
  const metrics = new StorageMetrics();
  const deadLetter = new StorageDeadLetterQueue();
  const clock = new ManualClock(T0);
  const writer = new MarketDataWriter({
    engine,
    metrics,
    deadLetter,
    clock,
    config: { maxAttempts },
  });
  return { writer, metrics, deadLetter, engine };
}

describe('MarketDataWriter', () => {
  it('writes a single record', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer, metrics } = makeWriter(engine);
    const result = await writer.write(trade({ tradeId: 1 }));
    expect(result.persisted).toBe(1);
    expect(engine.count()).toBe(1);
    expect(metrics.snapshot().persisted).toBe(1);
  });

  it('writes a batch and groups by partition', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer } = makeWriter(engine);
    const result = await writer.writeBatch([
      trade({ tradeId: 1 }),
      trade({ tradeId: 2 }),
      trade({ tradeId: 3 }),
    ]);
    expect(result.persisted).toBe(3);
    expect(engine.count()).toBe(3);
  });

  it('is idempotent — re-writing the same records does not corrupt or duplicate', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer, metrics } = makeWriter(engine);
    await writer.writeBatch([trade({ tradeId: 1 }), trade({ tradeId: 2 })]);
    const again = await writer.writeBatch([trade({ tradeId: 1 }), trade({ tradeId: 2 })]);
    expect(again.persisted).toBe(0);
    expect(again.duplicates).toBe(2);
    expect(engine.count()).toBe(2);
    expect(metrics.snapshot().duplicates).toBe(2);
  });

  it('rejects and quarantines an invalid record without persisting it', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer, deadLetter, metrics } = makeWriter(engine);
    const result = await writer.writeBatch([trade({ price: -1 }), trade({ tradeId: 9 })]);
    expect(result.rejected).toBe(1);
    expect(result.persisted).toBe(1);
    expect(deadLetter.size).toBe(1);
    expect(deadLetter.list()[0]?.stage).toBe('validation');
    expect(metrics.snapshot().rejected).toBe(1);
  });

  it('retries a transient engine failure then persists', async () => {
    let calls = 0;
    const flaky: StorageEngine = {
      async write(entries): Promise<EngineWriteReport> {
        calls += 1;
        if (calls < 2) throw new Error('connection reset');
        return { persisted: entries.length, duplicates: 0, upserts: 0 };
      },
      async read() {
        return [];
      },
      listPartitions() {
        return [];
      },
      async dropPartition() {
        return 0;
      },
      count() {
        return 0;
      },
    };
    const { writer, metrics } = makeWriter(flaky);
    const result = await writer.write(trade());
    expect(result.persisted).toBe(1);
    expect(metrics.snapshot().engineErrors).toBe(1);
    expect(metrics.snapshot().retries).toBe(1);
  });

  it('quarantines records after exhausting engine retries', async () => {
    const broken: StorageEngine = {
      async write(): Promise<EngineWriteReport> {
        throw new Error('engine down');
      },
      async read() {
        return [];
      },
      listPartitions() {
        return [];
      },
      async dropPartition() {
        return 0;
      },
      count() {
        return 0;
      },
    };
    const { writer, deadLetter, metrics } = makeWriter(broken, 2);
    const result = await writer.write(trade());
    expect(result.failed).toBe(1);
    expect(result.persisted).toBe(0);
    expect(deadLetter.list()[0]?.stage).toBe('engine');
    expect(deadLetter.list()[0]?.reason.code).toBe('WRITE_FAILED');
    expect(metrics.snapshot().engineErrors).toBe(2);
  });

  it('handles partial batch failure — healthy partitions persist while a failing one is quarantined', async () => {
    // Fail writes only for the ETH partition; BTC succeeds.
    const inner = new InMemoryStorageEngine();
    const selective: StorageEngine = {
      async write(entries: readonly StoredEntry[]): Promise<EngineWriteReport> {
        if (entries.some((e) => e.partition.includes('ETH'))) throw new Error('shard offline');
        return inner.write(entries);
      },
      read: (p) => inner.read(p),
      listPartitions: () => inner.listPartitions(),
      dropPartition: (p) => inner.dropPartition(p),
      count: () => inner.count(),
    };
    const { writer, deadLetter } = makeWriter(selective, 1);
    const result = await writer.writeBatch([
      trade({ tradeId: 1, instrumentId: 'BINANCE:BTC-USDT' }),
      trade({ tradeId: 2, instrumentId: 'BINANCE:ETH-USDT' }),
    ]);
    expect(result.persisted).toBe(1);
    expect(result.failed).toBe(1);
    expect(deadLetter.list().every((e) => e.record.instrumentId === 'BINANCE:ETH-USDT')).toBe(true);
  });

  it('persists a high volume of records', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer } = makeWriter(engine);
    const batch = Array.from({ length: 5_000 }, (_, i) => trade({ tradeId: i + 1 }));
    const result = await writer.writeBatch(batch);
    expect(result.persisted).toBe(5_000);
    expect(engine.count()).toBe(5_000);
  });

  it('handles concurrent writes without corruption', async () => {
    const engine = new InMemoryStorageEngine();
    const { writer } = makeWriter(engine);
    await Promise.all(
      Array.from({ length: 200 }, (_, i) => writer.write(trade({ tradeId: i + 1 }))),
    );
    expect(engine.count()).toBe(200);
  });
});
