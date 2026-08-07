/**
 * `FilterMapper` — raw Binance symbol filters → canonical {@link ExchangeFilter}s. Binance expresses
 * trading constraints as a heterogeneous `filters` array keyed by `filterType`; this mapper classifies
 * each into a canonical {@link ExchangeFilterType} and parses its numeric parameters (strings → numbers)
 * while preserving the raw venue type for provenance. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import type { BinanceSymbolFilter } from '../types/binance';
import type { ExchangeFilter, ExchangeFilterType } from './types';

const FILTER_TYPE: Readonly<Record<string, ExchangeFilterType>> = {
  PRICE_FILTER: 'PRICE',
  PERCENT_PRICE: 'PERCENT_PRICE',
  PERCENT_PRICE_BY_SIDE: 'PERCENT_PRICE',
  LOT_SIZE: 'LOT_SIZE',
  MARKET_LOT_SIZE: 'MARKET_LOT_SIZE',
  MIN_NOTIONAL: 'MIN_NOTIONAL',
  NOTIONAL: 'MIN_NOTIONAL',
  MAX_NUM_ORDERS: 'MAX_NUM_ORDERS',
  MAX_NUM_ALGO_ORDERS: 'MAX_NUM_ALGO_ORDERS',
  ICEBERG_PARTS: 'ICEBERG_PARTS',
  TRAILING_DELTA: 'TRAILING_DELTA',
};

/** The numeric-bearing fields a filter may carry (parsed when present). */
const NUMERIC_FIELDS: readonly (keyof BinanceSymbolFilter)[] = [
  'tickSize',
  'stepSize',
  'minPrice',
  'maxPrice',
  'minQty',
  'maxQty',
  'minNotional',
  'maxNotional',
  'notional',
  'limit',
  'maxNumOrders',
  'maxNumAlgoOrders',
  'multiplierUp',
  'multiplierDown',
  'avgPriceMins',
];

export class FilterMapper {
  /** Classify a Binance filter type into its canonical family. */
  classify(venueType: string): ExchangeFilterType {
    return FILTER_TYPE[venueType] ?? 'UNKNOWN';
  }

  /** Map one raw filter to a canonical {@link ExchangeFilter}. */
  toCanonical(filter: BinanceSymbolFilter): ExchangeFilter {
    const params: Record<string, number> = {};
    for (const field of NUMERIC_FIELDS) {
      const value = filter[field];
      if (value !== undefined) params[field] = num(value as string | number);
    }
    // NOTIONAL exposes `notional` as its minimum; normalize onto `minNotional`.
    if (params['notional'] !== undefined && params['minNotional'] === undefined)
      params['minNotional'] = params['notional'];
    return { type: this.classify(filter.filterType), venueType: filter.filterType, params };
  }

  /** Map a symbol's full filter set. */
  toCanonicalMany(filters: readonly BinanceSymbolFilter[] | undefined): readonly ExchangeFilter[] {
    return (filters ?? []).map((f) => this.toCanonical(f));
  }
}
