import { ManualClock } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { MarketDataStorage } from '../src/index';
import {
  DAY,
  INSTRUMENT,
  T0,
  candlestick,
  orderBookDelta,
  orderBookSnapshot,
  ticker,
  trade,
} from './helpers';

function storage() {
  return new MarketDataStorage({ clock: new ManualClock(T0) });
}

describe('canonical queries', () => {
  it('queries by instrument and time range', async () => {
    const s = storage();
    await s.writeBatch([
      trade({ tradeId: 1, timestamps: { eventTime: T0, receiveTime: T0, processingTime: T0 } }),
      trade({
        tradeId: 2,
        timestamps: { eventTime: T0 + DAY, receiveTime: T0, processingTime: T0 },
      }),
      trade({
        tradeId: 3,
        timestamps: { eventTime: T0 + 2 * DAY, receiveTime: T0, processingTime: T0 },
      }),
    ]);
    const inRange = await s.queries.query({
      instrumentId: INSTRUMENT,
      kind: 'trade',
      from: T0,
      to: T0 + DAY,
    });
    expect(inRange.map((r) => (r as { tradeId: number }).tradeId)).toEqual([1, 2]);
  });

  it('returns the latest value', async () => {
    const s = storage();
    await s.writeBatch([
      ticker({ lastPrice: 1, timestamps: { eventTime: T0, receiveTime: T0, processingTime: T0 } }),
      ticker({
        lastPrice: 2,
        timestamps: { eventTime: T0 + 1000, receiveTime: T0, processingTime: T0 },
      }),
    ]);
    const latest = await s.queries.latest(INSTRUMENT, 'ticker');
    expect((latest as { lastPrice: number } | null)?.lastPrice).toBe(2);
  });

  it('serves typed repositories without touching the engine', async () => {
    const s = storage();
    await s.writeBatch([trade({ tradeId: 1 }), candlestick({ openTime: T0 })]);
    const trades = await s.trades.byInstrument(INSTRUMENT);
    const bars = await s.candlesticks.byInstrument(INSTRUMENT);
    expect(trades).toHaveLength(1);
    expect(bars).toHaveLength(1);
    expect(trades[0]?.kind).toBe('trade');
  });

  it('returns a historical sequence in ascending time order', async () => {
    const s = storage();
    await s.writeBatch([
      trade({
        tradeId: 3,
        timestamps: { eventTime: T0 + 3000, receiveTime: T0, processingTime: T0 },
      }),
      trade({
        tradeId: 1,
        timestamps: { eventTime: T0 + 1000, receiveTime: T0, processingTime: T0 },
      }),
      trade({
        tradeId: 2,
        timestamps: { eventTime: T0 + 2000, receiveTime: T0, processingTime: T0 },
      }),
    ]);
    const history = await s.trades.byTimeRange(INSTRUMENT, 0, Number.MAX_SAFE_INTEGER);
    expect(history.map((r) => r.tradeId)).toEqual([1, 2, 3]);
  });
});

describe('order-book reconstruction', () => {
  it('rebuilds the book from a snapshot plus ordered deltas', async () => {
    const s = storage();
    await s.writeBatch([
      orderBookSnapshot({ lastUpdateId: 100 }),
      orderBookDelta({
        firstUpdateId: 101,
        finalUpdateId: 101,
        bids: [{ price: 49_990, quantity: 5 }],
        asks: [],
      }),
      orderBookDelta({
        firstUpdateId: 102,
        finalUpdateId: 102,
        bids: [],
        asks: [{ price: 50_010, quantity: 0 }],
      }),
    ]);
    const book = await s.reconstructOrderBook(INSTRUMENT);
    expect(book).not.toBeNull();
    expect(book?.snapshotUpdateId).toBe(100);
    expect(book?.lastUpdateId).toBe(102);
    expect(book?.appliedDeltas).toBe(2);
    expect(book?.gapDetected).toBe(false);
    // Bid at 49_990 updated to qty 5; ask at 50_010 removed (qty 0).
    expect(book?.bids.find((l) => l.price === 49_990)?.quantity).toBe(5);
    expect(book?.asks.find((l) => l.price === 50_010)).toBeUndefined();
  });

  it('flags a gap and stops reconstruction at the discontinuity', async () => {
    const s = storage();
    await s.writeBatch([
      orderBookSnapshot({ lastUpdateId: 100 }),
      orderBookDelta({ firstUpdateId: 101, finalUpdateId: 101 }),
      // Gap: expected firstUpdateId 102, got 200.
      orderBookDelta({ firstUpdateId: 200, finalUpdateId: 205 }),
    ]);
    const book = await s.reconstructOrderBook(INSTRUMENT);
    expect(book?.appliedDeltas).toBe(1);
    expect(book?.gapDetected).toBe(true);
    expect(book?.lastUpdateId).toBe(101);
  });

  it('reconstructs at a point in time', async () => {
    const s = storage();
    await s.writeBatch([
      orderBookSnapshot({ lastUpdateId: 100 }),
      orderBookDelta({
        firstUpdateId: 101,
        finalUpdateId: 101,
        timestamps: { eventTime: T0 + 1000, receiveTime: T0, processingTime: T0 },
      }),
      orderBookDelta({
        firstUpdateId: 102,
        finalUpdateId: 102,
        timestamps: { eventTime: T0 + 5000, receiveTime: T0, processingTime: T0 },
      }),
    ]);
    const book = await s.reconstructOrderBook(INSTRUMENT, T0 + 2000);
    expect(book?.appliedDeltas).toBe(1);
    expect(book?.lastUpdateId).toBe(101);
  });

  it('returns null when no snapshot anchor exists', async () => {
    const s = storage();
    await s.writeBatch([orderBookDelta({ firstUpdateId: 101, finalUpdateId: 101 })]);
    expect(await s.reconstructOrderBook(INSTRUMENT)).toBeNull();
  });
});
