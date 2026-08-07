/**
 * `BinanceSymbolMapper` — the canonical ⇄ Binance symbol translation. Canonical symbols are written
 * `BASE-QUOTE` (asset-agnostic, human-legible); Binance uses the concatenated `BASEQUOTE`. Splitting a
 * concatenated symbol back into base/quote is ambiguous without the exchange metadata, so
 * {@link toCanonicalSymbol} consults a `BinanceSymbolInfo` when available. Pure and deterministic.
 */
import { num } from './parse';
import type { BinanceMarket } from '../constants';
import type { BinanceSymbolFilter, BinanceSymbolInfo } from '../types/binance';
import type { AssetClass, CanonicalSymbol } from '../types/canonical';

function filter(filters: readonly BinanceSymbolFilter[] | undefined, type: string) {
  return filters?.find((f) => f.filterType === type);
}

function precisionFromStep(step: number | undefined): number | undefined {
  if (!step || step <= 0) return undefined;
  const text = step.toFixed(12).replace(/0+$/, '');
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

export class BinanceSymbolMapper {
  constructor(private readonly market: BinanceMarket) {}

  /** Canonical `BASE-QUOTE` → Binance `BASEQUOTE` (separators stripped, upper-cased). */
  toBinance(canonicalSymbol: string): string {
    return canonicalSymbol.replace(/[-/_]/g, '').toUpperCase();
  }

  /** Format a canonical symbol name from a known base/quote pair. */
  canonicalName(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset.toUpperCase()}-${quoteAsset.toUpperCase()}`;
  }

  /** Best-effort canonical name for a Binance symbol, using metadata when available. */
  toCanonicalSymbol(binanceSymbol: string, info?: BinanceSymbolInfo): string {
    if (info) return this.canonicalName(info.baseAsset, info.quoteAsset);
    return binanceSymbol.toUpperCase();
  }

  private assetClass(info: BinanceSymbolInfo): AssetClass {
    if (this.market === 'SPOT') return 'CRYPTO';
    return info.contractType && info.contractType !== 'PERPETUAL' ? 'FUTURE' : 'CRYPTO_PERP';
  }

  /** Full Binance instrument → canonical symbol definition (with lot/price/notional constraints). */
  toCanonical(info: BinanceSymbolInfo): CanonicalSymbol {
    const priceFilter = filter(info.filters, 'PRICE_FILTER');
    const lotFilter = filter(info.filters, 'LOT_SIZE');
    const notionalFilter = filter(info.filters, 'MIN_NOTIONAL') ?? filter(info.filters, 'NOTIONAL');
    const tickSize = priceFilter?.tickSize ? num(priceFilter.tickSize) : undefined;
    const stepSize = lotFilter?.stepSize ? num(lotFilter.stepSize) : undefined;
    const minNotional =
      (notionalFilter?.minNotional ?? notionalFilter?.notional)
        ? num(notionalFilter?.minNotional ?? notionalFilter?.notional)
        : undefined;

    return {
      symbol: this.canonicalName(info.baseAsset, info.quoteAsset),
      baseAsset: info.baseAsset.toUpperCase(),
      quoteAsset: info.quoteAsset.toUpperCase(),
      assetClass: this.assetClass(info),
      status: info.status,
      pricePrecision: info.pricePrecision ?? precisionFromStep(tickSize) ?? 8,
      quantityPrecision: info.quantityPrecision ?? precisionFromStep(stepSize) ?? 8,
      tickSize,
      stepSize,
      minNotional,
    };
  }
}
