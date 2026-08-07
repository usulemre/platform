import { describe, expect, it } from 'vitest';
import { DataQualityValidator, SchemaValidator } from '../src/index';
import { T0, bookTicker, candlestick, orderBookSnapshot, ticker, trade } from './helpers';

describe('SchemaValidator', () => {
  const schema = new SchemaValidator();

  it('accepts a well-formed trade', () => {
    expect(schema.validate(trade()).valid).toBe(true);
  });

  it('rejects a missing required field', () => {
    const bad = trade();
    // Force a missing numeric field.
    const result = schema.validate({ ...bad, price: undefined as unknown as number });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('REQUIRED_FIELD_MISSING');
  });

  it('rejects a non-finite numeric field (NaN)', () => {
    const result = schema.validate(trade({ price: Number.NaN }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('SCHEMA_INVALID');
  });

  it('rejects an empty provider symbol', () => {
    const result = schema.validate(trade({ providerSymbol: '   ' }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('REQUIRED_FIELD_MISSING');
  });

  it('rejects a candlestick with no interval', () => {
    const result = schema.validate(candlestick({ interval: '' }));
    expect(result.valid).toBe(false);
  });

  it('rejects a malformed order-book level', () => {
    const result = schema.validate(
      orderBookSnapshot({ bids: [{ price: Number.NaN, quantity: 1 }] }),
    );
    expect(result.valid).toBe(false);
  });
});

describe('DataQualityValidator', () => {
  const quality = new DataQualityValidator();

  it('accepts a healthy trade', () => {
    expect(quality.validate(trade(), T0).valid).toBe(true);
  });

  it('rejects a non-positive price', () => {
    const result = quality.validate(trade({ price: 0 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('PRICE_INVALID');
  });

  it('rejects a non-positive quantity', () => {
    const result = quality.validate(trade({ quantity: -1 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('QUANTITY_INVALID');
  });

  it('rejects an implausible (too-old-epoch) timestamp', () => {
    const result = quality.validate(trade({ tradeTime: 1000, eventTime: 1000 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('TIMESTAMP_INVALID');
  });

  it('rejects a timestamp too far in the future', () => {
    const result = quality.validate(trade({ eventTime: T0 + 10 * 60_000 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('TIMESTAMP_INVALID');
  });

  it('rejects a crossed book ticker (bid > ask)', () => {
    const result = quality.validate(bookTicker({ bidPrice: 50_020, askPrice: 50_010 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('IMPOSSIBLE_STATE');
  });

  it('rejects a crossed order-book snapshot', () => {
    const result = quality.validate(
      orderBookSnapshot({
        bids: [{ price: 50_020, quantity: 1 }],
        asks: [{ price: 50_010, quantity: 1 }],
      }),
      T0,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('IMPOSSIBLE_STATE');
  });

  it('rejects a ticker whose high is below its low', () => {
    const result = quality.validate(ticker({ highPrice: 40_000, lowPrice: 50_000 }), T0);
    expect(result.valid).toBe(false);
  });

  it('rejects a candlestick whose high/low do not bound open/close', () => {
    const result = quality.validate(candlestick({ high: 49_950 }), T0);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('IMPOSSIBLE_STATE');
  });
});
