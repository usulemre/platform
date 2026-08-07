import { describe, expect, it } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { BinanceOrderService } from '../../src/orders/service';
import { BinanceApiError, BinanceError } from '../../src/errors';
import { createBinanceProvider } from '../../src/index';
import {
  capabilityContext,
  FakeTransport,
  FixedClock,
  gatewayConfig,
  TEST_SECRETS,
} from '../helpers';
import type { BinanceOrderClient, OrderRef, BinanceParamRecord } from '../../src/orders/client';
import type {
  BinanceCancelReplaceResponse,
  BinanceFuturesAck,
  BinanceOrder,
  BinanceUserTrade,
} from '../../src/types/binance';

const FILLED_ORDER: BinanceOrder = {
  symbol: 'BTCUSDT',
  orderId: 100,
  clientOrderId: 'c1',
  price: '25000',
  origQty: '1',
  executedQty: '1',
  cummulativeQuoteQty: '25000',
  status: 'FILLED',
  timeInForce: 'GTC',
  type: 'LIMIT',
  side: 'BUY',
  transactTime: 5,
  fills: [{ price: '25000', qty: '1', commission: '0.1', commissionAsset: 'USDT', tradeId: 7 }],
};

class FakeOrderClient implements BinanceOrderClient {
  lastCreate?: BinanceParamRecord;
  lastModify?: BinanceParamRecord;
  createError?: Error;
  cancelAllResult: readonly BinanceOrder[] | BinanceFuturesAck = [FILLED_ORDER];
  createOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    this.lastCreate = params;
    if (this.createError) return Promise.reject(this.createError);
    return Promise.resolve(FILLED_ORDER);
  }
  queryOrder(_s: string, _r: OrderRef): Promise<BinanceOrder> {
    return Promise.resolve({ ...FILLED_ORDER, status: 'NEW', executedQty: '0' });
  }
  cancelOrder(_s: string, _r: OrderRef): Promise<BinanceOrder> {
    return Promise.resolve({ ...FILLED_ORDER, status: 'CANCELED' });
  }
  cancelAllOrders(_s: string): Promise<readonly BinanceOrder[] | BinanceFuturesAck> {
    return Promise.resolve(this.cancelAllResult);
  }
  cancelReplaceOrder(_p: BinanceParamRecord): Promise<BinanceCancelReplaceResponse> {
    return Promise.resolve({
      cancelResult: 'SUCCESS',
      newOrderResult: 'SUCCESS',
      newOrderResponse: FILLED_ORDER,
    });
  }
  modifyOrder(params: BinanceParamRecord): Promise<BinanceOrder> {
    this.lastModify = params;
    return Promise.resolve({ ...FILLED_ORDER, status: 'NEW' });
  }
  openOrders(_s?: string): Promise<readonly BinanceOrder[]> {
    return Promise.resolve([{ ...FILLED_ORDER, status: 'NEW' }]);
  }
  myTrades(_s: string): Promise<readonly BinanceUserTrade[]> {
    const trade: BinanceUserTrade = {
      id: 7,
      orderId: 100,
      symbol: 'BTCUSDT',
      price: '25000',
      qty: '1',
      commission: '0.1',
      commissionAsset: 'USDT',
      isBuyer: true,
      isMaker: false,
      time: 1,
    };
    return Promise.resolve([trade]);
  }
}

function spotService(client = new FakeOrderClient()) {
  return { service: new BinanceOrderService({ market: 'SPOT', client, clock: () => 0 }), client };
}

