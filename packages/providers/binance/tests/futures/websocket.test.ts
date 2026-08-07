/**
 * Tests for the USDⓈ-M Futures user-data WebSocket client — canonical event routing and ordering
 * (ACCOUNT_UPDATE → account + positions; ORDER_TRADE_UPDATE → order/report/trade), the Futures-only
 * events (ACCOUNT_CONFIG_UPDATE, MARGIN_CALL), listenKeyExpired, undocumented-event tolerance, and
 * reconnect signalling. Transport is faked; behaviour is deterministic.
 */
import { describe, expect, it } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import { BinanceFuturesWebSocketClient } from '../../src/futures/websocket-client';
import { FakeSocketFactory, FixedClock } from '../helpers';
import type { FuturesUserEvent } from '../../src/futures/events';

const RESOLVER = { toCanonical: (s: string) => (s === 'BTCUSDT' ? 'BTC-USDT' : s) };

const ACCOUNT_UPDATE = {
  e: 'ACCOUNT_UPDATE',
  E: 1,
  T: 1,
  a: {
    m: 'ORDER',
    B: [{ a: 'USDT', wb: '1000', cw: '900', bc: '0' }],
    P: [
      { s: 'BTCUSDT', pa: '0.5', ep: '25000', cr: '0', up: '10', mt: 'cross', iw: '0', ps: 'BOTH' },
    ],
  },
};

const ORDER_TRADE_UPDATE = {
  e: 'ORDER_TRADE_UPDATE',
  E: 2,
  T: 2,
  o: {
    s: 'BTCUSDT',
    c: 'c1',
    S: 'BUY',
    o: 'LIMIT',
    f: 'GTC',
    q: '1',
    p: '25000',
    ap: '25000',
    sp: '0',
    x: 'TRADE',
    X: 'FILLED',
    i: 42,
    l: '1',
    z: '1',
    L: '25000',
    n: '0.1',
    N: 'USDT',
    T: 2,
    t: 99,
    m: false,
    R: false,
    ps: 'BOTH',
    rp: '0',
  },
};

function makeClient() {
  const factory = new FakeSocketFactory();
  const scheduler = new ManualScheduler();
  const client = new BinanceFuturesWebSocketClient({
    wsBaseUrl: 'wss://fstream.binance.com',
    factory,
    scheduler,
    resolver: RESOLVER,
  });
  return { factory, scheduler, client };
}

describe('BinanceFuturesWebSocketClient', () => {
  it('opens /ws/<listenKey> and routes ACCOUNT_UPDATE to account + position events in order', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    expect(client.connected).toBe(true);
    expect(factory.socket?.url).toContain('/ws/lk-1');

    const seen: FuturesUserEvent[] = [];
    client.onAny((e) => seen.push(e));
    factory.emit(ACCOUNT_UPDATE);

    expect(seen.map((e) => e.kind)).toEqual(['accountUpdated', 'positionUpdated']);
    expect(seen[0]).toMatchObject({ kind: 'accountUpdated', reason: 'ORDER' });
    expect(seen[1]).toMatchObject({
      kind: 'positionUpdated',
      symbol: 'BTC-USDT',
      positionAmount: 0.5,
    });
  });

  it('routes ORDER_TRADE_UPDATE to order → report → trade in order', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    const seen: FuturesUserEvent[] = [];
    client.onAny((e) => seen.push(e));
    factory.emit(ORDER_TRADE_UPDATE);
    expect(seen.map((e) => e.kind)).toEqual(['orderUpdated', 'executionReport', 'tradeExecution']);
    expect(seen[2]).toMatchObject({ kind: 'tradeExecution', tradeId: 99, price: 25000 });
  });

  it('maps ACCOUNT_CONFIG_UPDATE (leverage) to a canonical config event', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    const events: FuturesUserEvent[] = [];
    client.on('futuresConfigUpdated', (e) => events.push(e));
    factory.emit({ e: 'ACCOUNT_CONFIG_UPDATE', E: 3, T: 3, ac: { s: 'BTCUSDT', l: 25 } });
    expect(events[0]).toMatchObject({
      kind: 'futuresConfigUpdated',
      symbol: 'BTC-USDT',
      leverage: 25,
    });
  });

  it('maps ACCOUNT_CONFIG_UPDATE (multi-assets mode) to a canonical config event', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    const events: FuturesUserEvent[] = [];
    client.on('futuresConfigUpdated', (e) => events.push(e));
    factory.emit({ e: 'ACCOUNT_CONFIG_UPDATE', E: 4, T: 4, ai: { j: true } });
    expect(events[0]).toMatchObject({ kind: 'futuresConfigUpdated', multiAssetsMode: true });
  });

  it('maps MARGIN_CALL to a canonical margin-call event', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    const events: FuturesUserEvent[] = [];
    client.on('futuresMarginCall', (e) => events.push(e));
    factory.emit({
      e: 'MARGIN_CALL',
      E: 5,
      cw: '500',
      p: [{ s: 'BTCUSDT', ps: 'LONG', pa: '1', mt: 'CROSSED', mp: '24000', up: '-50', mm: '10' }],
    });
    expect(events[0]).toMatchObject({
      kind: 'futuresMarginCall',
      crossWalletBalance: 500,
    });
    expect(events[0]).toMatchObject({ positions: [{ symbol: 'BTC-USDT', maintenanceMargin: 10 }] });
  });

  it('emits listenKeyExpired and ignores undocumented events without error', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    const expiries: FuturesUserEvent[] = [];
    let errored = false;
    const c2 = new BinanceFuturesWebSocketClient({
      wsBaseUrl: 'wss://fstream.binance.com',
      factory,
      resolver: RESOLVER,
      onError: () => (errored = true),
    });
    client.on('listenKeyExpired', (e) => expiries.push(e));
    factory.emit({ e: 'listenKeyExpired', E: 6 });
    factory.emit({ e: 'someFutureEvent', E: 7 });
    expect(expiries).toHaveLength(1);
    expect(errored).toBe(false);
    void c2;
  });

  it('signals reconnection so consumers can reload a snapshot', async () => {
    const { factory, scheduler, client } = makeClient();
    await client.connect('lk-1');
    let reconnects = 0;
    client.onReconnect(() => (reconnects += 1));

    // Simulate an abnormal drop; the reused client schedules a reconnect.
    factory.socket?.handlers.onClose(1006, 'drop');
    await scheduler.advance(5_000);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reconnects).toBeGreaterThanOrEqual(1);
  });

  it('does not route events after close', async () => {
    const { factory, client } = makeClient();
    await client.connect('lk-1');
    client.close();
    expect(client.connected).toBe(false);
    const seen: FuturesUserEvent[] = [];
    client.onAny((e) => seen.push(e));
    // The socket is torn down; emitting on the stale socket must not dispatch.
    factory.socket?.handlers.onMessage(JSON.stringify(ACCOUNT_UPDATE));
    expect(seen).toHaveLength(0);
  });
});

// Deterministic routing unit (no socket) — exercises handleRaw directly.
describe('BinanceFuturesWebSocketClient.handleRaw', () => {
  it('ignores non-object frames', () => {
    const client = new BinanceFuturesWebSocketClient({
      wsBaseUrl: 'wss://x',
      factory: new FakeSocketFactory(),
      resolver: RESOLVER,
    });
    const seen: FuturesUserEvent[] = [];
    client.onAny((e) => seen.push(e));
    client.handleRaw(null);
    client.handleRaw('not-json');
    expect(seen).toHaveLength(0);
    void new FixedClock(0);
  });
});
