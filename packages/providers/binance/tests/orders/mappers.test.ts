import { describe, expect, it } from 'vitest';
import { BinanceOrderRequestBuilder } from '../../src/orders/request-builder';
import { BinanceFillMapper } from '../../src/orders/fill-mapper';
import { BinanceCommissionMapper } from '../../src/orders/commission-mapper';
import { BinanceOrderStatusMapper } from '../../src/orders/status-mapper';
import { BinanceOrderCapabilities } from '../../src/orders/capabilities';
import { BinanceOrderResponseParser } from '../../src/orders/response-parser';
import { BinanceOrderErrorMapper } from '../../src/orders/error-mapper';
import { BinanceOrderStateError } from '../../src/orders/errors';
import { BinanceMapper } from '../../src/mappers/mapper';
import { BinanceApiError } from '../../src/errors';
import type { BinanceOrder } from '../../src/types/binance';

describe('BinanceOrderRequestBuilder', () => {
  it('builds a Spot LIMIT create with FULL response type', () => {
    const params = new BinanceOrderRequestBuilder('SPOT').buildCreate({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1.5,
      price: 25000,
      timeInForce: 'GTC',
      clientOrderId: 'abc',
    });
    expect(params).toMatchObject({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1.5,
      price: 25000,
      timeInForce: 'GTC',
      newClientOrderId: 'abc',
      newOrderRespType: 'FULL',
    });
  });

  it('uses quoteOrderQty for a Spot MARKET buy', () => {
    const params = new BinanceOrderRequestBuilder('SPOT').buildCreate({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0,
      quoteQuantity: 500,
    });
    expect(params['quoteOrderQty']).toBe(500);
    expect(params['quantity']).toBeUndefined();
  });

  it('maps canonical types to Futures venue types and honours reduceOnly', () => {
    const builder = new BinanceOrderRequestBuilder('FUTURES');
    expect(
      builder.buildCreate({
        symbol: 'BTCUSDT',
        side: 'SELL',
        type: 'STOP',
        quantity: 1,
        stopPrice: 9000,
      })['type'],
    ).toBe('STOP_MARKET');
    expect(
      builder.buildCreate({
        symbol: 'BTCUSDT',
        side: 'SELL',
        type: 'STOP_LIMIT',
        quantity: 1,
        price: 9000,
        stopPrice: 9000,
      })['type'],
    ).toBe('STOP');
    const reduce = builder.buildCreate({
      symbol: 'BTCUSDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 1,
      reduceOnly: true,
    });
    expect(reduce['reduceOnly']).toBe(true);
    expect(reduce['newOrderRespType']).toBeUndefined();
  });

  it('builds cancelReplace (Spot) and modify (Futures) params', () => {
    const spot = new BinanceOrderRequestBuilder('SPOT').buildCancelReplace({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 1,
      price: 25000,
      reference: { orderId: 42 },
    });
    expect(spot).toMatchObject({
      cancelReplaceMode: 'STOP_ON_FAILURE',
      cancelOrderId: 42,
      type: 'LIMIT',
    });
    const fut = new BinanceOrderRequestBuilder('FUTURES').buildModify({
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 2,
      price: 26000,
      reference: { orderId: 7 },
    });
    expect(fut).toMatchObject({
      symbol: 'BTCUSDT',
      side: 'BUY',
      quantity: 2,
      price: 26000,
      orderId: 7,
    });
  });
});

describe('Fill & commission mappers', () => {
  it('maps fills and aggregates commission by asset', () => {
    const fills = new BinanceFillMapper().toCanonicalMany([
      { price: '25000', qty: '0.5', commission: '0.1', commissionAsset: 'USDT', tradeId: 1 },
      { price: '25010', qty: '0.5', commission: '0.2', commissionAsset: 'USDT', tradeId: 2 },
      { price: '25010', qty: '0.5', commission: '0.001', commissionAsset: 'BNB', tradeId: 3 },
    ]);
    expect(fills).toHaveLength(3);
    const commissions = new BinanceCommissionMapper().aggregate(fills);
    expect(commissions).toEqual([
      { amount: 0.30000000000000004, asset: 'USDT' },
      { amount: 0.001, asset: 'BNB' },
    ]);
  });
});

describe('BinanceOrderStatusMapper', () => {
  const mapper = new BinanceOrderStatusMapper();
  it('maps statuses and identifies terminal states', () => {
    expect(mapper.toCanonical('PARTIALLY_FILLED')).toBe('PARTIALLY_FILLED');
    expect(mapper.isTerminal('FILLED')).toBe(true);
    expect(mapper.isTerminal('NEW')).toBe(false);
  });
  it('validates lifecycle transitions', () => {
    expect(mapper.canTransition('NEW', 'PARTIALLY_FILLED')).toBe(true);
    expect(mapper.canTransition('FILLED', 'NEW')).toBe(false);
    expect(() => mapper.validateTransition('FILLED', 'CANCELED')).toThrow(BinanceOrderStateError);
  });
});

describe('BinanceOrderCapabilities', () => {
  it('reflects Spot vs Futures documented differences', () => {
    const spot = new BinanceOrderCapabilities('SPOT');
    expect(spot.supportsQuoteQuantity).toBe(true);
    expect(spot.supportsReduceOnly).toBe(false);
    expect(spot.returnsFillsOnCreate).toBe(true);
    const fut = new BinanceOrderCapabilities('FUTURES');
    expect(fut.supportsQuoteQuantity).toBe(false);
    expect(fut.supportsReduceOnly).toBe(true);
    expect(fut.returnsFillsOnCreate).toBe(false);
    expect(spot.supportsOperation('REPLACE')).toBe(true);
  });
});

describe('BinanceOrderResponseParser', () => {
  it('parses a Spot order response with fills and commissions', () => {
    const raw: BinanceOrder = {
      symbol: 'BTCUSDT',
      orderId: 28,
      clientOrderId: 'c1',
      price: '0',
      origQty: '1',
      executedQty: '1',
      cummulativeQuoteQty: '25000',
      status: 'FILLED',
      type: 'MARKET',
      side: 'BUY',
      transactTime: 123,
      fills: [
        { price: '25000', qty: '1', commission: '0.1', commissionAsset: 'USDT', tradeId: 56 },
      ],
    };
    const parser = new BinanceOrderResponseParser(new BinanceMapper('SPOT').orders);
    const response = parser.parse(raw);
    expect(response.order).toMatchObject({
      venueOrderId: '28',
      status: 'FILLED',
      filledQuantity: 1,
    });
    expect(response.fills[0]).toMatchObject({ price: 25000, quantity: 1, commission: 0.1 });
    expect(response.commissions).toEqual([{ amount: 0.1, asset: 'USDT' }]);
    expect(response.transactTime).toBe(123);
  });
});

describe('BinanceOrderErrorMapper', () => {
  const mapper = new BinanceOrderErrorMapper();
  it('classifies venue order-reject codes', () => {
    expect(
      mapper.toCanonical(
        new BinanceApiError(-2010, 'insufficient balance', 400, 'ORDER_REJECTED', false),
      ).category,
    ).toBe('INSUFFICIENT_BALANCE');
    expect(
      mapper.toCanonical(
        new BinanceApiError(-2013, 'Order does not exist.', 400, 'NOT_FOUND', false),
      ).category,
    ).toBe('NOT_FOUND');
    expect(
      mapper.toCanonical(
        new BinanceApiError(-1013, 'filter failure', 400, 'ORDER_REJECTED', false),
      ),
    ).toMatchObject({
      category: 'REJECTED',
      venueCode: -1013,
    });
  });
});
