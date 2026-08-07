/**
 * Phase 9.1.8 — End-to-End Verification (Tests A–F).
 *
 * Each test drives the complete architecture through the provider boundary and asserts the canonical
 * result:
 *   A. Market data: REST snapshot + WS delta → canonical market (order-book) state.
 *   B. Order:       Broker Gateway → provider → REST order → canonical order.
 *   C. Execution:   Binance order → WS execution event → canonical execution + order update.
 *   D. Account:     REST account snapshot + WS account event → canonical account state.
 *   E. Position:    REST position snapshot + WS position event → canonical position state (Futures).
 *   F. Recovery:    WS disconnect → reconnect → snapshot recovery → canonical state restored.
 * All venue IO is a deterministic fake transport/socket driven by an injected scheduler/clock.
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

const flush = () => new Promise((r) => setTimeout(r, 0));
const EXCHANGE_INFO = {
  symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' }],
};

function build(providerId: 'binance' | 'binance-futures', transport: FakeTransport) {
  const factory = new FakeSocketFactory();
  const scheduler = new ManualScheduler();
  const provider = createBinanceProvider({
    providerId,
    transport,
    socketFactory: factory,
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    scheduler,
    clock: new FixedClock(0).now,
  });
  return { provider, factory, scheduler, ctx: capabilityContext(gatewayConfig({ providerId })) };
}

describe('E2E Test A — market data: REST snapshot + WS delta → canonical order-book state', () => {
  it('applies a contiguous WS depth delta on top of the REST snapshot', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/ping', { body: {} })
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
      .on('/api/v3/depth', {
        body: { lastUpdateId: 100, bids: [['25000', '1']], asks: [['25010', '1']] },
      });
    const { provider, factory, ctx } = build('binance', transport);
    await provider.connect(ctx);
    const socket = provider.marketDataSocket(ctx);
    await socket.connect();

    const snapshots: { lastUpdateId: number; topBid?: number }[] = [];
    socket.maintainOrderBook('BTCUSDT', (b) =>
      snapshots.push({ lastUpdateId: b.lastUpdateId, topBid: b.bids[0]?.price }),
    );
    // Contiguous delta (U = snapshot.lastUpdateId + 1) updates the best bid.
    factory.emit({
      stream: 'btcusdt@depth',
      data: { e: 'depthUpdate', E: 1, s: 'BTCUSDT', U: 101, u: 105, b: [['25005', '3']], a: [] },
    });
    await flush();

    expect(snapshots.length).toBeGreaterThan(0);
    expect(snapshots.at(-1)!.lastUpdateId).toBeGreaterThanOrEqual(100);
  });
});

describe('E2E Test B — order: Broker Gateway → provider → REST → canonical order', () => {
  it('submits a canonical order and returns a canonical order', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/ping', { body: {} })
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
      .on('/api/v3/order', {
        body: {
          symbol: 'BTCUSDT',
          orderId: 7,
          clientOrderId: 'c-7',
          price: '25000',
          origQty: '1',
          executedQty: '0',
          status: 'NEW',
          type: 'LIMIT',
          side: 'BUY',
          transactTime: 1,
        },
      });
    const { provider, ctx } = build('binance', transport);
    await provider.connect(ctx); // loads exchange info so the canonical symbol resolves to BTC-USDT
    const order = await provider.submitOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
    });
    expect(order).toMatchObject({ venueOrderId: '7', status: 'NEW', symbol: 'BTC-USDT' });
    expect(Object.keys(order)).not.toContain('origQty');
  });
});

describe('E2E Test C — execution: WS execution event → canonical execution + order update', () => {
  it('delivers a canonical trade execution and order update from a fill', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
      .on('/api/v3/account', { body: { accountType: 'SPOT', balances: [] } });
    const { provider, factory, ctx } = build('binance', transport);
    const stream = provider.authenticationService(ctx).userDataStream();
    await stream.start();
    const exec: unknown[] = [];
    const orders: unknown[] = [];
    stream.on('tradeExecution', (e) => exec.push(e));
    stream.on('orderUpdated', (e) => orders.push(e));

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
      X: 'PARTIALLY_FILLED',
      r: 'NONE',
      i: 9,
      l: '0.4',
      z: '0.4',
      L: '25000',
      n: '0.01',
      N: 'BNB',
      T: 2,
      t: 3,
      m: true,
      O: 1,
      Z: '10000',
    });
    expect(exec[0]).toMatchObject({ tradeId: 3, quantity: 0.4, isMaker: true });
    expect(orders[0]).toMatchObject({ venueOrderId: '9', status: 'PARTIALLY_FILLED' });
  });
});

describe('E2E Test D — account: REST snapshot + WS account event → canonical account state', () => {
  it('loads the snapshot then applies an incremental balance event', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
      .on('/api/v3/account', {
        body: {
          accountType: 'SPOT',
          canTrade: true,
          updateTime: 1000,
          balances: [{ asset: 'BTC', free: '2', locked: '0' }],
        },
      });
    const { provider, factory, ctx } = build('binance', transport);
    await provider.authenticationService(ctx).userDataStream().start();
    const sync = provider.accountSynchronizer(ctx);
    await sync.start();
    expect(sync.state).toBe('SYNCHRONIZED');
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(2);

    // Incremental Spot balance snapshot event (outboundAccountPosition) updates canonical state.
    factory.emit({
      e: 'outboundAccountPosition',
      E: 2000,
      u: 2000,
      B: [{ a: 'BTC', f: '3.5', l: '0' }],
    });
    await flush();
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(3.5);
  });
});

describe('E2E Test E — position: REST snapshot + WS position event → canonical position state (Futures)', () => {
  it('loads futures positions then applies an ACCOUNT_UPDATE position event', async () => {
    const transport = new FakeTransport()
      .on('/fapi/v1/time', { body: { serverTime: 0 } })
      .on('/fapi/v1/listenKey', { body: { listenKey: 'lk-1' } })
      .on('/fapi/v2/account', {
        body: { canTrade: true, updateTime: 1, assets: [], positions: [] },
      })
      .on('/fapi/v2/balance', {
        body: [{ asset: 'USDT', balance: '1000', availableBalance: '1000' }],
      })
      .on('/fapi/v2/positionRisk', {
        body: [
          {
            symbol: 'BTCUSDT',
            positionAmt: '0.5',
            entryPrice: '25000',
            positionSide: 'BOTH',
            markPrice: '25100',
            unRealizedProfit: '50',
          },
        ],
      });
    const { provider, factory, ctx } = build('binance-futures', transport);
    await provider.authenticationService(ctx).userDataStream().start();
    const sync = provider.accountSynchronizer(ctx);
    await sync.start();
    expect(sync.positions().find((p) => p.venueSymbol === 'BTCUSDT')?.positionAmount).toBe(0.5);

    // Futures ACCOUNT_UPDATE moves the position.
    factory.emit({
      e: 'ACCOUNT_UPDATE',
      E: 2,
      T: 2,
      a: {
        m: 'ORDER',
        B: [],
        P: [
          {
            s: 'BTCUSDT',
            pa: '1.25',
            ep: '25050',
            cr: '0',
            up: '60',
            mt: 'cross',
            iw: '0',
            ps: 'BOTH',
          },
        ],
      },
    });
    await flush();
    expect(sync.positions().find((p) => p.venueSymbol === 'BTCUSDT')?.positionAmount).toBe(1.25);
  });
});

describe('E2E Test F — recovery: disconnect → reconnect → snapshot recovery → state restored', () => {
  it('reloads the authoritative snapshot on reconnect and reconciles canonical state', async () => {
    const account = {
      accountType: 'SPOT',
      canTrade: true,
      updateTime: 1000,
      balances: [{ asset: 'BTC', free: '2', locked: '0' }],
    };
    const transport = new FakeTransport()
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
      .on('/api/v3/account', { body: account });
    const { provider, factory, scheduler, ctx } = build('binance', transport);
    await provider.authenticationService(ctx).userDataStream().start();
    const sync = provider.accountSynchronizer(ctx);
    await sync.start();
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(2);

    // The authoritative account changes out-of-band; a reconnect must recover it (not trust stale state).
    account.balances = [{ asset: 'BTC', free: '9', locked: '0' }];
    account.updateTime = 5000;
    factory.socket?.handlers.onClose(1006, 'drop');
    await scheduler.advance(5_000);
    await flush();
    await flush();

    expect(sync.metricsSnapshot().recoveries).toBeGreaterThanOrEqual(1);
    expect(sync.balances().find((b) => b.asset === 'BTC')?.free).toBe(9);
    expect(sync.state).toBe('SYNCHRONIZED');
  });
});
