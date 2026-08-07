/**
 * `PrecisionMapper` — derives the canonical {@link PrecisionRule} for an instrument from its declared
 * precisions and its price/lot filters. Binance sometimes states precision explicitly
 * (`pricePrecision`/`quantityPrecision`, common on Futures) and sometimes only implies it via the
 * `tickSize`/`stepSize` filters (common on Spot); this mapper prefers explicit values and falls back to
 * deriving precision from the filter increments. Pure and deterministic.
 */
import { num } from '../mappers/parse';
import type { BinanceSymbolFilter, BinanceSymbolInfo } from '../types/binance';
import type { PrecisionRule } from './types';

function filter(filters: readonly BinanceSymbolFilter[] | undefined, type: string) {
  return filters?.find((f) => f.filterType === type);
}

/** Number of decimal places implied by a Binance increment string (e.g. `0.001` → 3). */
export function precisionFromIncrement(increment: number | undefined): number | undefined {
  if (increment === undefined || increment <= 0) return undefined;
  const text = increment.toFixed(12).replace(/0+$/, '');
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

export class PrecisionMapper {
  toCanonical(info: BinanceSymbolInfo): PrecisionRule {
    const priceFilter = filter(info.filters, 'PRICE_FILTER');
    const lotFilter = filter(info.filters, 'LOT_SIZE');
    const tickSize = priceFilter?.tickSize ? num(priceFilter.tickSize) : undefined;
    const stepSize = lotFilter?.stepSize ? num(lotFilter.stepSize) : undefined;

    return {
      pricePrecision: info.pricePrecision ?? precisionFromIncrement(tickSize) ?? 8,
      quantityPrecision: info.quantityPrecision ?? precisionFromIncrement(stepSize) ?? 8,
      baseAssetPrecision: info.baseAssetPrecision ?? info.quantityPrecision ?? 8,
      quoteAssetPrecision: info.quoteAssetPrecision ?? info.quotePrecision ?? 8,
      tickSize,
      stepSize,
    };
  }
}
