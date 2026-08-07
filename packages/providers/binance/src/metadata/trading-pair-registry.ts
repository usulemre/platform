/**
 * `TradingPairRegistry` — the immutable index of canonical {@link TradingPair}s derived from a metadata
 * snapshot. It answers by canonical/venue name and groups pairs by base and quote asset. A read model:
 * built once, never mutated (thread-safe by immutability).
 */
import type { ExchangeSymbol, TradingPair } from './types';

export class TradingPairRegistry {
  private readonly pairs: readonly TradingPair[];
  private readonly byName: ReadonlyMap<string, TradingPair>;
  private readonly byBase: ReadonlyMap<string, readonly TradingPair[]>;
  private readonly byQuote: ReadonlyMap<string, readonly TradingPair[]>;

  constructor(symbols: readonly ExchangeSymbol[]) {
    const pairs: TradingPair[] = symbols.map((s) => ({
      symbol: s.symbol,
      venueSymbol: s.venueSymbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
    }));
    const byName = new Map<string, TradingPair>();
    const byBase = new Map<string, TradingPair[]>();
    const byQuote = new Map<string, TradingPair[]>();
    for (const pair of pairs) {
      byName.set(pair.symbol.toUpperCase(), pair);
      byName.set(pair.venueSymbol.toUpperCase(), pair);
      (byBase.get(pair.baseAsset) ?? byBase.set(pair.baseAsset, []).get(pair.baseAsset)!).push(
        pair,
      );
      (byQuote.get(pair.quoteAsset) ?? byQuote.set(pair.quoteAsset, []).get(pair.quoteAsset)!).push(
        pair,
      );
    }
    this.pairs = pairs;
    this.byName = byName;
    this.byBase = byBase;
    this.byQuote = byQuote;
  }

  get(symbol: string): TradingPair | undefined {
    return this.byName.get(symbol.toUpperCase());
  }

  has(symbol: string): boolean {
    return this.get(symbol) !== undefined;
  }

  all(): readonly TradingPair[] {
    return this.pairs;
  }

  get size(): number {
    return this.pairs.length;
  }

  /** All pairs with a given base asset. */
  byBaseAsset(asset: string): readonly TradingPair[] {
    return this.byBase.get(asset.toUpperCase()) ?? [];
  }

  /** All pairs with a given quote asset. */
  byQuoteAsset(asset: string): readonly TradingPair[] {
    return this.byQuote.get(asset.toUpperCase()) ?? [];
  }
}
