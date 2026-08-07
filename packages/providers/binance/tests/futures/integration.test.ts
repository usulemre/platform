/**
 * Integration & contract tests for the USDⓈ-M Futures integration, exercised end-to-end through the
 * Broker Gateway provider boundary (`provider.futuresService(ctx)`) over a fake HTTP transport. They
 * assert the market guard, the documented Futures REST endpoints/parameters, signed-request placement
 * (API-key header + HMAC signature), public (unsigned) mark-price reads, and canonical error mapping for
 * authentication failures, rate limiting and venue order rejects. No real network is used.
 */
import { describe, expect, it } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import { BinanceFuturesErrorMapper } from '../../src/futures/error-mapper';
import { BinanceApiError } from '../../src/errors';
import {
  capabilityContext,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';

const FUTURES_ORDER = {
  symbol: 'BTCUSDT',
  orderId: 500,
  clientOrderId: 'fc-1',
  price: '25000',
  origQty: '1',
  executedQty: '0',
  avgPrice: '0',
  status: 'NEW',
  type: 'LIMIT',
  side: 'BUY',
  positionSide: 'BOTH',
  reduceOnly: false,
  updateTime: 1,
};

function futuresTransport(): FakeTransport {
  return new FakeTransport()
    .on('/fapi/v1/ping', { body: {} })
    .on('/fapi/v1/time', { body: { serverTime: 5_000 } })
    .on('/fapi/v1/order', { body: FUTURES_ORDER })
    .on('/fapi/v2/positionRisk', {
      body: [
        {
          symbol: 'BTCUSDT',
          positionAmt: '0.5',
          entryPrice: '25000',
          marginType: 'cross',
          positionSide: 'BOTH',
        },
      ],
    })
    .on('/fapi/v2/account', {
      body: {
        canTrade: true,
        totalWalletBalance: '1000',
        availableBalance: '900',
        assets: [{ asset: 'USDT', walletBalance: '1000', availableBalance: '900' }],
        positions: [],
      },
    })
    .on('/fapi/v2/balance', { body: [{ asset: 'USDT', balance: '1000', availableBalance: '900' }] })
    .on('/fapi/v1/leverage', {
      body: { leverage: 10, maxNotionalValue: '1000000', symbol: 'BTCUSDT' },
    })
    .on('/fapi/v1/marginType', { body: { code: 200, msg: 'success' } })
    .on('/fapi/v1/positionSide/dual', { body: { dualSidePosition: false } })
    .on('/fapi/v1/positionMargin', { body: { amount: 100, code: 200, msg: 'ok', type: 1 } })
    .on('/fapi/v1/premiumIndex', {
      body: { symbol: 'BTCUSDT', markPrice: '25000', lastFundingRate: '0.0001' },
    });
}

function futuresProvider(transport: FakeTransport, secrets = TEST_SECRETS) {
  return createBinanceProvider({
    providerId: 'binance-futures',
    transport,
    secretProvider: new InMemorySecretProvider(secrets),
    clock: new FixedClock(1_000).now,
  });
}

const futuresConfig = gatewayConfig({ providerId: 'binance-futures' });
const ctx = capabilityContext(futuresConfig);

describe('BinanceProvider.futuresService — market guard', () => {
  it('is unavailable on the spot market', () => {
    const spot = createBinanceProvider({
      providerId: 'binance',
      transport: new FakeTransport(),
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      clock: new FixedClock(1_000).now,
    });
    expect(() => spot.futuresService(capabilityContext(gatewayConfig()))).toThrow(
      /Futures trading is unavailable/,
    );
  });

  it('exposes the canonical Futures capability on the futures market', () => {
    const provider = futuresProvider(futuresTransport());
    const futures = provider.futuresService(ctx);
    expect(futures.capabilities.supportsOperation('SET_LEVERAGE')).toBe(true);
    expect(futures.capabilities.supportsOrderType('TRAILING_STOP')).toBe(true);
  });
});

describe('BinanceProvider.futuresService — signed REST endpoints', () => {
  it('creates a Futures order with a signed request (API key + signature) to /fapi/v1/order', async () => {
    const transport = futuresTransport();
    const provider = futuresProvider(transport);
    const futures = provider.futuresService(ctx);

    const response = await futures.orders.createOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
      positionSide: 'BOTH',
    });
    expect(response.order.venueOrderId).toBe('500');

    const req = transport.lastRequest('/fapi/v1/order');
    expect(req).toBeDefined();
    expect(req!.method).toBe('POST');
    expect(req!.url).toContain('signature=');
    expect(req!.url).toContain('symbol=BTCUSDT');
    const headerKeys = Object.keys(req!.headers ?? {}).map((k) => k.toLowerCase());
    expect(headerKeys).toContain('x-mbx-apikey');
  });

  it('reads positions, account and balances through the documented Futures endpoints', async () => {
    const transport = futuresTransport();
    const futures = futuresProvider(transport).futuresService(ctx);

    const positions = await futures.positions.getPositions();
    expect(positions).toHaveLength(1);
    expect(transport.lastRequest('/fapi/v2/positionRisk')).toBeDefined();

    const account = await futures.account.getAccount();
    expect(account.canTrade).toBe(true);
    expect(transport.lastRequest('/fapi/v2/account')).toBeDefined();

    const balances = await futures.balances.getBalances();
    expect(balances[0]!.asset).toBe('USDT');
  });

  it('configures leverage, margin type and position mode via signed POSTs', async () => {
    const transport = futuresTransport();
    const futures = futuresProvider(transport).futuresService(ctx);

    expect((await futures.positions.setLeverage('BTC-USDT', 10)).leverage).toBe(10);
    expect(transport.lastRequest('/fapi/v1/leverage')!.url).toContain('leverage=10');

    expect((await futures.positions.setMarginType('BTC-USDT', 'ISOLATED')).acknowledged).toBe(true);
    expect(transport.lastRequest('/fapi/v1/marginType')!.url).toContain('marginType=ISOLATED');

    expect((await futures.positions.getPositionMode()).mode).toBe('ONE_WAY');
    expect(
      (await futures.positions.modifyPositionMargin('BTC-USDT', 100, 'ADD')).acknowledged,
    ).toBe(true);
  });

  it('reads mark price via a public (unsigned) request to /fapi/v1/premiumIndex', async () => {
    const transport = futuresTransport();
    const futures = futuresProvider(transport).futuresService(ctx);
    const mark = await futures.metadata.markPrice('BTC-USDT');
    expect(mark.markPrice).toBe(25000);
    const req = transport.lastRequest('/fapi/v1/premiumIndex');
    expect(req!.url).not.toContain('signature=');
  });
});

