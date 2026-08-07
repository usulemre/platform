import { describe, expect, it } from 'vitest';
import {
  InMemoryStorageEngine,
  StoragePartitionManager,
  computePartition,
  parsePartitionKey,
  partitionKeyString,
  primaryTimestamp,
  recordIdentity,
  utcDate,
  type StoredEntry,
} from '../src/index';
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import { DAY, INSTRUMENT, T0, candlestick, trade } from './helpers';

function entry(record: NormalizedMarketDataRecord = trade(), upsert = false): StoredEntry {
  return {
    identity: recordIdentity(record),
    partition: partitionKeyString(computePartition(record)),
    primaryTime: primaryTimestamp(record.timestamps),
    upsert,
    record,
    storedAt: T0,
  };
}

describe('partitioning', () => {
  it('computes an instrument|type|date partition key', () => {
    const key = computePartition(trade());
    expect(key.instrumentId).toBe(INSTRUMENT);
    expect(key.marketDataType).toBe('TRADES');
    expect(key.date).toBe(utcDate(T0));
    expect(parsePartitionKey(partitionKeyString(key))).toEqual(key);
  });

  it('prunes partitions by instrument, type and date range', () => {
    const mgr = new StoragePartitionManager();
    const all = [
      'BINANCE:BTC-USDT|TRADES|2023-11-14',
      'BINANCE:BTC-USDT|TRADES|2023-11-15',
      'BINANCE:ETH-USDT|TRADES|2023-11-14',
      'BINANCE:BTC-USDT|ORDER_BOOKS|2023-11-14',
    ];
    const selected = mgr.select(all, {
      instrumentIds: ['BINANCE:BTC-USDT'],
      marketDataType: 'TRADES',
      fromDate: '2023-11-14',
      toDate: '2023-11-14',
    });
    expect(selected).toEqual(['BINANCE:BTC-USDT|TRADES|2023-11-14']);
  });
});

describe('InMemoryStorageEngine', () => {
  it('persists new entries and skips exact duplicates', async () => {
    const engine = new InMemoryStorageEngine();
    const first = await engine.write([entry(trade({ tradeId: 1 }))]);
    expect(first).toEqual({ persisted: 1, duplicates: 0, upserts: 0 });
    const again = await engine.write([entry(trade({ tradeId: 1 }))]);
    expect(again).toEqual({ persisted: 0, duplicates: 1, upserts: 0 });
    expect(engine.count()).toBe(1);
  });

  it('upserts when the entry policy allows it', async () => {
    const engine = new InMemoryStorageEngine();
    await engine.write([entry(candlestick({ close: 1_000 }), true)]);
    const report = await engine.write([entry(candlestick({ close: 2_000 }), true)]);
    expect(report.upserts).toBe(1);
    const rows = await engine.read([]);
    expect((rows[0]?.record as { close: number }).close).toBe(2_000);
  });

  it('reads time-sorted across partitions and drops a partition', async () => {
    const engine = new InMemoryStorageEngine();
    await engine.write([
      entry(
        trade({
          tradeId: 2,
          timestamps: { eventTime: T0 + DAY, receiveTime: T0, processingTime: T0 },
        }),
      ),
      entry(trade({ tradeId: 1 })),
    ]);
    const rows = await engine.read([]);
    expect(rows.map((r) => r.primaryTime)).toEqual([T0, T0 + DAY]);
    expect(engine.listPartitions().length).toBe(2);
    const removed = await engine.dropPartition(engine.listPartitions()[0]!);
    expect(removed).toBe(1);
  });
});
