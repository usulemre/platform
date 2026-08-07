/**
 * `MetadataValidator` — deterministic structural validation of exchange metadata. It guards the
 * registry's "single source of truth" guarantee: raw payloads are checked before mapping, and the
 * mapped canonical snapshot is checked for internal consistency (assets present and distinct,
 * precisions non-negative, increments positive, min ≤ max bounds, known statuses). It DECIDES nothing
 * about trading — it only reports whether the metadata is well-formed. Errors are hard (reject);
 * warnings are advisory (e.g. a symbol with no filters). Pure; no IO.
 */
import type { BinanceExchangeInfo } from '../types/binance';
import type { ExchangeMetadata, ExchangeSymbol } from './types';

export interface MetadataValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export class MetadataValidator {
  /** Validate a raw payload is structurally usable before mapping. */
  validateRaw(info: BinanceExchangeInfo | undefined | null): MetadataValidationResult {
    const errors: string[] = [];
    if (!info) errors.push('exchangeInfo payload is missing.');
    else if (!Array.isArray(info.symbols)) errors.push('exchangeInfo.symbols must be an array.');
    else if (info.symbols.length === 0) errors.push('exchangeInfo.symbols is empty.');
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  private validateSymbol(symbol: ExchangeSymbol, errors: string[], warnings: string[]): void {
    const id = symbol.venueSymbol || symbol.symbol || '<unknown>';
    if (!symbol.baseAsset || !symbol.quoteAsset) errors.push(`${id}: missing base/quote asset.`);
    if (symbol.baseAsset && symbol.baseAsset === symbol.quoteAsset)
      errors.push(`${id}: base and quote asset are identical (${symbol.baseAsset}).`);
    if (symbol.status === 'UNKNOWN') warnings.push(`${id}: unrecognized trading status.`);
    const { precision, tradingRule } = symbol;
    if (precision.pricePrecision < 0 || precision.quantityPrecision < 0)
      errors.push(`${id}: negative precision.`);
    if (precision.tickSize !== undefined && precision.tickSize <= 0)
      errors.push(`${id}: non-positive tick size.`);
    if (precision.stepSize !== undefined && precision.stepSize <= 0)
      errors.push(`${id}: non-positive step size.`);
    if (
      tradingRule.minQuantity !== undefined &&
      tradingRule.maxQuantity !== undefined &&
      tradingRule.minQuantity > tradingRule.maxQuantity
    )
      errors.push(`${id}: minQuantity exceeds maxQuantity.`);
    if (
      tradingRule.minPrice !== undefined &&
      tradingRule.maxPrice !== undefined &&
      tradingRule.minPrice > tradingRule.maxPrice
    )
      errors.push(`${id}: minPrice exceeds maxPrice.`);
    if (symbol.filters.length === 0) warnings.push(`${id}: no trading filters declared.`);
  }

  /** Validate a mapped canonical metadata snapshot for internal consistency. */
  validate(metadata: ExchangeMetadata): MetadataValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (metadata.symbols.length === 0) errors.push('metadata has no symbols.');
    const seen = new Set<string>();
    for (const symbol of metadata.symbols) {
      if (seen.has(symbol.venueSymbol)) errors.push(`duplicate symbol ${symbol.venueSymbol}.`);
      seen.add(symbol.venueSymbol);
      this.validateSymbol(symbol, errors, warnings);
    }
    return { valid: errors.length === 0, errors, warnings };
  }
}
