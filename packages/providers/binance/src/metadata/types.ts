/**
 * The canonical **exchange-metadata domain models** — the venue-neutral shapes the Exchange Metadata &
 * Symbol Registry exposes as the single source of truth for Binance instruments. Every model is an
 * immutable, provenance-bearing data shape (asset-agnostic per CP-8): no Binance field names appear
 * here — those are confined to {@link ../types/binance} and translated by the metadata mappers. These
 * models describe *what an instrument is* (assets, status, precision, filters, trading rules,
 * capabilities); they carry no transport, no orders and no market-data streams.
 */
import type { AssetClass } from '../types/canonical';
import type { BinanceMarket } from '../constants';

/** The canonical trading status of an instrument (venue statuses collapse onto these). */
export type TradingStatus =
  | 'PRE_TRADING'
  | 'TRADING'
  | 'POST_TRADING'
  | 'END_OF_DAY'
  | 'HALT'
  | 'AUCTION_MATCH'
  | 'BREAK'
  | 'PENDING_TRADING'
  | 'SETTLING'
  | 'DELISTED'
  | 'UNKNOWN';

/** The canonical filter families (Binance filter types collapse onto these; unknown → `UNKNOWN`). */
export type ExchangeFilterType =
  | 'PRICE'
  | 'PERCENT_PRICE'
  | 'LOT_SIZE'
  | 'MARKET_LOT_SIZE'
  | 'MIN_NOTIONAL'
  | 'MAX_NUM_ORDERS'
  | 'MAX_NUM_ALGO_ORDERS'
  | 'ICEBERG_PARTS'
  | 'TRAILING_DELTA'
  | 'UNKNOWN';

/** A single, canonical exchange filter with its parsed numeric parameters. */
export interface ExchangeFilter {
  readonly type: ExchangeFilterType;
  /** The raw venue filter type (kept for provenance/audit). */
  readonly venueType: string;
  /** Parsed numeric parameters (e.g. `tickSize`, `minQty`, `minNotional`). */
  readonly params: Readonly<Record<string, number>>;
}

/** The canonical precision rule for an instrument. */
export interface PrecisionRule {
  readonly pricePrecision: number;
  readonly quantityPrecision: number;
  readonly baseAssetPrecision: number;
  readonly quoteAssetPrecision: number;
  readonly tickSize?: number;
  readonly stepSize?: number;
}

/** The canonical, actionable trading constraints for an instrument (distilled from its filters). */
export interface TradingRule {
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly tickSize?: number;
  readonly minQuantity?: number;
  readonly maxQuantity?: number;
  readonly stepSize?: number;
  readonly minNotional?: number;
  readonly maxNotional?: number;
  readonly maxNumOrders?: number;
}

/** Canonical metadata for a single asset (a base or quote currency). */
export interface AssetMetadata {
  readonly asset: string;
  readonly precision: number;
  /** Whether the asset is used as a base, quote, or both across the exchange. */
  readonly roles: readonly ('BASE' | 'QUOTE')[];
}

/** A canonical tradable pair (the base/quote decomposition of an instrument). */
export interface TradingPair {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly baseAsset: string;
  readonly quoteAsset: string;
}

/** The canonical capability profile of an instrument (permissions + supported order types). */
export interface ExchangeCapability {
  readonly spotTradingAllowed: boolean;
  readonly marginTradingAllowed: boolean;
  readonly permissions: readonly string[];
  readonly orderTypes: readonly string[];
}

/** A canonical rate-limit descriptor advertised by the exchange. */
export interface RateLimitMetadata {
  readonly type: 'REQUEST_WEIGHT' | 'ORDERS' | 'RAW_REQUESTS' | 'CONNECTIONS' | 'UNKNOWN';
  readonly intervalUnit: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | 'UNKNOWN';
  readonly intervalNum: number;
  readonly limit: number;
}

/** The canonical, fully-resolved definition of one exchange instrument. */
export interface ExchangeSymbol {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly market: BinanceMarket;
  readonly baseAsset: string;
  readonly quoteAsset: string;
  readonly status: TradingStatus;
  readonly assetClass: AssetClass;
  readonly contractType?: string;
  readonly precision: PrecisionRule;
  readonly filters: readonly ExchangeFilter[];
  readonly tradingRule: TradingRule;
  readonly capability: ExchangeCapability;
}

/** The canonical, immutable snapshot of an exchange's full metadata at a point in time. */
export interface ExchangeMetadata {
  readonly source: 'binance';
  readonly market: BinanceMarket;
  readonly timezone: string;
  readonly serverTime: number;
  readonly rateLimits: readonly RateLimitMetadata[];
  readonly symbols: readonly ExchangeSymbol[];
  readonly fetchedAt: string;
}
