import { describe, expect, it } from 'vitest';
import { StorageValidator } from '../src/index';
import { orderBookSnapshot, trade } from './helpers';

const validator = new StorageValidator();

describe('StorageValidator', () => {
  it('accepts a well-formed canonical record', () => {
    expect(validator.validate(trade()).valid).toBe(true);
  });

  it('rejects a record with no instrument id', () => {
    const result = validator.validate(trade({ instrumentId: '' }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('INSTRUMENT_INVALID');
  });

  it('rejects a non-finite timestamp', () => {
    const result = validator.validate(
      trade({ timestamps: { receiveTime: Number.NaN, processingTime: 1 } }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('TIMESTAMP_INVALID');
  });

  it('rejects a negative sequence', () => {
    const bad = trade();
    const result = validator.validate({
      ...bad,
      provenance: { ...bad.provenance, sequence: -5 },
    });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('SEQUENCE_INVALID');
  });

  it('rejects a non-positive price', () => {
    const result = validator.validate(trade({ price: 0 }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('NUMERIC_INVALID');
  });

  it('rejects a malformed order-book level', () => {
    const result = validator.validate(orderBookSnapshot({ bids: [{ price: -1, quantity: 1 }] }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.rejection.code).toBe('NUMERIC_INVALID');
  });
});