describe('BinanceProvider.futuresService — error mapping', () => {
  it('maps an authentication failure to a canonical order error', async () => {
    const transport = futuresTransport().on('/fapi/v1/order', {
      status: 401,
      body: { code: -2015, msg: 'Invalid API-key, IP, or permissions for action.' },
    });
    const futures = futuresProvider(transport).futuresService(ctx);
    await expect(
      futures.orders.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 1 }),
    ).rejects.toMatchObject({ category: 'REJECTED', venueCode: -2015 });
  });

  it('maps a venue order reject (insufficient margin) to a canonical order error', async () => {
    const transport = futuresTransport().on('/fapi/v1/order', {
      status: 400,
      body: { code: -2019, msg: 'Margin is insufficient.' },
    });
    const futures = futuresProvider(transport).futuresService(ctx);
    await expect(
      futures.orders.createOrder({ symbol: 'BTC-USDT', side: 'BUY', type: 'MARKET', quantity: 1 }),
    ).rejects.toMatchObject({ category: 'INSUFFICIENT_BALANCE', venueCode: -2019 });
  });

  it('classifies rate-limit responses as a retryable RATE_LIMIT error', () => {
    const mapper = new BinanceFuturesErrorMapper();
    const canonical = mapper.toCanonical(
      new BinanceApiError(-1003, 'Too many requests.', 429, 'RATE_LIMIT', true),
    );
    expect(canonical).toMatchObject({ category: 'RATE_LIMIT', retryable: true });
  });
});
