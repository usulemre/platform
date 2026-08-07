import { describe, expect, it } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import { BinanceApiError, BinanceConfigurationError } from '../../src/errors';
import {
  capabilityContext,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';

const EXCHANGE_INFO = {
  symbols: [{ symbol: 'BTCUSDT', status: 'TRADING', baseAsset: 'BTC', quoteAsset: 'USDT' }],
};
const ORDER = {
  symbol: 'BTCUSDT',
  orderId: 100,
  clientOrderId: 'c-1',
  price: '25000',
  origQty: '1',
  executedQty: '0',
  status: 'NEW',
  type: 'LIMIT',
  side: 'BUY',
  transactTime: 1_700_000_000_000,
};

function spotTransport(): FakeTransport {
  return new FakeTransport()
    .on('/api/v3/ping', { body: {} })
    .on('/api/v3/time', { body: { serverTime: 5_000 } })
    .on('/api/v3/exchangeInfo', { body: EXCHANGE_INFO })
    .on('/api/v3/account', {
      body: {
        accountType: 'SPOT',
        balances: [
          { asset: 'BTC', free: '1.0', locked: '0.0' },
          { asset: 'USDT', free: '500', locked: '0' },
        ],
      },
    })
    .on('/api/v3/openOrders', { body: [ORDER] })
    .on('/api/v3/order', { body: { ...ORDER, status: 'FILLED', executedQty: '1' } })
    .on('/api/v3/depth', {
      body: { lastUpdateId: 1, bids: [['24999', '2']], asks: [['25001', '3']] },
    })
    .on('/api/v3/klines', { body: [[1, '1', '2', '0.5', '1.5', '10', 60]] });
}

function spotProvider(transport: FakeTransport, secrets = TEST_SECRETS) {
  return createBinanceProvider({
    providerId: 'binance',
    transport,
    secretProvider: new InMemorySecretProvider(secrets),
    clock: new FixedClock(1_000).now,
  });
}

describe('BinanceProvider — spot (integration over fake transport)', () => {
  const config = gatewayConfig();
  const ctx = capabilityContext(config);

  it('reports a real (non-placeholder) descriptor and refined capabilities', () => {
    const provider = spotProvider(spotTransport());
    expect(provider.descriptor.placeholder).toBe(false);
    expect(provider.supports('SUBMIT_ORDER')).toBe(true);
    expect(provider.supports('QUERY_POSITIONS')).toBe(false);
  });

  it('connects by pinging, syncing time and loading exchange info', async () => {
    const transport = spotTransport();
    const provider = spotProvider(transport);
    await provider.connect(ctx);
    expect(transport.lastRequest('/api/v3/ping')).toBeDefined();
    expect(transport.lastRequest('/api/v3/exchangeInfo')).toBeDefined();
    const health = provider.health(ctx, 'HEALTHY');
    expect(['HEALTHY', 'DEGRADED']).toContain(health.level);
  });

  it('queries balances and open orders as canonical shapes', async () => {
    const provider = spotProvider(spotTransport());
    await provider.connect(ctx);
    const balances = await provider.queryBalances(ctx);
    expect(balances).toContainEqual({ currency: 'BTC', total: 1, available: 1 });
    const orders = await provider.queryOrders(ctx);
    expect(orders[0]).toMatchObject({ brokerOrderId: '100', clientOrderId: 'c-1', status: 'NEW' });
    expect(await provider.queryPositions(ctx)).toEqual([]);
  });

  it('submits a signed order and maps the acknowledgement', async () => {
    const transport = spotTransport();
    const provider = spotProvider(transport);
    const order = await provider.submitOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
      timeInForce: 'GTC',
    });
    expect(order).toMatchObject({ venueOrderId: '100', status: 'FILLED', filledQuantity: 1 });
    const request = transport.lastRequest('/api/v3/order');
    expect(request?.method).toBe('POST');
    expect(request?.url).toContain('signature=');
    expect(request?.url).toContain('timestamp=');
    expect(request?.headers['X-MBX-APIKEY']).toBe('test-api-key');
  });

  it('returns canonical market data', async () => {
    const provider = spotProvider(spotTransport());
    const book = await provider.getOrderBook(ctx, 'BTC-USDT');
    expect(book.bids[0]).toEqual({ price: 24999, quantity: 2 });
    const klines = await provider.getKlines(ctx, 'BTC-USDT', '1m');
    expect(klines[0]).toMatchObject({ open: 1, high: 2, low: 0.5, close: 1.5, closed: true });
  });

  it('measures heartbeat latency', async () => {
    const provider = spotProvider(spotTransport());
    const beat = await provider.heartbeat(ctx);
    expect(beat.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof beat.at).toBe('string');
  });

  it('maps a venue error to a classified BinanceApiError', async () => {
    const transport = spotTransport().on('/api/v3/account', {
      status: 400,
      body: { code: -2015, msg: 'invalid api key' },
    });
    const provider = spotProvider(transport);
    await expect(provider.queryBalances(ctx)).rejects.toBeInstanceOf(BinanceApiError);
  });

  it('fails closed on authenticate without resolvable secrets', async () => {
    const provider = spotProvider(spotTransport(), {});
    await expect(provider.authenticate(ctx)).rejects.toBeInstanceOf(BinanceConfigurationError);
  });

  it('rejects a broker bound to a different provider id', async () => {
    const provider = spotProvider(spotTransport());
    const foreign = capabilityContext(gatewayConfig({ providerId: 'binance-futures' }));
    await expect(provider.connect(foreign)).rejects.toBeInstanceOf(BinanceConfigurationError);
  });
});

describe('BinanceProvider — futures', () => {
  const config = gatewayConfig({
    providerId: 'binance-futures',
    capabilities: ['SUBMIT_ORDER', 'QUERY_POSITIONS', 'QUERY_BALANCES', 'HEARTBEAT'],
  });
  const ctx = capabilityContext(config);

  function futuresProvider() {
    const transport = new FakeTransport()
      .on('/fapi/v1/ping', { body: {} })
      .on('/fapi/v1/time', { body: { serverTime: 5_000 } })
      .on('/fapi/v1/exchangeInfo', {
        body: {
          symbols: [
            {
              symbol: 'BTCUSDT',
              status: 'TRADING',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              contractType: 'PERPETUAL',
            },
          ],
        },
      })
      .on('/fapi/v2/balance', {
        body: [{ asset: 'USDT', balance: '1000', availableBalance: '900' }],
      })
      .on('/fapi/v2/positionRisk', {
        body: [{ symbol: 'BTCUSDT', positionAmt: '-0.5', entryPrice: '25000' }],
      });
    return createBinanceProvider({
      providerId: 'binance-futures',
      transport,
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      clock: new FixedClock(1_000).now,
    });
  }

  it('supports positions and returns canonical futures balances & positions', async () => {
    const provider = futuresProvider();
    expect(provider.market).toBe('FUTURES');
    expect(provider.supports('QUERY_POSITIONS')).toBe(true);
    await provider.connect(ctx);
    expect(await provider.queryBalances(ctx)).toEqual([
      { currency: 'USDT', total: 1000, available: 900 },
    ]);
    expect(await provider.queryPositions(ctx)).toEqual([
      { symbol: 'BTCUSDT', quantity: -0.5, averagePrice: 25000, assetClass: 'CRYPTO_PERP' },
    ]);
  });
});
