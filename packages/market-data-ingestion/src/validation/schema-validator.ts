/**
 * The **schema validator** — the first gate after intake. It proves an event is *structurally* well
 * formed: the discriminant is a known kind, every required field is present with the right primitive
 * type, and every numeric field is finite (never `NaN`/`Infinity`). It does NOT judge whether the
 * values make economic sense — that is the {@link DataQualityValidator}'s job. Malformed events are
 * rejected here with `SCHEMA_INVALID` / `REQUIRED_FIELD_MISSING`, never silently accepted.
 */
import type { OrderBookLevel, RawMarketDataEvent } from '../events/canonical-events';
import { accepted, rejected, type Validity } from './validation-result';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function requireFinite(obj: Record<string, unknown>, fields: readonly string[]): Validity {
  for (const field of fields) {
    const value = obj[field];
    if (value === undefined || value === null) {
      return rejected('REQUIRED_FIELD_MISSING', `Missing required field '${field}'.`, { field });
    }
    if (!isFiniteNumber(value)) {
      return rejected('SCHEMA_INVALID', `Field '${field}' must be a finite number.`, { field });
    }
  }
  return accepted;
}

function validateLevels(levels: unknown, side: string): Validity {
  if (!Array.isArray(levels)) {
    return rejected('SCHEMA_INVALID', `Order-book '${side}' must be an array.`, { side });
  }
  for (const level of levels as OrderBookLevel[]) {
    if (!level || !isFiniteNumber(level.price) || !isFiniteNumber(level.quantity)) {
      return rejected('SCHEMA_INVALID', `Malformed '${side}' order-book level.`, { side });
    }
  }
  return accepted;
}

export class SchemaValidator {
  /** Validate the structure of a raw event. */
  validate(event: RawMarketDataEvent): Validity {
    if (typeof event.providerSymbol !== 'string' || event.providerSymbol.trim() === '') {
      return rejected('REQUIRED_FIELD_MISSING', "Missing required field 'providerSymbol'.");
    }
    const obj = event as unknown as Record<string, unknown>;
    switch (event.kind) {
      case 'trade':
        return combine(
          requireFinite(obj, ['tradeId', 'price', 'quantity', 'tradeTime']),
          requireBoolean(obj, 'buyerIsMaker'),
        );
      case 'aggTrade':
        return combine(
          requireFinite(obj, [
            'aggregateTradeId',
            'price',
            'quantity',
            'firstTradeId',
            'lastTradeId',
            'tradeTime',
          ]),
          requireBoolean(obj, 'buyerIsMaker'),
        );
      case 'ticker':
        return requireFinite(obj, [
          'lastPrice',
          'openPrice',
          'highPrice',
          'lowPrice',
          'baseVolume',
          'quoteVolume',
        ]);
      case 'bookTicker':
        return requireFinite(obj, [
          'updateId',
          'bidPrice',
          'bidQuantity',
          'askPrice',
          'askQuantity',
        ]);
      case 'orderBookSnapshot':
        return combine(
          requireFinite(obj, ['lastUpdateId']),
          validateLevels(obj.bids, 'bids'),
          validateLevels(obj.asks, 'asks'),
        );
      case 'orderBookDelta':
        return combine(
          requireFinite(obj, ['firstUpdateId', 'finalUpdateId']),
          validateLevels(obj.bids, 'bids'),
          validateLevels(obj.asks, 'asks'),
        );
      case 'candlestick':
        return combine(
          typeof event.interval === 'string' && event.interval.length > 0
            ? accepted
            : rejected('REQUIRED_FIELD_MISSING', "Missing required field 'interval'."),
          requireFinite(obj, [
            'openTime',
            'closeTime',
            'open',
            'high',
            'low',
            'close',
            'baseVolume',
            'quoteVolume',
            'trades',
          ]),
          requireBoolean(obj, 'closed'),
        );
      case 'markPrice':
        return requireFinite(obj, ['markPrice']);
      case 'avgPrice':
        return requireFinite(obj, ['intervalMinutes', 'averagePrice', 'lastTradeTime']);
    }
  }
}

function requireBoolean(obj: Record<string, unknown>, field: string): Validity {
  return typeof obj[field] === 'boolean'
    ? accepted
    : rejected('SCHEMA_INVALID', `Field '${field}' must be a boolean.`, { field });
}

/** Fold several validity checks, returning the first rejection (or accepted). */
function combine(...results: readonly Validity[]): Validity {
  for (const result of results) {
    if (!result.valid) return result;
  }
  return accepted;
}
