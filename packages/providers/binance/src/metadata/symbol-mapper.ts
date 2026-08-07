/**
 * `ExchangeSymbolMapper` — the metadata symbol mapper: a raw Binance instrument
 * ({@link BinanceSymbolInfo}) → the fully-resolved canonical {@link ExchangeSymbol}. It composes the
 * filter, precision and trading-rule mappers and adds status, asset-class and capability translation.
 * (Distinct from the trading `BinanceSymbolMapper`, which only does name ⇄ name / lightweight symbol
 * translation for the order path; this one produces the rich registry model.) Pure and deterministic.
 */
import { FilterMapper } from './filter-mapper';
import { PrecisionMapper } from './precision-mapper';
import { TradingRuleMapper } from './trading-rule-mapper';
import type { BinanceMarket } from '../constants';
import type { BinanceSymbolInfo } from '../types/binance';
import type { AssetClass } from '../types/canonical';
import type { ExchangeCapability, ExchangeSymbol, TradingPair, TradingStatus } from './types';

const STATUS: Readonly<Record<string, TradingStatus>> = {
  PRE_TRADING: 'PRE_TRADING',
  TRADING: 'TRADING',
  POST_TRADING: 'POST_TRADING',
  END_OF_DAY: 'END_OF_DAY',
  HALT: 'HALT',
  AUCTION_MATCH: 'AUCTION_MATCH',
  BREAK: 'BREAK',
  PENDING_TRADING: 'PENDING_TRADING',
  SETTLING: 'SETTLING',
  DELISTED: 'DELISTED',
  CLOSE: 'DELISTED',
};

export class ExchangeSymbolMapper {
  private readonly filters = new FilterMapper();
  private readonly precision = new PrecisionMapper();
  private readonly rules = new TradingRuleMapper();

  constructor(private readonly market: BinanceMarket) {}

  /** Canonical `BASE-QUOTE` name for a base/quote pair. */
  canonicalName(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset.toUpperCase()}-${quoteAsset.toUpperCase()}`;
  }

  status(status: string): TradingStatus {
    return STATUS[status.toUpperCase()] ?? 'UNKNOWN';
  }

  private assetClass(info: BinanceSymbolInfo): AssetClass {
    if (this.market === 'SPOT') return 'CRYPTO';
    return info.contractType && info.contractType !== 'PERPETUAL' ? 'FUTURE' : 'CRYPTO_PERP';
  }

  private capability(info: BinanceSymbolInfo): ExchangeCapability {
    const permissions = new Set<string>(info.permissions ?? []);
    for (const set of info.permissionSets ?? []) for (const p of set) permissions.add(p);
    const spot = info.isSpotTradingAllowed ?? (this.market === 'SPOT' && permissions.has('SPOT'));
    const margin = info.isMarginTradingAllowed ?? permissions.has('MARGIN');
    return {
      spotTradingAllowed: Boolean(spot),
      marginTradingAllowed: Boolean(margin),
      permissions: [...permissions],
      orderTypes: [...(info.orderTypes ?? [])],
    };
  }

  /** Full raw instrument → canonical exchange symbol. */
  toCanonical(info: BinanceSymbolInfo): ExchangeSymbol {
    const filters = this.filters.toCanonicalMany(info.filters);
    return {
      symbol: this.canonicalName(info.baseAsset, info.quoteAsset),
      venueSymbol: info.symbol.toUpperCase(),
      market: this.market,
      baseAsset: info.baseAsset.toUpperCase(),
      quoteAsset: info.quoteAsset.toUpperCase(),
      status: this.status(info.status),
      assetClass: this.assetClass(info),
      contractType: info.contractType,
      precision: this.precision.toCanonical(info),
      filters,
      tradingRule: this.rules.toCanonical(filters),
      capability: this.capability(info),
    };
  }

  /** The canonical trading pair for an exchange symbol. */
  toTradingPair(symbol: ExchangeSymbol): TradingPair {
    return {
      symbol: symbol.symbol,
      venueSymbol: symbol.venueSymbol,
      baseAsset: symbol.baseAsset,
      quoteAsset: symbol.quoteAsset,
    };
  }
}
