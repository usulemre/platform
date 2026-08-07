/**
 * Phase 9.1.8 — Order Lifecycle & Reconciliation Verification.
 *
 * Proves that a full order lifecycle observed over the WebSocket user-data stream (through the
 * provider) reduces to a canonical order state, that the REST order query and the WebSocket events
 * reconcile to the SAME canonical state, and that the lifecycle is robust to duplicate, out-of-order
 * (stale) and terminal-transition events. Covers create → partial fill → final fill, cancellation,
 * rejection and expiration. All venue IO is a deterministic fake transport/socket.
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
import type { OrderUpdatedEvent } from '../../src/auth/events';
import type { CanonicalOrderStatus } from '../../src/types/canonical';

/** A minimal canonical order-state view reconciled from a stream of order updates. */
interface OrderState {
  readonly venueOrderId: string;
  readonly status: CanonicalOrderStatus;
  readonly filledQuantity: number;
  readonly eventTime: number;
}

/**
 * Reduce order-update events into the canonical order state, honouring event time: a stale (older)
 * event is ignored, and a duplicate (same time + status + filled) is a no-op. `filledQuantity` is the
 * venue's cumulative filled quantity, so the latest wins.
 */
function reduce(events: readonly OrderUpdatedEvent[]): OrderState | undefined {
  let state: OrderState | undefined;
  for (const e of events) {
    if (state && e.eventTime < state.eventTime) continue; // stale / out-of-order → ignored
    if (
      state &&
      e.eventTime === state.eventTime &&
      e.status === state.status &&
      e.filledQuantity === state.filledQuantity
    )
      continue; // duplicate → no-op
    state = {
      venueOrderId: e.venueOrderId,
      status: e.status,
      filledQuantity: e.filledQuantity,
      eventTime: e.eventTime,
    };
  }
  return state;
}

const FILLED_ORDER = {
  symbol: 'BTCUSDT',
  orderId: 42,
  clientOrderId: 'c-42',
  price: '25000',
  origQty: '1',
  executedQty: '1',
  cummulativeQuoteQty: '25000',
  status: 'FILLED',
  type: 'LIMIT',
  side: 'BUY',
  transactTime: 5,
};

function makeProvider(orderBody: unknown = FILLED_ORDER) {
  const factory = new FakeSocketFactory();
  const provider = createBinanceProvider({
    providerId: 'binance',
    transport: new FakeTransport()
      .on('/api/v3/time', { body: { serverTime: 0 } })
      .on('/api/v3/userDataStream', { body: { listenKey: 'lk-1' } })
      .on('/api/v3/account', { body: { accountType: 'SPOT', balances: [] } })
      .on('/api/v3/order', { body: orderBody }),
    socketFactory: factory,
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    scheduler: new ManualScheduler(),
    clock: new FixedClock(0).now,
  });
  return { provider, factory };
}

const ctx = capabilityContext(gatewayConfig());

/** Build a Spot executionReport with the fields the lifecycle needs. */
function exec(
  status: string,
  execType: string,
  cumFilled: string,
  eventTime: number,
  orderId = 42,
) {
  return {
    e: 'executionReport',
    E: eventTime,
    s: 'BTCUSDT',
    c: 'c-42',
    S: 'BUY',
    o: 'LIMIT',
    f: 'GTC',
    q: '1',
    p: '25000',
    P: '0',
    x: execType,
    X: status,
    r: 'NONE',
    i: orderId,
    l: '0.5',
    z: cumFilled,
    L: '25000',
    n: '0',
    N: null,
    T: eventTime,
    t: execType === 'TRADE' ? eventTime : -1,
    m: false,
    O: 1,
    Z: '0',
  };
}

describe('Order lifecycle — create → partial fill → final fill reconciles REST and WS', () => {
  it('reduces the WS stream to FILLED and matches the REST order query', async () => {
    const { provider, factory } = makeProvider();
    const stream = provider.authenticationService(ctx).userDataStream();
    await stream.start();
    const updates: OrderUpdatedEvent[] = [];
    stream.on('orderUpdated', (e) => updates.push(e));

    factory.emit(exec('NEW', 'NEW', '0', 1));
    factory.emit(exec('PARTIALLY_FILLED', 'TRADE', '0.5', 2));
    factory.emit(exec('FILLED', 'TRADE', '1', 3));

    const wsState = reduce(updates)!;
    expect(wsState).toMatchObject({ venueOrderId: '42', status: 'FILLED', filledQuantity: 1 });

    // REST query of the same order yields the SAME canonical terminal state.
    const restOrder = await provider.getOrder(ctx, 'BTC-USDT', { orderId: 42 });
    expect(restOrder.venueOrderId).toBe(wsState.venueOrderId);
    expect(restOrder.status).toBe(wsState.status);
    expect(restOrder.filledQuantity).toBe(wsState.filledQuantity);
  });

  it('ignores duplicate and out-of-order (stale) events without corrupting the state', async () => {
    const { provider, factory } = makeProvider();
    const stream = provider.authenticationService(ctx).userDataStream();
    await stream.start();
    const updates: OrderUpdatedEvent[] = [];
    stream.on('orderUpdated', (e) => updates.push(e));

    factory.emit(exec('PARTIALLY_FILLED', 'TRADE', '0.5', 2));
    factory.emit(exec('PARTIALLY_FILLED', 'TRADE', '0.5', 2)); // duplicate
    factory.emit(exec('FILLED', 'TRADE', '1', 4));
    factory.emit(exec('PARTIALLY_FILLED', 'TRADE', '0.5', 3)); // stale (older than the FILLED at t=4)

    const state = reduce(updates)!;
    expect(state.status).toBe('FILLED');
    expect(state.filledQuantity).toBe(1); // stale partial did not roll back the fill
  });
});

describe('Order lifecycle — terminal transitions', () => {
  const terminal: {
    name: string;
    status: string;
    execType: string;
    expected: CanonicalOrderStatus;
  }[] = [
    { name: 'cancellation', status: 'CANCELED', execType: 'CANCELED', expected: 'CANCELED' },
    { name: 'rejection', status: 'REJECTED', execType: 'REJECTED', expected: 'REJECTED' },
    { name: 'expiration', status: 'EXPIRED', execType: 'EXPIRED', expected: 'EXPIRED' },
  ];

  for (const t of terminal) {
    it(`reconciles a ${t.name} to canonical ${t.expected}`, async () => {
      const { provider, factory } = makeProvider();
      const stream = provider.authenticationService(ctx).userDataStream();
      await stream.start();
      const updates: OrderUpdatedEvent[] = [];
      stream.on('orderUpdated', (e) => updates.push(e));

      factory.emit(exec('NEW', 'NEW', '0', 1));
      factory.emit(exec(t.status, t.execType, '0', 2));

      expect(reduce(updates)!.status).toBe(t.expected);
    });
  }
});
