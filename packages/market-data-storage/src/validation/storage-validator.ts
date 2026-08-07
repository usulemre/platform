/**
 * The **storage validator** — the last gate before persistence. It does NOT re-run market-data
 * quality checks (that is the ingestion pipeline's job); it proves a canonical record is *compatible
 * with the storage schema* and has everything the storage layer needs to store, index, and later
 * reconstruct it: a resolved instrument id, a canonical market-data type, finite/consistent
 * timestamps, a non-negative sequence where the kind carries one, finite numeric payload fields, and
 * a resolvable identity. Records that fail are rejected here and quarantined — corrupt market data is
 * never silently persisted.
 */
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import type { StorageErrorCode } from '../errors';
import { primaryTimestamp, recordIdentity } from '../identity';

export interface StorageRejection {
  readonly code: StorageErrorCode;
  readonly message: string;
  readonly detail?: Readonly<Record<string, string | number | boolean>>;
}

export type StorageValidity =
  | { readonly valid: true }
  | { readonly valid: false; readonly rejection: StorageRejection };

const OK: StorageValidity = { valid: true };

function reject(
  code: StorageErrorCode,
  message: string,
  detail?: Readonly<Record<string, string | number | boolean>>,
): StorageValidity {
  return { valid: false, rejection: detail ? { code, message, detail } : { code, message } };
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export class StorageValidator {
  validate(record: NormalizedMarketDataRecord): StorageValidity {
    if (typeof record.instrumentId !== 'string' || record.instrumentId.trim() === '') {
      return reject('INSTRUMENT_INVALID', 'Record has no canonical instrument id.');
    }
    if (!record.marketDataType) {
      return reject('SCHEMA_INCOMPATIBLE', 'Record has no canonical market-data type.');
    }

    const ts = record.timestamps;
    if (!Number.isFinite(ts.receiveTime) || !Number.isFinite(ts.processingTime)) {
      return reject('TIMESTAMP_INVALID', 'Record is missing a finite receive/processing time.');
    }
    if (ts.eventTime !== undefined && !Number.isFinite(ts.eventTime)) {
      return reject('TIMESTAMP_INVALID', 'Record event time is not finite.');
    }
    if (ts.exchangeTime !== undefined && !Number.isFinite(ts.exchangeTime)) {
      return reject('TIMESTAMP_INVALID', 'Record exchange time is not finite.');
    }
    if (!Number.isFinite(primaryTimestamp(ts))) {
      return reject('TIMESTAMP_INVALID', 'Record has no usable primary timestamp.');
    }

    const seq = record.provenance.sequence;
    if (seq !== undefined && (!Number.isInteger(seq) || seq < 0)) {
      return reject('SEQUENCE_INVALID', 'Record sequence must be a non-negative integer.', { seq });
    }

    const numeric = this.checkNumeric(record);
    if (!numeric.valid) return numeric;

    // Identity must be resolvable for idempotency to be safe.
    try {
      const id = recordIdentity(record);
      if (!id) return reject('IDENTITY_UNRESOLVABLE', 'Record identity could not be resolved.');
    } catch {
      return reject('IDENTITY_UNRESOLVABLE', 'Record identity could not be resolved.');
    }

    return OK;
  }

  private checkNumeric(record: NormalizedMarketDataRecord): StorageValidity {
    switch (record.kind) {
      case 'trade':
      case 'aggTrade':
        return isFinitePositive(record.price) && Number.isFinite(record.quantity)
          ? OK
          : reject('NUMERIC_INVALID', 'Trade price/quantity is invalid for storage.');
      case 'bookTicker':
        return isFinitePositive(record.bidPrice) && isFinitePositive(record.askPrice)
          ? OK
          : reject('NUMERIC_INVALID', 'Book-ticker prices are invalid for storage.');
      case 'candlestick':
        return [record.open, record.high, record.low, record.close].every(isFinitePositive)
          ? OK
          : reject('NUMERIC_INVALID', 'Candlestick OHLC is invalid for storage.');
      case 'markPrice':
        return isFinitePositive(record.markPrice)
          ? OK
          : reject('NUMERIC_INVALID', 'Mark price is invalid for storage.');
      case 'avgPrice':
        return isFinitePositive(record.averagePrice)
          ? OK
          : reject('NUMERIC_INVALID', 'Average price is invalid for storage.');
      case 'ticker':
        return isFinitePositive(record.lastPrice)
          ? OK
          : reject('NUMERIC_INVALID', 'Ticker last price is invalid for storage.');
      case 'orderBookSnapshot':
      case 'orderBookDelta':
        return this.checkBookLevels(record);
    }
  }

  private checkBookLevels(
    record: Extract<NormalizedMarketDataRecord, { kind: 'orderBookSnapshot' | 'orderBookDelta' }>,
  ): StorageValidity {
    for (const level of [...record.bids, ...record.asks]) {
      if (
        !isFinitePositive(level.price) ||
        !Number.isFinite(level.quantity) ||
        level.quantity < 0
      ) {
        return reject('NUMERIC_INVALID', 'Order-book level is invalid for storage.');
      }
    }
    return OK;
  }
}
