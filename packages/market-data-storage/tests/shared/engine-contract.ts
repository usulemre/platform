/**
 * The shared `StorageEngine` **contract suite**. The same behavioural expectations are run against
 * every engine implementation — the in-memory reference and the ClickHouse production engine — so both
 * satisfy one canonical contract. Assertions target the *observable* guarantees (round-trip, read-side
 * deduplication, partition listing, whole-partition drop, order-book reconstruction) rather than
 * implementation-specific write-report counts, because the engines differ there by design (immediate
 * vs eventual deduplication).
 *
 * Each test uses a unique instrument id so a single shared store can host all cases without
 * cross-test interference (important for the ClickHouse engine, which shares one table).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MarketDataStorage, StorageEngine } from '../../src/index';
import { candlestick, orderBookDelta, orderBookSnapshot, trade } from '../helpers';

export interface ContractHarness {
  readonly storage: MarketDataStorage;
  readonly engine: StorageEngine;
  cleanup(): Promise<void>;
}

export function runStorageContract(label: string, setup: () => Promise<ContractHarness>): void {
  describe(`StorageEngine contract — ${label}`, () => {
    let harness: ContractHarness;
    beforeAll(async () => {
      harness = await setup();
    });
    afterAll(async () => {
      await harness?.cleanup();
    });

    it('persists a record and reads it back', async () => {
      const inst = 'BINANCE:C1-USDT';
      await harness.storage.writeBatch([trade({ instrumentId: inst, tradeId: 1 })]);
      const rows = await harness.storage.trades.byInstrument(inst);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tradeId).toBe(1);
      expect(rows[0]?.instrumentId).toBe(inst);
    });

    it('does not corrupt data on duplicate ingestion (deduplicated on read)', async () => {
      const inst = 'BINANCE:C2-USDT';
      const t = trade({ instrumentId: inst, tradeId: 7 });
      await harness.storage.writeBatch([t]);
      await harness.storage.writeBatch([t]); // exact duplicate
      const rows = await harness.storage.trades.byInstrument(inst);
      expect(rows).toHaveLength(1);
    });

    it('returns records in ascending time order', async () => {
      const inst = 'BINANCE:C3-USDT';
      await harness.storage.writeBatch([
        trade({
          instrumentId: inst,
          tradeId: 3,
          timestamps: { eventTime: 1_700_000_003_000, receiveTime: 0, processingTime: 0 },
        }),
        trade({
          instrumentId: inst,
          tradeId: 1,
          timestamps: { eventTime: 1_700_000_001_000, receiveTime: 0, processingTime: 0 },
        }),
        trade({
          instrumentId: inst,
          tradeId: 2,
          timestamps: { eventTime: 1_700_000_002_000, receiveTime: 0, processingTime: 0 },
        }),
      ]);
      const rows = await harness.storage.trades.byInstrument(inst);
      expect(rows.map((r) => r.tradeId)).toEqual([1, 2, 3]);
    });

    it('lists the partitions it has written', async () => {
      const inst = 'BINANCE:C4-USDT';
      await harness.storage.writeBatch([trade({ instrumentId: inst, tradeId: 1 })]);
      expect(harness.storage.partitions().some((p) => p.startsWith(inst))).toBe(true);
    });

    it('drops a whole partition through the engine', async () => {
      const inst = 'BINANCE:C5-USDT';
      await harness.storage.writeBatch([trade({ instrumentId: inst, tradeId: 1 })]);
      const partition = harness.storage.partitions().find((p) => p.startsWith(inst));
      expect(partition).toBeDefined();
      const removed = await harness.engine.dropPartition(partition!);
      expect(removed).toBeGreaterThanOrEqual(1);
      expect(await harness.storage.trades.byInstrument(inst)).toHaveLength(0);
    });

    it('upserts a candlestick bar (latest write wins)', async () => {
      const inst = 'BINANCE:C6-USDT';
      await harness.storage.writeBatch([
        candlestick({ instrumentId: inst, openTime: 1_700_000_000_000, close: 49_950 }),
      ]);
      await harness.storage.writeBatch([
        candlestick({ instrumentId: inst, openTime: 1_700_000_000_000, close: 50_050 }),
      ]);
      const bars = await harness.storage.candlesticks.byInstrument(inst);
      expect(bars).toHaveLength(1);
      expect(bars[0]?.close).toBe(50_050);
    });

    it('reconstructs an order book from a snapshot plus ordered deltas', async () => {
      const inst = 'BINANCE:C7-USDT';
      await harness.storage.writeBatch([
        orderBookSnapshot({ instrumentId: inst, lastUpdateId: 100 }),
        orderBookDelta({
          instrumentId: inst,
          firstUpdateId: 101,
          finalUpdateId: 101,
          bids: [{ price: 49_990, quantity: 9 }],
          asks: [],
        }),
      ]);
      const book = await harness.storage.reconstructOrderBook(inst);
      expect(book?.snapshotUpdateId).toBe(100);
      expect(book?.lastUpdateId).toBe(101);
      expect(book?.appliedDeltas).toBe(1);
      expect(book?.bids.find((l) => l.price === 49_990)?.quantity).toBe(9);
    });
  });
}
