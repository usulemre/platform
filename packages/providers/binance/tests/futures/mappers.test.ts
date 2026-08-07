/**
 * Unit tests for the USDⓈ-M Futures mappers and request builder — the pure, deterministic translation
 * boundary. They assert canonical projections of positions, account, config responses, mark price and
 * funding, and the documented Futures order parameter construction (position side, reduceOnly,
 * closePosition, trailing stop, working type, price protection).
 */
import { describe, expect, it } from 'vitest';
import { BinanceFuturesRequestBuilder } from '../../src/futures/request-builder';
import { BinanceFuturesOrderMapper } from '../../src/futures/order-mapper';
import { BinanceFuturesPositionMapper } from '../../src/futures/position-mapper';
import { BinanceFuturesAccountMapper } from '../../src/futures/account-mapper';
import { BinanceFuturesConfigMapper } from '../../src/futures/config-mapper';
import { BinanceFuturesMetadataMapper } from '../../src/futures/metadata-mapper';
import type { FuturesOrderRequest } from '../../src/futures/types';
import type {
  BinanceFuturesAccountInfo,
  BinanceOrder,
  BinancePositionRisk,
} from '../../src/types/binance';

const RESOLVER = { toCanonical: (s: string) => (s === 'BTCUSDT' ? 'BTC-USDT' : s) };

describe('BinanceFuturesRequestBuilder', () => {
  const builder = new BinanceFuturesRequestBuilder();

  it('builds a LIMIT order with time-in-force and price', () => {
    const request: FuturesOrderRequest = {
      symbol: 'BTC-USDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 2,
      price: 25000,
      timeInForce: 'GTC',
      positionSide: 'LONG',
    };
    const params = builder.buildCreate(request);
    expect(params).toMatchObject({
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'LIMIT',
      quantity: 2,
      price: 25000,
      timeInForce: 'GTC',
      positionSide: 'LONG',
      newOrderRespType: 'RESULT',
    });
  });

  it('maps STOP without a price to STOP_MARKET and carries stopPrice', () => {
    const params = builder.buildCreate({
      symbol: 'BTC-USDT',
      side: 'SELL',
      type: 'STOP',
      quantity: 1,
      stopPrice: 24000,
    });
    expect(params['type']).toBe('STOP_MARKET');
    expect(params['stopPrice']).toBe(24000);
    expect(params['price']).toBeUndefined();
  });

  it('builds a TRAILING_STOP order with activation price and callback rate', () => {
    const params = builder.buildCreate({
      symbol: 'BTC-USDT',
      side: 'SELL',
      type: 'TRAILING_STOP',
      quantity: 1,
      activationPrice: 26000,
      callbackRate: 1.5,
    });
    expect(params['type']).toBe('TRAILING_STOP_MARKET');
    expect(params['activationPrice']).toBe(26000);
    expect(params['callbackRate']).toBe(1.5);
  });

  it('omits quantity and reduceOnly for a closePosition order', () => {
    const params = builder.buildCreate({
      symbol: 'BTC-USDT',
      side: 'SELL',
      type: 'MARKET',
      quantity: 5,
      closePosition: true,
      reduceOnly: true,
    });
    expect(params['closePosition']).toBe(true);
    expect(params['quantity']).toBeUndefined();
    expect(params['reduceOnly']).toBeUndefined();
  });

  it('carries reduceOnly, workingType and price protection', () => {
    const params = builder.buildCreate({
      symbol: 'BTC-USDT',
      side: 'SELL',
      type: 'STOP',
      quantity: 1,
      price: 24000,
      stopPrice: 24010,
      reduceOnly: true,
      workingType: 'MARK_PRICE',
      priceProtection: true,
    });
    expect(params['reduceOnly']).toBe(true);
    expect(params['workingType']).toBe('MARK_PRICE');
    expect(params['priceProtect']).toBe('TRUE');
    expect(params['timeInForce']).toBe('GTC');
  });

  it('builds a position-margin add/reduce request', () => {
    expect(builder.buildPositionMargin('BTC-USDT', 100, 'ADD', 'LONG')).toMatchObject({
      symbol: 'BTCUSDT',
      amount: 100,
      type: 1,
      positionSide: 'LONG',
    });
    expect(builder.buildPositionMargin('BTC-USDT', 50, 'REDUCE')['type']).toBe(2);
  });
});

describe('BinanceFuturesOrderMapper', () => {
  const mapper = new BinanceFuturesOrderMapper();
  const raw: BinanceOrder = {
    symbol: 'BTCUSDT',
    orderId: 42,
    clientOrderId: 'c-1',
    price: '25000',
    origQty: '2',
    executedQty: '1',
    avgPrice: '25010',
    status: 'PARTIALLY_FILLED',
    type: 'STOP_MARKET',
    side: 'SELL',
    positionSide: 'SHORT',
    stopPrice: '24000',
    workingType: 'MARK_PRICE',
    reduceOnly: true,
    updateTime: 1000,
  };

  it('projects a venue order onto the canonical Futures order', () => {
    const order = mapper.toCanonical(raw);
    expect(order).toMatchObject({
      venueOrderId: '42',
      type: 'STOP',
      status: 'PARTIALLY_FILLED',
      quantity: 2,
      filledQuantity: 1,
      remainingQuantity: 1,
      positionSide: 'SHORT',
      reduceOnly: true,
      stopPrice: 24000,
      workingType: 'MARK_PRICE',
      averagePrice: 25010,
    });
  });

  it('returns a response with no create-time fills (Futures convention)', () => {
    const response = mapper.toResponse(raw);
    expect(response.fills).toEqual([]);
    expect(response.commissions).toEqual([]);
    expect(response.order.venueOrderId).toBe('42');
  });
});

