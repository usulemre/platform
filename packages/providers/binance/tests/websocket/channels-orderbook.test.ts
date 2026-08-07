import { describe, expect, it, vi } from 'vitest';
import { ChannelRegistry } from '../../src/websocket/channels';
import { BinanceChannelUnavailableError } from '../../src/websocket/errors';
import { GapDetector, SequenceValidator } from '../../src/websocket/sequence';
import { LocalOrderBook } from '../../src/websocket/order-book';
import { OrderBookSynchronizer } from '../../src/websocket/order-book-synchronizer';
import type { OrderBookDelta } from '../../src/websocket/events';

function delta(partial: Partial<OrderBookDelta>): OrderBookDelta {
  return {
    kind: 'orderBookDelta',
    symbol: 'BTC-USDT',
    venueSymbol: 'BTCUSDT',
    firstUpdateId: 0,
    finalUpdateId: 0,
    bids: [],
    asks: [],
    eventTime: 0,
    ...partial,
  };
}

describe('ChannelRegistry (documented stream names + market scoping)', () => {
  const spot = new ChannelRegistry('SPOT');
  const futures = new ChannelRegistry('FUTURES');

  it('builds documented stream names', () => {
    expect(spot.aggTrade('BTC-USDT')).toBe('btcusdt@aggTrade');
    expect(spot.kline('BTCUSDT', '1m')).toBe('btcusdt@kline_1m');
    expect(spot.partialDepth('BTCUSDT', 10, 100)).toBe('btcusdt@depth10@100ms');
    expect(spot.diffDepth('BTCUSDT')).toBe('btcusdt@depth');
    expect(spot.rollingTicker('BTCUSDT', '1h')).toBe('btcusdt@ticker_1h');
    expect(futures.markPrice('BTCUSDT', true)).toBe('btcusdt@markPrice@1s');
  });

  it('enforces market scoping and documented enum values', () => {
    expect(() => spot.markPrice('BTCUSDT')).toThrow(BinanceChannelUnavailableError);
    expect(() => futures.avgPrice('BTCUSDT')).toThrow(BinanceChannelUnavailableError);
    expect(() => spot.kline('BTCUSDT', '7m')).toThrow(BinanceChannelUnavailableError);
    expect(() => futures.kline('BTCUSDT', '1s')).toThrow(BinanceChannelUnavailableError);
    expect(() => spot.partialDepth('BTCUSDT', 5, 250)).toThrow(BinanceChannelUnavailableError);
    expect(spot.supports('avgPrice')).toBe(true);
    expect(futures.supports('avgPrice')).toBe(false);
  });
});

describe('GapDetector + SequenceValidator', () => {
  it('applies the spot contiguity rule (U === prev.u + 1)', () => {
    const detector = new GapDetector('SPOT');
    expect(detector.detect(100, delta({ firstUpdateId: 101, finalUpdateId: 110 })).contiguous).toBe(
      true,
    );
    expect(detector.detect(100, delta({ firstUpdateId: 102 })).contiguous).toBe(false);
  });

  it('applies the futures contiguity rule (pu === prev.u)', () => {
    const detector = new GapDetector('FUTURES');
    expect(
      detector.detect(100, delta({ previousFinalUpdateId: 100, finalUpdateId: 120 })).contiguous,
    ).toBe(true);
    expect(detector.detect(100, delta({ previousFinalUpdateId: 99 })).contiguous).toBe(false);
  });

  it('tracks the last final id and advances only on contiguous deltas', () => {
    const validator = new SequenceValidator('SPOT');
    validator.set('BTCUSDT', 100);
    expect(
      validator.validateNext(delta({ firstUpdateId: 101, finalUpdateId: 110 })).contiguous,
    ).toBe(true);
    expect(validator.get('BTCUSDT')).toBe(110);
    expect(
      validator.validateNext(delta({ firstUpdateId: 200, finalUpdateId: 210 })).contiguous,
    ).toBe(false);
    expect(validator.get('BTCUSDT')).toBe(110);
  });
});

