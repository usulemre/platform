import { describe, expect, it } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import { InMemorySecretProvider } from '@platform/auth-core';
import { UserDataStream } from '../../src/auth/user-data-stream';
import { AuthenticationStateManager } from '../../src/auth/state';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeSocketFactory,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import type { AuthenticatedRestClient } from '../../src/auth/rest';
import type { OrderUpdatedEvent, TradeExecutionEvent } from '../../src/auth/events';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function fakeRest(): AuthenticatedRestClient {
  let counter = 0;
  return {
    serverTime: () => Promise.resolve({ serverTime: 6_000 }),
    createListenKey: () => Promise.resolve(`key-${(counter += 1)}`),
    keepAliveListenKey: () => Promise.resolve(),
    closeListenKey: () => Promise.resolve(),
    account: () => Promise.resolve({ balances: [{ asset: 'BTC', free: '1', locked: '0' }] }),
  };
}

const EXEC_TRADE = {
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
  t: 99,
  m: false,
  O: 1,
  Z: '25000',
};

describe('UserDataStream (integration over fake socket)', () => {
  function makeStream() {
    const factory = new FakeSocketFactory();
    const scheduler = new ManualScheduler();
    const clock = new FixedClock(0);
    const stateManager = new AuthenticationStateManager({ clock: clock.now });
    const stream = new UserDataStream({
      market: 'SPOT',
      wsBaseUrl: 'wss://stream.binance.com:9443',
      rest: fakeRest(),
      factory,
      stateManager,
      clock: clock.now,
      scheduler,
      recoverOnReconnect: false,
    });
    return { stream, factory };
  }

  it('authenticates, opens /ws/<listenKey> and delivers canonical order + trade events', async () => {
    const { stream, factory } = makeStream();
    await stream.start();
    expect(stream.authState).toBe('AUTHENTICATED');
    expect(stream.listenKey).toBe('key-1');
    expect(factory.socket?.url).toContain('/ws/key-1');

    const orders: OrderUpdatedEvent[] = [];
    const trades: TradeExecutionEvent[] = [];
    stream.on('orderUpdated', (e) => orders.push(e));
    stream.on('tradeExecution', (e) => trades.push(e));

    factory.emit(EXEC_TRADE);
    expect(orders[0]).toMatchObject({ venueOrderId: '42', status: 'FILLED', side: 'BUY' });
    expect(trades[0]).toMatchObject({ tradeId: 99, price: 25000, quantity: 1 });

    const metrics = stream.metricsSnapshot();
    expect(metrics.byKind['orderUpdated']).toBe(1);
    expect(metrics.byKind['tradeExecution']).toBe(1);
    expect(stream.health().level).toBe('HEALTHY');
  });

  it('re-authenticates with a fresh listen key on listenKeyExpired', async () => {
    const { stream, factory } = makeStream();
    await stream.start();
    const expiries: unknown[] = [];
    stream.on('listenKeyExpired', (e) => expiries.push(e));

    factory.emit({ e: 'listenKeyExpired', E: 5 });
    await flush();

    expect(expiries).toHaveLength(1);
    expect(stream.authState).toBe('AUTHENTICATED');
    expect(stream.listenKey).toBe('key-2');
    expect(factory.socket?.url).toContain('/ws/key-2');
    expect(stream.metricsSnapshot().listenKeyExpiries).toBe(1);
  });

  it('ignores undocumented event types without error', async () => {
    const { stream, factory } = makeStream();
    await stream.start();
    factory.emit({ e: 'someFutureEvent', E: 1 });
    expect(stream.metricsSnapshot().errors).toBe(0);
  });
});

describe('BinanceAuthenticationService (contract: provider integration)', () => {
  it('authenticates via the provider and opens an authenticated user data stream', async () => {
    const transport = new FakeTransport()
      .on('/api/v3/time', { body: { serverTime: 6_000 } })
      .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
      .on('/api/v3/account', { body: { balances: [] } });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      socketFactory: new FakeSocketFactory(),
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      scheduler: new ManualScheduler(),
      clock: new FixedClock(1_000).now,
    });
    const ctx = capabilityContext(gatewayConfig());
    const service = provider.authenticationService(ctx);

    const result = await service.authenticate();
    expect(result.authenticated).toBe(true);
    expect(result.serverOffsetMs).toBe(5_000);
    expect(service.timestamp()).toBe(6_000);

    const stream = service.userDataStream();
    await stream.start();
    expect(stream.listenKey).toBe('lk-1');
    expect(provider.authenticationService(ctx)).toBe(service);
  });
});
