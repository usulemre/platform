import { describe, expect, it } from 'vitest';
import { BinanceOrderValidator } from '../../src/orders/validator';
import { BinanceOrderCapabilities } from '../../src/orders/capabilities';
import { BinanceOrderUnsupportedError, BinanceOrderValidationError } from '../../src/orders/errors';
import type { ExchangeSymbol } from '../../src/metadata/types';
import type { CanonicalOrderRequest } from '../../src/orders/canonical';

const spotValidator = new BinanceOrderValidator(new BinanceOrderCapabilities('SPOT'));
const futuresValidator = new BinanceOrderValidator(new BinanceOrderCapabilities('FUTURES'));

function limit(overrides: Partial<CanonicalOrderRequest> = {}): CanonicalOrderRequest {
  return {
    symbol: 'BTC-USDT',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 1,
    price: 25000,
    ...overrides,
  };
}

const SYMBOL: ExchangeSymbol = {
  symbol: 'BTC-USDT',
  venueSymbol: 'BTCUSDT',
  market: 'SPOT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  status: 'TRADING',
  assetClass: 'CRYPTO',
  precision: {
    pricePrecision: 2,
    quantityPrecision: 3,
    baseAssetPrecision: 8,
    quoteAssetPrecision: 8,
    tickSize: 0.01,
    stepSize: 0.001,
  },
  filters: [],
  tradingRule: {
    minQuantity: 0.001,
    maxQuantity: 1000,
    stepSize: 0.001,
    tickSize: 0.01,
    minNotional: 10,
  },
  capability: {
    spotTradingAllowed: true,
    marginTradingAllowed: false,
    permissions: ['SPOT'],
    orderTypes: [],
  },
};

describe('BinanceOrderValidator', () => {
  it('accepts a valid LIMIT request', () => {
    expect(() => spotValidator.validateRequest(limit())).not.toThrow();
  });

  it('requires a price for LIMIT and a stopPrice for STOP', () => {
    expect(() => spotValidator.validateRequest(limit({ price: undefined }))).toThrow(
      BinanceOrderValidationError,
    );
    expect(() =>
      spotValidator.validateRequest({
        symbol: 'BTC-USDT',
        side: 'SELL',
        type: 'STOP',
        quantity: 1,
      }),
    ).toThrow(BinanceOrderValidationError);
  });

  it('rejects a non-positive quantity', () => {
    expect(() => spotValidator.validateRequest(limit({ quantity: 0 }))).toThrow(
      /quantity must be positive/,
    );
  });

  it('rejects unsupported features per market', () => {
    // quoteQuantity is Spot-only.
    expect(() =>
      futuresValidator.validateRequest({
        symbol: 'BTC-USDT',
        side: 'BUY',
        type: 'MARKET',
        quantity: 0,
        quoteQuantity: 500,
      }),
    ).toThrow(BinanceOrderUnsupportedError);
    // reduceOnly is Futures-only.
    expect(() => spotValidator.validateRequest(limit({ reduceOnly: true }))).toThrow(
      BinanceOrderUnsupportedError,
    );
  });

  it('enforces instrument trading rules when metadata is provided', () => {
    expect(() => spotValidator.validateRequest(limit({ quantity: 0.0005 }), SYMBOL)).toThrow(
      /below minQty/,
    );
    expect(() => spotValidator.validateRequest(limit({ price: 25000.005 }), SYMBOL)).toThrow(
      /tickSize/,
    );
    expect(() =>
      spotValidator.validateRequest(limit({ quantity: 0.001, price: 1 }), SYMBOL),
    ).toThrow(/minNotional/);
    expect(() =>
      spotValidator.validateRequest(limit({ quantity: 1, price: 25000 }), SYMBOL),
    ).not.toThrow();
  });

  it('validates the raw response shape', () => {
    expect(() =>
      spotValidator.validateResponse({ orderId: 1, symbol: 'BTCUSDT', status: 'NEW' }),
    ).not.toThrow();
    expect(() => spotValidator.validateResponse({ symbol: 'BTCUSDT' })).toThrow(/orderId/);
    expect(() => spotValidator.validateResponse(null)).toThrow(/not an object/);
  });
});
