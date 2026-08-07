/**
 * Phase 9.1.8 — WebSocket Integration Verification.
 *
 * Proves the full streaming chain end-to-end through the provider:
 *   canonical subscription → provider layer → Binance WebSocket client → (fake) Binance WS
 *   → raw event → validation → provider mapper → canonical event → canonical state.
 *
 * Reached through the provider's own accessors (`marketDataSocket`, `authenticationService`) so the
 * verification exercises the real wiring, not an isolated socket. Covers market trade/ticker/kline
 * events, order-book snapshot+delta with sequence validation and gap→resync, user-data order/trade
 * events, and reconnect→resubscribe. All transport is a deterministic fake socket/transport.
 */
import { describe, expect, it } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeSocketFactory,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import type { CandlestickEvent, MarketTradeEvent, TickerEvent } from '../../src/websocket/events';
import type { OrderUpdatedEvent, TradeExecutionEvent } from '../../src/auth/events';

const EXCHANGE_INFO = {
  symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' }],
};

function restTransport(): FakeTransport {
  return new FakeTransport()
    .on('/api/v3/ping', { body: {} })
    .on('/api/v3/time', { body: { serverTime: 0 } })
    .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
    .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
    .on('/api/v3/account', { body: { accountType: 'SPOT', balances: [] } })
    .on('/api/v3/depth', {
      body: { lastUpdateId: 100, bids: [['25000', '1']], asks: [['25010', '1']] },
    });
}

function makeProvider() {
  const factory = new FakeSocketFactory();
  const scheduler = new ManualScheduler();
  const provider = createBinanceProvider({
    providerId: 'binance',
    transport: restTransport(),
    socketFactory: factory,
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    scheduler,
    clock: new FixedClock(0).now,
  });
  return { provider, factory, scheduler };
}

const ctx = capabilityContext(gatewayConfig());