describe('BinanceOrderService (integration)', () => {
  it('creates an order and returns the canonical response with fills + commissions', async () => {
    const { service, client } = spotService();
    const response = await service.createOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
      timeInForce: 'GTC',
    });
    expect(response.order).toMatchObject({
      venueOrderId: '100',
      status: 'FILLED',
      filledQuantity: 1,
    });
    expect(response.fills[0]).toMatchObject({ price: 25000, quantity: 1 });
    expect(response.commissions).toEqual([{ amount: 0.1, asset: 'USDT' }]);
    expect(client.lastCreate).toMatchObject({ symbol: 'BTCUSDT', newOrderRespType: 'FULL' });
    expect(service.metricsSnapshot().creates).toBe(1);
    expect(service.healthSnapshot().level).toBe('HEALTHY');
  });

  it('queries, cancels, lists open orders and fills', async () => {
    const { service } = spotService();
    expect((await service.getOrder('BTC-USDT', { orderId: 100 })).status).toBe('NEW');
    expect((await service.cancelOrder('BTC-USDT', { orderId: 100 })).status).toBe('CANCELED');
    expect(await service.listOpenOrders('BTC-USDT')).toHaveLength(1);
    const fills = await service.listFills('BTC-USDT');
    expect(fills[0]).toMatchObject({ tradeId: 7, price: 25000, isMaker: false });
  });

  it('cancels all orders (Spot returns the cancelled orders)', async () => {
    const { service } = spotService();
    const cancelled = await service.cancelAllOrders('BTC-USDT');
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0]!.venueOrderId).toBe('100');
  });

  it('replaces via Spot cancelReplace', async () => {
    const { service } = spotService();
    const response = await service.replaceOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 26000,
      reference: { orderId: 100 },
    });
    expect(response.order.venueOrderId).toBe('100');
    expect(service.metricsSnapshot().replaces).toBe(1);
  });

  it('maps a venue rejection to a canonical error and records it', async () => {
    const client = new FakeOrderClient();
    client.createError = new BinanceApiError(
      -2010,
      'insufficient balance',
      400,
      'ORDER_REJECTED',
      false,
    );
    const { service } = spotService(client);
    await expect(
      service.createOrder({
        symbol: 'BTC-USDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: 1,
        price: 25000,
      }),
    ).rejects.toBeInstanceOf(BinanceError);
    expect(service.metricsSnapshot().rejects).toBe(1);
    expect(service.healthSnapshot().errorRate).toBeGreaterThan(0);
  });
});

describe('BinanceOrderService (Futures)', () => {
  it('acknowledges cancel-all and modifies via PUT', async () => {
    const client = new FakeOrderClient();
    client.cancelAllResult = { code: 200, msg: 'success' };
    const service = new BinanceOrderService({ market: 'FUTURES', client, clock: () => 0 });
    expect(await service.cancelAllOrders('BTC-USDT')).toEqual([]);
    await service.replaceOrder({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 2,
      price: 26000,
      reference: { orderId: 100 },
    });
    expect(client.lastModify).toMatchObject({
      symbol: 'BTCUSDT',
      quantity: 2,
      price: 26000,
      orderId: 100,
    });
  });
});

describe('BinanceOrderService (contract: Broker Gateway → provider flow)', () => {
  it('creates an order through the provider (signed, via the resilient REST client)', async () => {
    const transport = new FakeTransport().on('/api/v3/order', { body: FILLED_ORDER });
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport,
      secretProvider: new InMemorySecretProvider(TEST_SECRETS),
      clock: new FixedClock(0).now,
    });
    const ctx = capabilityContext(gatewayConfig());

    const order = await provider.submitOrder(ctx, {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
      timeInForce: 'GTC',
    });
    expect(order).toMatchObject({ venueOrderId: '100', status: 'FILLED' });
    const request = transport.lastRequest('/api/v3/order');
    expect(request?.method).toBe('POST');
    expect(request?.url).toContain('signature=');
    expect(request?.headers['X-MBX-APIKEY']).toBe('test-api-key');
    // The order service is memoized per broker runtime and supports capability introspection.
    expect(provider.orderService(ctx)).toBe(provider.orderService(ctx));
    expect(provider.orderService(ctx).capabilities.supportsQuoteQuantity).toBe(true);
  });
});
