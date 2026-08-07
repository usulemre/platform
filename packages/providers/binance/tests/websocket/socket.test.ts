import { describe, expect, it, vi } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { ManualScheduler } from '@platform/http-client';
import { BinanceMarketDataSocket } from '../../src/websocket/socket';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeSocketFactory,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import type {
  AggregateTradeEvent,
  CandlestickEvent,
  MarkPriceEvent,
  OrderBookSnapshot,
  TickerEvent,
} from '../../src/websocket/events';

function spotSocket(
  overrides: Partial<ConstructorParameters<typeof BinanceMarketDataSocket>[0]> = {},
) {
  const factory = new FakeSocketFactory();
  const scheduler = new ManualScheduler();
  const socket = new BinanceMarketDataSocket({
    market: 'SPOT',
    wsBaseUrl: 'wss://stream.binance.com:9443',
    factory,
    scheduler,
    clock: () => scheduler.now(),
    ...overrides,
  });
  return { socket, factory, scheduler };
}

/** Emit a combined-stream envelope on the fake socket. */
function emit(factory: FakeSocketFactory, stream: string, data: unknown): void {
  factory.emit({ stream, data });
}

describe('BinanceMarketDataSocket (integration over fake socket)', () => {
  it('subscribes with a Binance SUBSCRIBE frame and delivers canonical aggregate trades', async () => {
    const { socket, factory } = spotSocket();
    await socket.connect();
    const received: AggregateTradeEvent[] = [];
    socket.aggregateTrades.subscribe('BTC-USDT', (e) => received.push(e));

    expect(factory.sentFrames()).toContainEqual(
      expect.objectContaining({ method: 'SUBSCRIBE', params: ['btcusdt@aggTrade'] }),
    );
    emit(factory, 'btcusdt@aggTrade', {
      e: 'aggTrade',
      E: 1,
      s: 'BTCUSDT',
      a: 5,
      p: '25000',
      q: '0.5',
      f: 1,
      l: 3,
      T: 2,
      m: false,
    });
    expect(received[0]).toMatchObject({ aggregateTradeId: 5, price: 25000, quantity: 0.5 });
  });

  it('delivers canonical tickers and klines and records metrics', async () => {
    const { socket, factory } = spotSocket();
    await socket.connect();
    let ticker: TickerEvent | undefined;
    let kline: CandlestickEvent | undefined;
    socket.tickers.subscribe('BTCUSDT', (e) => (ticker = e));
    socket.klines.subscribe('BTCUSDT', '1m', (e) => (kline = e));

    emit(factory, 'btcusdt@ticker', {
      e: '24hrTicker',
      E: 1,
      s: 'BTCUSDT',
      p: '1',
      P: '2',
      w: '3',
      c: '25000',
      Q: '1',
      b: '1',
      B: '1',
      a: '1',
      A: '1',
      o: '1',
      h: '1',
      l: '1',
      v: '1',
      q: '1',
      n: 10,
    });
    emit(factory, 'btcusdt@kline_1m', {
      e: 'kline',
      E: 1,
      s: 'BTCUSDT',
      k: {
        t: 1,
        T: 2,
        s: 'BTCUSDT',
        i: '1m',
        f: 1,
        L: 2,
        o: '1',
        c: '2',
        h: '3',
        l: '0',
        v: '9',
        n: 4,
        x: true,
        q: '1',
        V: '1',
        Q: '1',
        B: '1',
      },
    });
    expect(ticker).toMatchObject({ lastPrice: 25000, tickerKind: 'FULL' });
    expect(kline).toMatchObject({ interval: '1m', close: 2, closed: true });

    const metrics = socket.metricsSnapshot();
    expect(metrics.totalMessages).toBe(2);
    expect(metrics.activeStreams).toBe(2);
    expect(socket.health().level).toBe('HEALTHY');
  });

  it('fans out one transport subscription to multiple consumers and unsubscribes on last', async () => {
    const { socket, factory } = spotSocket();
    await socket.connect();
    const a: unknown[] = [];
    const b: unknown[] = [];
    const off1 = socket.bookTickers.subscribe('BTCUSDT', (e) => a.push(e));
    const off2 = socket.bookTickers.subscribe('BTCUSDT', (e) => b.push(e));
    const subscribeFrames = factory
      .sentFrames()
      .filter((f) => (f as { method?: string }).method === 'SUBSCRIBE');
    expect(subscribeFrames).toHaveLength(1);

    emit(factory, 'btcusdt@bookTicker', { u: 1, s: 'BTCUSDT', b: '1', B: '2', a: '3', A: '4' });
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);

    off1();
    expect(socket.activeStreams()).toContain('btcusdt@bookTicker');
    off2();
    expect(factory.sentFrames()).toContainEqual(
      expect.objectContaining({ method: 'UNSUBSCRIBE', params: ['btcusdt@bookTicker'] }),
    );
  });

  it('maintains a synchronized order book from diff-depth + REST snapshot', async () => {
    const depth = vi
      .fn()
      .mockResolvedValue({ lastUpdateId: 100, bids: [['100', '1']], asks: [['101', '1']] });
    const { socket, factory } = spotSocket({ depthSource: { depth } });
    await socket.connect();
    const books: OrderBookSnapshot[] = [];
    socket.maintainOrderBook('BTCUSDT', (s) => books.push(s));

    // The diff stream is subscribed before the snapshot is applied.
    expect(factory.sentFrames()).toContainEqual(
      expect.objectContaining({ method: 'SUBSCRIBE', params: ['btcusdt@depth'] }),
    );
    // A live delta arrives while the snapshot is in flight (buffered).
    emit(factory, 'btcusdt@depth', {
      e: 'depthUpdate',
      E: 1,
      s: 'BTCUSDT',
      U: 101,
      u: 105,
      b: [['100', '2']],
      a: [],
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(depth).toHaveBeenCalledWith('BTCUSDT', 1000);
    const book = socket.orderBookSnapshot('BTCUSDT');
    expect(book?.lastUpdateId).toBe(105);
    expect(book?.bids[0]).toEqual({ price: 100, quantity: 2 });
  });
});

describe('BinanceMarketDataSocket (Futures mark price)', () => {
  it('delivers canonical mark-price events', async () => {
    const factory = new FakeSocketFactory();
    const scheduler = new ManualScheduler();
    const socket = new BinanceMarketDataSocket({
      market: 'FUTURES',
      wsBaseUrl: 'wss://fstream.binance.com',
      factory,
      scheduler,
      clock: () => scheduler.now(),
    });
    await socket.connect();
    let mark: MarkPriceEvent | undefined;
    socket.markPrices.subscribe('BTCUSDT', (e) => (mark = e), true);
    expect(factory.sentFrames()).toContainEqual(
      expect.objectContaining({ params: ['btcusdt@markPrice@1s'] }),
    );
    emit(factory, 'btcusdt@markPrice@1s', {
      e: 'markPriceUpdate',
      E: 1,
      s: 'BTCUSDT',
      p: '25000',
      i: '24999',
      P: '25001',
      r: '0.0001',
      T: 123,
    });
    expect(mark).toMatchObject({ markPrice: 25000, fundingRate: 0.0001, nextFundingTime: 123 });
  });
});

describe('BinanceMarketDataSocket (contract: provider integration)', () => {
  it('is reachable from the provider and shares the runtime', async () => {
    const transport = new FakeTransport().on('/api/v3/depth', {
      body: { lastUpdateId: 1, bids: [], asks: [] },
    });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      socketFactory: new FakeSocketFactory(),
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      scheduler: new ManualScheduler(),
      clock: new FixedClock(0).now,
    });
    const ctx = capabilityContext(gatewayConfig());
    const socket = provider.marketDataSocket(ctx);
    expect(socket).toBeInstanceOf(BinanceMarketDataSocket);
    expect(socket.market).toBe('SPOT');
    expect(provider.marketDataSocket(ctx)).toBe(socket);
  });
});
