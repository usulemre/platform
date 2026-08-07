import { describe, expect, it } from 'vitest';
import { FilterMapper } from '../../src/metadata/filter-mapper';
import { PrecisionMapper, precisionFromIncrement } from '../../src/metadata/precision-mapper';
import { TradingRuleMapper } from '../../src/metadata/trading-rule-mapper';
import { ExchangeSymbolMapper } from '../../src/metadata/symbol-mapper';
import { ExchangeMetadataMapper } from '../../src/metadata/metadata-mapper';
import { SPOT_EXCHANGE_INFO, FUTURES_EXCHANGE_INFO } from './fixtures';

const BTC = SPOT_EXCHANGE_INFO.symbols[0]!;

describe('FilterMapper', () => {
  const mapper = new FilterMapper();

  it('classifies filter types and parses numeric params', () => {
    const filters = mapper.toCanonicalMany(BTC.filters);
    const price = filters.find((f) => f.type === 'PRICE')!;
    expect(price.venueType).toBe('PRICE_FILTER');
    expect(price.params).toMatchObject({ minPrice: 0.01, maxPrice: 1000000, tickSize: 0.01 });
    expect(filters.find((f) => f.type === 'MAX_NUM_ORDERS')!.params['maxNumOrders']).toBe(200);
  });

  it('normalizes NOTIONAL onto minNotional', () => {
    const eth = SPOT_EXCHANGE_INFO.symbols[1]!;
    const notional = mapper.toCanonicalMany(eth.filters).find((f) => f.type === 'MIN_NOTIONAL')!;
    expect(notional.params['minNotional']).toBe(0.0001);
  });

  it('marks unknown filter types', () => {
    expect(mapper.classify('SOMETHING_NEW')).toBe('UNKNOWN');
  });
});

describe('PrecisionMapper', () => {
  it('derives spot precision from tick/step increments', () => {
    const precision = new PrecisionMapper().toCanonical(BTC);
    expect(precision).toMatchObject({ pricePrecision: 2, quantityPrecision: 5, tickSize: 0.01 });
  });

  it('prefers explicit futures precision', () => {
    const precision = new PrecisionMapper().toCanonical(FUTURES_EXCHANGE_INFO.symbols[0]!);
    expect(precision.pricePrecision).toBe(2);
    expect(precision.quantityPrecision).toBe(3);
  });

  it('computes decimal places from an increment', () => {
    expect(precisionFromIncrement(0.001)).toBe(3);
    expect(precisionFromIncrement(1)).toBe(0);
    expect(precisionFromIncrement(undefined)).toBeUndefined();
  });
});

describe('TradingRuleMapper', () => {
  it('distils filters into an actionable trading rule', () => {
    const filters = new FilterMapper().toCanonicalMany(BTC.filters);
    const rule = new TradingRuleMapper().toCanonical(filters);
    expect(rule).toMatchObject({
      minPrice: 0.01,
      maxPrice: 1000000,
      tickSize: 0.01,
      minQuantity: 0.00001,
      maxQuantity: 9000,
      stepSize: 0.00001,
      minNotional: 10,
      maxNumOrders: 200,
    });
  });
});

describe('ExchangeSymbolMapper', () => {
  it('maps a spot instrument into a canonical exchange symbol', () => {
    const symbol = new ExchangeSymbolMapper('SPOT').toCanonical(BTC);
    expect(symbol).toMatchObject({
      symbol: 'BTC-USDT',
      venueSymbol: 'BTCUSDT',
      market: 'SPOT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      status: 'TRADING',
      assetClass: 'CRYPTO',
    });
    expect(symbol.capability).toMatchObject({
      spotTradingAllowed: true,
      marginTradingAllowed: true,
    });
    expect(symbol.capability.permissions).toContain('MARGIN');
    expect(symbol.capability.orderTypes).toContain('STOP_LOSS_LIMIT');
  });

  it('classifies futures perpetuals and maps halted status', () => {
    expect(
      new ExchangeSymbolMapper('FUTURES').toCanonical(FUTURES_EXCHANGE_INFO.symbols[0]!).assetClass,
    ).toBe('CRYPTO_PERP');
    expect(
      new ExchangeSymbolMapper('SPOT').toCanonical(SPOT_EXCHANGE_INFO.symbols[2]!).status,
    ).toBe('HALT');
  });
});

describe('ExchangeMetadataMapper', () => {
  it('maps the full exchangeInfo snapshot including rate limits', () => {
    const metadata = new ExchangeMetadataMapper('SPOT').toCanonical(
      SPOT_EXCHANGE_INFO,
      '1970-01-01T00:00:00.000Z',
    );
    expect(metadata.market).toBe('SPOT');
    expect(metadata.timezone).toBe('UTC');
    expect(metadata.serverTime).toBe(1_700_000_000_000);
    expect(metadata.symbols).toHaveLength(3);
    expect(metadata.rateLimits[0]).toMatchObject({
      type: 'REQUEST_WEIGHT',
      intervalUnit: 'MINUTE',
      intervalNum: 1,
      limit: 1200,
    });
    expect(metadata.fetchedAt).toBe('1970-01-01T00:00:00.000Z');
  });
});
