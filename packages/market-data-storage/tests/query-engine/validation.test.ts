/**
 * Unit tests for the {@link QueryValidator}: it accepts well-formed specs, normalizes axes, and
 * rejects every malformed shape with the correct canonical code — before any storage is touched.
 */
import { describe, expect, it } from 'vitest';
import { QueryValidator, QueryError } from '../../src/index';

const validator = new QueryValidator({ maxLimit: 1000 });

describe('QueryValidator', () => {
  it('resolves defaults (ascending order, merged instruments/types)', () => {
    const resolved = validator.validate({
      instrumentId: 'A',
      instrumentIds: ['A', 'B'],
      marketDataType: 'TRADES',
      marketDataTypes: ['OHLCV'],
    });
    expect(resolved.order).toBe('asc');
    expect([...resolved.instrumentIds].sort()).toEqual(['A', 'B']);
    expect([...resolved.marketDataTypes].sort()).toEqual(['OHLCV', 'TRADES']);
  });

  it('rejects a blank instrument id', () => {
    expect(() => validator.validate({ instrumentId: '  ' })).toThrow(QueryError);
  });

  it('rejects an unsupported market-data type', () => {
    expect(() => validator.validate({ marketDataType: 'BOGUS' as never })).toThrowError(
      /Unsupported market-data type/,
    );
  });

  it('rejects a non-finite time bound', () => {
    expect(() =>
      validator.validate({ timeRange: { from: Number.POSITIVE_INFINITY } }),
    ).toThrowError(/finite/);
  });

  it('rejects an inverted time range', () => {
    expect(() => validator.validate({ timeRange: { from: 10, to: 1 } })).toThrowError(/after/);
  });

  it('rejects a negative or non-integer sequence bound', () => {
    expect(() => validator.validate({ sequenceRange: { from: -1 } })).toThrowError(
      /non-negative integer/,
    );
    expect(() => validator.validate({ sequenceRange: { from: 1.5 } })).toThrowError(
      /non-negative integer/,
    );
  });

  it('rejects an inverted sequence range', () => {
    expect(() => validator.validate({ sequenceRange: { from: 9, to: 2 } })).toThrowError(/after/);
  });

  it('rejects a non-positive or over-max limit', () => {
    expect(() => validator.validate({ limit: 0 })).toThrowError(/positive integer/);
    expect(() => validator.validate({ limit: 5000 })).toThrowError(/maximum/);
  });

  it('reports the correct canonical codes', () => {
    const code = (fn: () => unknown): string => {
      try {
        fn();
      } catch (e) {
        return (e as QueryError).code;
      }
      return 'NONE';
    };
    expect(code(() => validator.validate({ limit: 0 }))).toBe('LIMIT_INVALID');
    expect(code(() => validator.validate({ timeRange: { from: 2, to: 1 } }))).toBe(
      'TIME_RANGE_INVALID',
    );
    expect(code(() => validator.validate({ sequenceRange: { from: 2, to: 1 } }))).toBe(
      'SEQUENCE_RANGE_INVALID',
    );
    expect(code(() => validator.validate({ marketDataType: 'X' as never }))).toBe(
      'UNSUPPORTED_MARKET_DATA_TYPE',
    );
  });
});