describe('LocalOrderBook', () => {
  it('applies deltas, removes zero-quantity levels and sorts', () => {
    const book = new LocalOrderBook('BTC-USDT', 'BTCUSDT');
    book.load({
      lastUpdateId: 10,
      bids: [
        { price: 100, quantity: 1 },
        { price: 99, quantity: 2 },
      ],
      asks: [{ price: 101, quantity: 3 }],
    });
    book.applyDelta(
      delta({
        finalUpdateId: 11,
        bids: [
          { price: 100, quantity: 0 },
          { price: 98, quantity: 5 },
        ],
        asks: [{ price: 101, quantity: 4 }],
      }),
    );
    const snapshot = book.snapshot();
    expect(snapshot.lastUpdateId).toBe(11);
    expect(snapshot.bids).toEqual([
      { price: 99, quantity: 2 },
      { price: 98, quantity: 5 },
    ]);
    expect(snapshot.asks).toEqual([{ price: 101, quantity: 4 }]);
    expect(book.bestBid()).toBe(99);
    expect(book.bestAsk()).toBe(101);
  });
});

describe('OrderBookSynchronizer (official manage-local-order-book procedure)', () => {
  it('buffers, snapshots, drops stale, applies buffered then live deltas', async () => {
    const snapshots: number[] = [];
    const source = {
      depth: vi.fn().mockResolvedValue({
        lastUpdateId: 100,
        bids: [['100', '1']],
        asks: [['101', '1']],
      }),
    };
    const sync = new OrderBookSynchronizer({
      market: 'SPOT',
      source,
      callbacks: { onSnapshot: (s) => snapshots.push(s.lastUpdateId) },
    });
    sync.begin('BTCUSDT');
    // Buffered: one stale (u<=100) + the valid first (U<=101<=u) + a contiguous follow-up.
    sync.handleDelta(delta({ firstUpdateId: 90, finalUpdateId: 95 }));
    sync.handleDelta(
      delta({ firstUpdateId: 99, finalUpdateId: 105, bids: [{ price: 100, quantity: 2 }] }),
    );
    sync.handleDelta(delta({ firstUpdateId: 106, finalUpdateId: 110 }));

    await sync.synchronize('BTCUSDT');
    expect(sync.isSynced('BTCUSDT')).toBe(true);
    expect(sync.book('BTCUSDT')!.lastUpdateId).toBe(110);

    // Live contiguous delta advances the book.
    sync.handleDelta(delta({ firstUpdateId: 111, finalUpdateId: 115 }));
    expect(sync.book('BTCUSDT')!.lastUpdateId).toBe(115);
    expect(snapshots.at(-1)).toBe(115);
  });

  it('detects a gap on a non-contiguous live delta and re-synchronizes', async () => {
    const gaps: number[] = [];
    const source = {
      depth: vi
        .fn()
        .mockResolvedValueOnce({ lastUpdateId: 100, bids: [], asks: [] })
        .mockResolvedValueOnce({ lastUpdateId: 500, bids: [], asks: [] }),
    };
    const sync = new OrderBookSynchronizer({
      market: 'SPOT',
      source,
      callbacks: { onGap: (e) => gaps.push(e.received) },
    });
    sync.begin('BTCUSDT');
    await sync.synchronize('BTCUSDT'); // empty buffer → synced, awaiting first live
    // First live delta is the valid first (U<=101<=u).
    sync.handleDelta(delta({ firstUpdateId: 101, finalUpdateId: 105 }));
    expect(sync.book('BTCUSDT')!.lastUpdateId).toBe(105);
    // Now a gap (expected U=106, got 200) → triggers resync via the second snapshot.
    sync.handleDelta(delta({ firstUpdateId: 200, finalUpdateId: 205 }));
    expect(gaps).toEqual([200]);
    await Promise.resolve();
    expect(source.depth).toHaveBeenCalledTimes(2);
  });
});
