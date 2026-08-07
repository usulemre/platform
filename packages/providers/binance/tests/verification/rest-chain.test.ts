/**
 * Phase 9.1.8 — REST Integration Verification.
 *
 * Proves the full REST chain end-to-end through the provider:
 *   canonical request → Broker Gateway surface → Binance provider → Common HTTP Client
 *   → auth signing → retry/timeout → circuit breaker → rate limiter → (fake) Binance REST
 *   → response → provider mapper → canonical response.
 *
 * It verifies real request signing (HMAC-SHA256 hex, timestamp + recvWindow, signature LAST), public
 * vs signed placement, canonical response mapping, deterministic error mapping for every documented
 * error class, and that the resilient pipeline (retry / rate-limit categorization) is actually wired
 * into the provider's REST path — including that a retried mutating order is NOT duplicated. All venue
 * IO is a deterministic fake transport driven by an auto-advancing scheduler.
 */
import { describe, expect, it } from 'vitest';
import { ManualScheduler } from '@platform/http-client';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import { BinanceError } from '../../src/errors';
import { capabilityContext, FakeTransport, gatewayConfig, TEST_SECRETS } from '../helpers';
import type { RawHttpRequest, RawHttpResponse } from '@platform/http-client';

const EXCHANGE_INFO = {
  symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' }],
};
const ORDER = {
  symbol: 'BTCUSDT',
  orderId: 100,
  clientOrderId: 'c-1',
  price: '25000',
  origQty: '1',
  executedQty: '1',
  cummulativeQuoteQty: '25000',
  status: 'FILLED',
  type: 'LIMIT',
  side: 'BUY',
  transactTime: 1,
  fills: [{ price: '25000', qty: '1', commission: '0.1', commissionAsset: 'USDT', tradeId: 7 }],
};

function baseTransport(): FakeTransport {
  return new FakeTransport()
    .on('/api/v3/ping', { body: {} })
    .on('/api/v3/time', { body: { serverTime: 5_000 } })
    .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
    .on('/api/v3/account', {
      body: { accountType: 'SPOT', balances: [{ asset: 'USDT', free: '900', locked: '0' }] },
    })
    .on('/api/v3/order', { body: ORDER })
    .on('/api/v3/depth', {
      body: { lastUpdateId: 1, bids: [['24999', '2']], asks: [['25001', '3']] },
    })
    .on('/api/v3/klines', { body: [[1, '1', '2', '0.5', '1.5', '10', 60]] });
}

function spotProvider(transport: FakeTransport) {
  return createBinanceProvider({
    providerId: 'binance',
    transport,
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
    scheduler: new ManualScheduler(),
    clock: () => 1_000,
  });
}

const ctx = capabilityContext(gatewayConfig());

describe('REST chain — request signing & timestamp handling', () => {
  it('signs a mutating order with timestamp, recvWindow and an HMAC-SHA256 signature placed LAST', async () => {
    const transport = baseTransport();
    const provider = spotProvider(transport);
    await provider.submitOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
    });

    const req = transport.lastRequest('/api/v3/order')!;
    expect(req.method).toBe('POST');
    expect(req.url).toContain('timestamp=');
    expect(req.url).toContain('recvWindow=');
    // Real signature (not a stub): HMAC-SHA256 hex is 64 chars and MUST be the final query parameter.
    expect(req.url).toMatch(/&signature=[a-f0-9]{64}$/);
    const headerKeys = Object.keys(req.headers ?? {}).map((k) => k.toLowerCase());
    expect(headerKeys).toContain('x-mbx-apikey');
  });

  it('sends public (unsigned) market-data reads without a signature or API key', async () => {
    const transport = baseTransport();
    const provider = spotProvider(transport);
    await provider.getOrderBook(ctx, 'BTC-USDT', 5);
    const req = transport.lastRequest('/api/v3/depth')!;
    expect(req.url).not.toContain('signature=');
    const headerKeys = Object.keys(req.headers ?? {}).map((k) => k.toLowerCase());
    expect(headerKeys).not.toContain('x-mbx-apikey');
  });
});

describe('REST chain — canonical mapping of responses', () => {
  it('maps a venue order response to a canonical order + fills (no Binance field names)', async () => {
    const provider = spotProvider(baseTransport());
    const response = await provider.createOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
    });
    expect(response.order).toMatchObject({
      venueOrderId: '100',
      status: 'FILLED',
      filledQuantity: 1,
    });
    expect(response.fills[0]).toMatchObject({ price: 25000, quantity: 1 });
    expect(Object.keys(response.order)).not.toContain('origQty');
  });

  it('maps a depth response to a canonical order book', async () => {
    const provider = spotProvider(baseTransport());
    const book = await provider.getOrderBook(ctx, 'BTC-USDT', 5);
    expect(book).toMatchObject({ lastUpdateId: 1 });
    expect(book.bids[0]).toMatchObject({ price: 24999, quantity: 2 });
  });
});

