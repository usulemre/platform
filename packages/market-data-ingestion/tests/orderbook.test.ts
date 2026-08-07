import { describe, expect, it } from 'vitest';
import { LocalOrderBook, OrderBookSynchronizer } from '../src/index';
import { orderBookDelta, orderBookSnapshot } from './helpers';

const KEY = 'binance:orderBook:BTCUSDT';

describe('LocalOrderBook', () => {
  it('applies a snapshot and reports best bid/ask', () => {
    const book = new LocalOrderBook();
    book.reset([{ price: 100, quantity: 1 }], [{ price: 101, quantity: 1 }], 5);
    expect(book.bestBid()).toBe(100);
    expect(book.bestAsk()).toBe(101);
    expect(book.updateId).toBe(5);
    expect(book.isCrossed()).toBe(false);
  });

  it('removes a level when a delta sets quantity to zero', () => {
    const book = new LocalOrderBook();
    book.reset([{ price: 100, quantity: 1 }], [{ price: 101, quantity: 1 }], 5);
    book.applyDelta([{ price: 100, quantity: 0 }], [], 6);
    expect(book.bestBid()).toBeUndefined();
    expect(book.updateId).toBe(6);
  });

  it('returns a sorted top-N snapshot', () => {
    const book = new LocalOrderBook();
    book.reset(
      [
        { price: 98, quantity: 1 },
        { price: 100, quantity: 1 },
        { price: 99, quantity: 1 },
      ],
      [
        { price: 103, quantity: 1 },
        { price: 101, quantity: 1 },
      ],
      1,
    );
    const snap = book.snapshot(2);
    expect(snap.bids.map((l) => l.price)).toEqual([100, 99]);
    expect(snap.asks.map((l) => l.price)).toEqual([101, 103]);
  });
});

describe('OrderBookSynchronizer', () => {
  it('buffers deltas until a snapshot arrives, then synchronizes', () => {
    const sync = new OrderBookSynchronizer();
    const early = sync.onDelta(KEY, orderBookDelta({ firstUpdateId: 101, finalUpdateId: 101 }));
    expect(early.buffered).toBe(true);
    expect(sync.stateOf(KEY)).toBe('SYNCING');

    const result = sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    expect(result.state).toBe('SYNCHRONIZED');
    // The buffered delta (finalUpdateId 101 = 100 + 1) replayed.
    expect(sync.bookOf(KEY)?.updateId).toBe(101);
  });

  it('applies a contiguous delta', () => {
    const sync = new OrderBookSynchronizer();
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    const result = sync.onDelta(KEY, orderBookDelta({ firstUpdateId: 101, finalUpdateId: 105 }));
    expect(result.applied).toBe(true);
    expect(sync.bookOf(KEY)?.updateId).toBe(105);
  });

  it('drops a stale delta already covered by the book', () => {
    const sync = new OrderBookSynchronizer();
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    const result = sync.onDelta(KEY, orderBookDelta({ firstUpdateId: 90, finalUpdateId: 95 }));
    expect(result.applied).toBe(false);
    expect(result.needsSnapshot).toBe(false);
  });

  it('degrades and requests a snapshot on a gap', () => {
    const sync = new OrderBookSynchronizer();
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    const result = sync.onDelta(KEY, orderBookDelta({ firstUpdateId: 110, finalUpdateId: 115 }));
    expect(result.applied).toBe(false);
    expect(result.needsSnapshot).toBe(true);
    expect(sync.stateOf(KEY)).toBe('DEGRADED');
  });

  it('recovers to SYNCHRONIZED after a fresh snapshot', () => {
    const sync = new OrderBookSynchronizer();
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    sync.onDelta(KEY, orderBookDelta({ firstUpdateId: 110, finalUpdateId: 115 }));
    expect(sync.stateOf(KEY)).toBe('DEGRADED');
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 116 }));
    expect(sync.stateOf(KEY)).toBe('SYNCHRONIZED');
  });

  it('validates Futures-style contiguity via previousFinalUpdateId', () => {
    const sync = new OrderBookSynchronizer();
    sync.onSnapshot(KEY, orderBookSnapshot({ lastUpdateId: 100 }));
    const ok = sync.onDelta(
      KEY,
      orderBookDelta({ firstUpdateId: 101, finalUpdateId: 105, previousFinalUpdateId: 100 }),
    );
    expect(ok.applied).toBe(true);
    const gap = sync.onDelta(
      KEY,
      orderBookDelta({ firstUpdateId: 106, finalUpdateId: 110, previousFinalUpdateId: 999 }),
    );
    expect(gap.needsSnapshot).toBe(true);
  });
});
