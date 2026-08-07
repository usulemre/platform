/**
 * `BinanceExchangeInfoCache` — an in-memory, TTL-bounded cache of Binance `exchangeInfo`. It is the
 * authoritative source of instrument metadata (base/quote assets, tick/lot/notional filters) the
 * symbol and order mappers consult. The clock is INJECTED so freshness is deterministic; the fetch is
 * passed per call so the cache has no dependency on the REST client. Immutable snapshots — a refresh
 * replaces the snapshot wholesale rather than mutating it.
 */
import type { BinanceExchangeInfo, BinanceSymbolInfo } from './types/binance';

interface Snapshot {
  readonly info: BinanceExchangeInfo;
  readonly bySymbol: ReadonlyMap<string, BinanceSymbolInfo>;
  readonly at: number;
}

export type ExchangeInfoFetcher = () => Promise<BinanceExchangeInfo>;

export interface BinanceExchangeInfoCacheDeps {
  readonly clock: () => number;
  readonly ttlMs: number;
}

export class BinanceExchangeInfoCache {
  private snapshot?: Snapshot;
  private readonly clock: () => number;
  private readonly ttlMs: number;

  constructor(deps: BinanceExchangeInfoCacheDeps) {
    this.clock = deps.clock;
    this.ttlMs = deps.ttlMs;
  }

  /** Whether a non-stale snapshot is loaded. */
  isFresh(): boolean {
    return this.snapshot !== undefined && this.clock() - this.snapshot.at < this.ttlMs;
  }

  /** Replace the cached snapshot from a raw exchangeInfo payload. */
  set(info: BinanceExchangeInfo): void {
    const bySymbol = new Map<string, BinanceSymbolInfo>();
    for (const symbol of info.symbols) bySymbol.set(symbol.symbol.toUpperCase(), symbol);
    this.snapshot = { info, bySymbol, at: this.clock() };
  }

  /** Refresh the snapshot only when stale/absent. */
  async ensure(fetch: ExchangeInfoFetcher): Promise<void> {
    if (!this.isFresh()) this.set(await fetch());
  }

  /** Look up a single instrument by its Binance symbol (case-insensitive). */
  get(binanceSymbol: string): BinanceSymbolInfo | undefined {
    return this.snapshot?.bySymbol.get(binanceSymbol.toUpperCase());
  }

  /** All cached instruments (empty when nothing is loaded). */
  all(): readonly BinanceSymbolInfo[] {
    return this.snapshot?.info.symbols ?? [];
  }

  /** Number of cached instruments. */
  get size(): number {
    return this.snapshot?.bySymbol.size ?? 0;
  }
}