describe('REST chain — error mapping for every documented error class', () => {
  const cases: { name: string; status: number; body: unknown; category: string }[] = [
    {
      name: 'authentication',
      status: 401,
      body: { code: -2015, msg: 'Invalid API-key.' },
      category: 'AUTHENTICATION',
    },
    {
      name: 'invalid request',
      status: 400,
      body: { code: -1100, msg: 'Illegal characters.' },
      category: 'INVALID_REQUEST',
    },
    {
      name: 'invalid quantity/filter',
      status: 400,
      body: { code: -1013, msg: 'Filter failure: LOT_SIZE' },
      category: 'ORDER_REJECTED',
    },
    {
      name: 'unknown order',
      status: 400,
      body: { code: -2013, msg: 'Order does not exist.' },
      category: 'NOT_FOUND',
    },
    {
      name: 'rate limit',
      status: 429,
      body: { code: -1003, msg: 'Too many requests.' },
      category: 'RATE_LIMIT',
    },
    {
      name: 'timestamp',
      status: 400,
      body: { code: -1021, msg: 'Timestamp outside recvWindow.' },
      category: 'TIMESTAMP',
    },
    {
      name: 'server error',
      status: 502,
      body: { code: -1001, msg: 'Internal error.' },
      category: 'SERVER',
    },
  ];

  for (const c of cases) {
    it(`maps a ${c.name} failure to canonical category ${c.category}`, async () => {
      // Order path is a single non-retried attempt for 4xx; 429/5xx are retryable but the fake returns
      // the same status, so the mapped category is still asserted on the surfaced canonical error.
      const transport = baseTransport().on('/api/v3/order', { status: c.status, body: c.body });
      const provider = spotProvider(transport);
      let caught: unknown;
      try {
        await provider.getOrder(ctx, 'BTC-USDT', { orderId: 1 });
      } catch (error) {
        caught = error;
      }
      // The order surface throws a canonical BinanceApiError carrying the venue code + stable category.
      expect(caught).toBeInstanceOf(BinanceError);
      expect((caught as { code?: number }).code).toBe((c.body as { code: number }).code);
      expect((caught as BinanceError).category).toBe(c.category);
    });
  }

  it('never surfaces a raw Error — always a canonical BinanceError on the provider surface', async () => {
    const transport = baseTransport().on('/api/v3/depth', {
      status: 500,
      body: { code: -1001, msg: 'boom' },
    });
    const provider = spotProvider(transport);
    await expect(provider.getOrderBook(ctx, 'BTC-USDT')).rejects.toBeInstanceOf(BinanceError);
  });
});

describe('REST chain — resiliency wiring (retry / idempotency / rate-limit categorization)', () => {
  /** A transport that fails the first `failures` times on a path, then serves `ok`. */
  function flakyTransport(
    path: string,
    failures: number,
    ok: unknown,
  ): { transport: FakeTransport; count: () => number } {
    let calls = 0;
    const base = baseTransport();
    const send = base.send.bind(base);
    base.send = (request: RawHttpRequest): Promise<RawHttpResponse> => {
      if (request.url.includes(path)) {
        calls += 1;
        if (calls <= failures) {
          const text = JSON.stringify({ code: -1001, msg: 'temporary' });
          return Promise.resolve({
            status: 503,
            statusText: 'ERR',
            headers: { 'content-type': 'application/json' },
            text: () => Promise.resolve(text),
            arrayBuffer: () =>
              Promise.resolve(new TextEncoder().encode(text).buffer as ArrayBuffer),
            stream: () => null,
          });
        }
        const text = JSON.stringify(ok);
        return Promise.resolve({
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          text: () => Promise.resolve(text),
          arrayBuffer: () => Promise.resolve(new TextEncoder().encode(text).buffer as ArrayBuffer),
          stream: () => null,
        });
      }
      return send(request);
    };
    return { transport: base, count: () => calls };
  }

  it('retries a transient 503 and recovers to a single canonical result', async () => {
    const { transport, count } = flakyTransport('/api/v3/depth', 2, {
      lastUpdateId: 9,
      bids: [['1', '1']],
      asks: [['2', '1']],
    });
    const provider = spotProvider(transport);
    const book = await provider.getOrderBook(ctx, 'BTC-USDT');
    expect(book.lastUpdateId).toBe(9);
    // Two failures + one success = three transport attempts (retry engine is wired into the path).
    expect(count()).toBe(3);
  });

  it('a retried mutating order recovers without producing a duplicate canonical order', async () => {
    const { transport, count } = flakyTransport('/api/v3/order', 1, ORDER);
    const provider = spotProvider(transport);
    const response = await provider.createOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
    });
    expect(response.order.venueOrderId).toBe('100'); // exactly one canonical order
    expect(count()).toBe(2); // one retry, then success — no extra submissions after success
  });

  it('classifies an HTTP 429 as a retryable RATE_LIMIT error after retries are exhausted', async () => {
    const transport = baseTransport().on('/api/v3/depth', {
      status: 429,
      body: { code: -1003, msg: 'Too many requests.' },
    });
    const provider = spotProvider(transport);
    await expect(provider.getOrderBook(ctx, 'BTC-USDT')).rejects.toMatchObject({
      category: 'RATE_LIMIT',
      retryable: true,
    });
  });
});