describe('BinanceFuturesPositionMapper', () => {
  const mapper = new BinanceFuturesPositionMapper(RESOLVER);

  it('maps a position-risk row with liquidation and margin data', () => {
    const raw: BinancePositionRisk = {
      symbol: 'BTCUSDT',
      positionAmt: '-0.5',
      entryPrice: '25000',
      markPrice: '24800',
      unRealizedProfit: '100',
      leverage: '10',
      marginType: 'isolated',
      isolatedMargin: '1250',
      isolatedWallet: '1200',
      liquidationPrice: '30000',
      positionSide: 'SHORT',
      updateTime: 5,
    };
    const p = mapper.fromPositionRisk(raw);
    expect(p).toMatchObject({
      symbol: 'BTC-USDT',
      positionSide: 'SHORT',
      positionAmount: -0.5,
      marginType: 'ISOLATED',
      liquidationPrice: 30000,
      leverage: 10,
    });
  });

  it('drops flat (zero-amount) positions', () => {
    const rows: BinancePositionRisk[] = [
      { symbol: 'BTCUSDT', positionAmt: '0', entryPrice: '0' },
      { symbol: 'ETHUSDT', positionAmt: '3', entryPrice: '1500' },
    ];
    const out = mapper.fromPositionRiskMany(rows);
    expect(out).toHaveLength(1);
    expect(out[0]!.venueSymbol).toBe('ETHUSDT');
  });
});

describe('BinanceFuturesAccountMapper', () => {
  it('maps the account document to a canonical Futures account', () => {
    const info: BinanceFuturesAccountInfo = {
      canTrade: true,
      feeTier: 1,
      totalWalletBalance: '1000',
      totalUnrealizedProfit: '25',
      totalMarginBalance: '1025',
      availableBalance: '900',
      updateTime: 7,
      assets: [{ asset: 'USDT', walletBalance: '1000', availableBalance: '900' }],
      positions: [
        { symbol: 'BTCUSDT', positionAmt: '0.1', entryPrice: '25000', isolated: false },
        { symbol: 'ETHUSDT', positionAmt: '0', entryPrice: '0' },
      ],
    };
    const account = new BinanceFuturesAccountMapper(RESOLVER).account(info, 99);
    expect(account.canTrade).toBe(true);
    expect(account.totalWalletBalance).toBe(1000);
    expect(account.assets).toHaveLength(1);
    expect(account.positions).toHaveLength(1);
    expect(account.positions[0]!.marginType).toBe('CROSSED');
  });
});

describe('BinanceFuturesConfigMapper', () => {
  const mapper = new BinanceFuturesConfigMapper(RESOLVER);

  it('maps leverage, margin-type, position-mode and position-margin responses', () => {
    expect(
      mapper.leverage({ leverage: 10, maxNotionalValue: '1000000', symbol: 'BTCUSDT' }),
    ).toMatchObject({ symbol: 'BTC-USDT', leverage: 10, maxNotionalValue: 1000000 });
    expect(mapper.marginType('BTCUSDT', 'ISOLATED', { code: 200, msg: 'success' })).toMatchObject({
      marginType: 'ISOLATED',
      acknowledged: true,
    });
    expect(mapper.positionMode({ dualSidePosition: true }).mode).toBe('HEDGE');
    expect(mapper.positionMode({ dualSidePosition: false }).mode).toBe('ONE_WAY');
    expect(
      mapper.positionMargin('BTCUSDT', 'ADD', { amount: 100, code: 200, msg: 'ok', type: 1 }),
    ).toMatchObject({ amount: 100, direction: 'ADD', acknowledged: true });
  });
});

describe('BinanceFuturesMetadataMapper', () => {
  const mapper = new BinanceFuturesMetadataMapper(RESOLVER);

  it('maps mark price, funding rate and leverage brackets', () => {
    expect(
      mapper.markPrice({
        symbol: 'BTCUSDT',
        markPrice: '25000',
        indexPrice: '24990',
        lastFundingRate: '0.0001',
        nextFundingTime: 111,
      }),
    ).toMatchObject({
      symbol: 'BTC-USDT',
      markPrice: 25000,
      indexPrice: 24990,
      lastFundingRate: 0.0001,
    });
    expect(
      mapper.fundingRate({ symbol: 'BTCUSDT', fundingRate: '-0.0003', fundingTime: 222 }),
    ).toMatchObject({ fundingRate: -0.0003, fundingTime: 222 });
    const bracket = mapper.leverageBracket({
      symbol: 'BTCUSDT',
      brackets: [
        {
          bracket: 1,
          initialLeverage: 125,
          notionalCap: 50000,
          notionalFloor: 0,
          maintMarginRatio: 0.004,
        },
      ],
    });
    expect(bracket.brackets[0]!.initialLeverage).toBe(125);
  });
});