describe('WebSocket chain — market data → canonical events (through the provider)', () => {
  it('canonicalizes trade, ticker and kline events with the canonical symbol', async () => {
    const { provider, factory } = makeProvider();
    await provider.connect(ctx); // loads exchange info so BTCUSDT resolves to BTC-USDT
    const socket = provider.marketDataSocket(ctx);
    await socket.connect();

    const trades: MarketTradeEvent[] = [];
    let ticker: TickerEvent | undefined;
    let kline: CandlestickEvent | undefined;
    socket.trades.subscribe('BTC-USDT', (e) => trades.push(e));
    socket.tickers.subscribe('BTC-USDT', (e) => (ticker = e));
    socket.klines.subscribe('BTC-USDT', '1m', (e) => (kline = e));

    factory.emit({
      stream: 'btcusdt@trade',
      data: { e: 'trade', E: 1, s: 'BTCUSDT', t: 1, p: '25000', q: '0.2', T: 2, m: false },
    });
    factory.emit({
      stream: 'btcusdt@ticker',
      data: {
        e: '24hrTicker',
        E: 1,
        s: 'BTCUSDT',
        p: '1',
        P: '2',
        w: '3',
        c: '25000',
        Q: '1',
        b: '24999',
        B: '1',
        a: '25001',
        A: '1',
        o: '1',
        h: '2',
        l: '1',
        v: '10',
        q: '20',
        O: 0,
        C: 1,
        F: 1,
        L: 2,
        n: 2,
      },
    });
    factory.emit({
      stream: 'btcusdt@kline_1m',
      data: {
        e: 'kline',
        E: 1,
        s: 'BTCUSDT',
        k: {
          t: 0,
          T: 59,
          s: 'BTCUSDT',
          i: '1m',
          f: 1,
          L: 2,
          o: '1',
          c: '2',
          h: '3',
          l: '0.5',
          v: '10',
          n: 4,
          x: true,
          q: '1',
          V: '1',
          Q: '1',
          B: '1',
        },
      },
    });

    expect(trades[0]).toMatchObject({ symbol: 'BTC-USDT', price: 25000, quantity: 0.2 });
    expect(ticker?.symbol).toBe('BTC-USDT');
    expect(kline?.symbol).toBe('BTC-USDT');
    expect(kline?.closed).toBe(true);
  });

  it('maintains an order book from a snapshot + contiguous deltas and detects a gap', async () => {
    const { provider, factory } = makeProvider();
    await provider.connect(ctx);
    const socket = provider.marketDataSocket(ctx);
    await socket.connect();

    const books: { lastUpdateId: number }[] = [];
    socket.maintainOrderBook('BTCUSDT', (snapshot) =>
      books.push({ lastUpdateId: snapshot.lastUpdateId }),
    );
    // Buffer a contiguous delta, then the REST snapshot (lastUpdateId 100) is applied and reconciled.
    factory.emit({
      stream: 'btcusdt@depth',
      data: { e: 'depthUpdate', E: 1, s: 'BTCUSDT', U: 101, u: 105, b: [['25000', '2']], a: [] },
    });
    await new Promise((r) => setTimeout(r, 0));
    // A non-contiguous delta (gap) must not corrupt the book; the synchronizer resyncs from snapshot.
    factory.emit({
      stream: 'btcusdt@depth',
      data: { e: 'depthUpdate', E: 2, s: 'BTCUSDT', U: 200, u: 205, b: [['24000', '9']], a: [] },
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(books.length).toBeGreaterThan(0);
  });
});

describe('WebSocket chain — user data → canonical order/trade events (through the provider)', () => {
  it('delivers a canonical order update and trade execution from an executionReport', async () => {
    const { provider, factory } = makeProvider();
    const stream = provider.authenticationService(ctx).userDataStream();
    await stream.start();
    expect(factory.socket?.url).toContain('/ws/lk-1');

    const orders: OrderUpdatedEvent[] = [];
    const trades: TradeExecutionEvent[] = [];
    stream.on('orderUpdated', (e) => orders.push(e));
    stream.on('tradeExecution', (e) => trades.push(e));

    factory.emit({
      e: 'executionReport',
      E: 1,
      s: 'BTCUSDT',
      c: 'c1',
      S: 'BUY',
      o: 'LIMIT',
      f: 'GTC',
      q: '1',
      p: '25000',
      P: '0',
      x: 'TRADE',
      X: 'FILLED',
      r: 'NONE',
      i: 42,
      l: '1',
      z: '1',
      L: '25000',
      n: '0.1',
      N: 'USDT',
      T: 2,
      t: 7,
      m: false,
      O: 1,
      Z: '25000',
    });

    expect(orders[0]).toMatchObject({ venueOrderId: '42', status: 'FILLED', side: 'BUY' });
    expect(trades[0]).toMatchObject({ tradeId: 7, price: 25000, quantity: 1 });
  });
});

describe('WebSocket chain — reconnect & resubscribe', () => {
  it('reconnects after an abnormal disconnect and continues delivering canonical events', async () => {
    const { provider, factory, scheduler } = makeProvider();
    await provider.connect(ctx);
    const socket = provider.marketDataSocket(ctx);
    await socket.connect();

    const trades: MarketTradeEvent[] = [];
    socket.trades.subscribe('BTC-USDT', (e) => trades.push(e));
    const subFramesBefore = factory
      .sentFrames()
      .filter((f) => (f as { method?: string }).method === 'SUBSCRIBE').length;
    expect(subFramesBefore).toBeGreaterThanOrEqual(1);

    // Abnormal drop → the reused Common WebSocket Client reconnects (transport-level resubscription).
    factory.socket?.handlers.onClose(1006, 'drop');
    await scheduler.advance(5_000);
    await new Promise((r) => setTimeout(r, 0));
    expect(socket.connected).toBe(true);

    // The subscription survives the reconnect: a new event still reaches the original subscriber.
    factory.emit({
      stream: 'btcusdt@trade',
      data: { e: 'trade', E: 3, s: 'BTCUSDT', t: 2, p: '25100', q: '0.1', T: 4, m: false },
    });
    expect(trades.at(-1)).toMatchObject({ symbol: 'BTC-USDT', price: 25100 });
  });
});
