/**
 * `SymbolRegistry` — the immutable, indexed lookup over an exchange's canonical symbols. Built once
 * from a metadata snapshot, it answers by canonical name (`BTC-USDT`) or venue name (`BTCUSDT`),
 * case-insensitively, and offers the common filtered views (trading-only, by base/quote asset). It is
 * a read model: it never fetches and never mutates after construction, so concurrent readers always
 * observe a consistent set (thread-safe by immutability).
 */
import type { ExchangeSymbol, TradingStatus } from './types';

export class SymbolRegistry {
  private readonly byCanonical: ReadonlyMap<string, ExchangeSymbol>;
  private readonly byVenue: ReadonlyMap<string, ExchangeSymbol>;
  private readonly symbols: readonly ExchangeSymbol[];

  constructor(symbols: readonly ExchangeSymbol[]) {
    const byCanonical = new Map<string, ExchangeSymbol>();
    const byVenue = new Map<string, ExchangeSymbol>();
    for (const symbol of symbols) {
      byCanonical.set(symbol.symbol.toUpperCase(), symbol);
      byVenue.set(symbol.venueSymbol.toUpperCase(), symbol);
    }
    this.symbols = symbols;
    this.byCanonical = byCanonical;
    this.byVenue = byVenue;
  }

  /** Resolve a symbol by canonical or venue name (case-insensitive). */
  get(symbol: string): ExchangeSymbol | undefined {
    const key = symbol.toUpperCase();
    return this.byCanonical.get(key) ?? this.byVenue.get(key.replace(/[-/_]/g, ''));
  }

  has(symbol: string): boolean {
    return this.get(symbol) !== undefined;
  }

  /** All symbols (insertion order preserved). */
  all(): readonly ExchangeSymbol[] {
    return this.symbols;
  }

  get size(): number {
    return this.symbols.length;
  }

  /** Symbols with a given canonical status. */
  byStatus(status: TradingStatus): readonly ExchangeSymbol[] {
    return this.symbols.filter((s) => s.status === status);
  }

  /** Only actively-trading symbols. */
  trading(): readonly ExchangeSymbol[] {
    return this.byStatus('TRADING');
  }

  /** Symbols whose base asset matches (case-insensitive). */
  byBaseAsset(asset: string): readonly ExchangeSymbol[] {
    const key = asset.toUpperCase();
    return this.symbols.filter((s) => s.baseAsset === key);
  }

  /** Symbols whose quote asset matches (case-insensitive). */
  byQuoteAsset(asset: string): readonly ExchangeSymbol[] {
    const key = asset.toUpperCase();
    return this.symbols.filter((s) => s.quoteAsset === key);
  }
}
