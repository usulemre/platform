/**
 * The canonical **timestamp model**, **provenance**, the in-flight **ingestion envelope**, and the
 * **normalized records** the pipeline emits to the canonical store.
 *
 * Timestamps are never silently overwritten: the pipeline preserves the venue's event and exchange
 * timestamps and *adds* a receive time and a processing time, so the full temporal lineage survives.
 * Every normalized record carries provenance (which provider, which stream, which sequence) so a
 * defect in a source can invalidate everything downstream (CP-6).
 */
import type { MarketDataType } from '@platform/market-data-sdk';
import type { MarketDataEventKind, OrderBookLevel, RawMarketDataEvent } from './canonical-events';

/**
 * The canonical timestamp model. All four axes are preserved where available; only `receiveTime` and
 * `processingTime` are guaranteed (the pipeline always stamps them from the injected clock).
 */
export interface CanonicalTimestamps {
  /** When the venue emitted the event (epoch ms), if reported. */
  readonly eventTime?: number;
  /** When the matching/transaction occurred on the exchange (epoch ms), if reported. */
  readonly exchangeTime?: number;
  /** When the ingestion gateway first received the event (epoch ms) — always present. */
  readonly receiveTime: number;
  /** When the pipeline finished normalizing the event (epoch ms) — always present. */
  readonly processingTime: number;
}

/** The lineage of a normalized record back to the provider event that produced it. */
export interface EventProvenance {
  readonly providerId: string;
  readonly streamKey: string;
  /** The provider's own symbol string, before canonical resolution. */
  readonly providerSymbol: string;
  /** The event's monotonic sequence number within its stream, when it has one. */
  readonly sequence?: number;
  /** A gateway-assigned, strictly increasing intake ordinal (breaks ties, aids replay/audit). */
  readonly ingestSequence: number;
}

/**
 * An event in flight through the pipeline. Created by the gateway on intake and threaded through
 * every stage. Immutable: stages derive new envelopes rather than mutating.
 */
export interface IngestionEnvelope {
  readonly providerId: string;
  readonly streamKey: string;
  readonly event: RawMarketDataEvent;
  readonly receiveTime: number;
  readonly ingestSequence: number;
}

/** Fields shared by every normalized record. */
interface NormalizedBase {
  readonly instrumentId: string;
  readonly kind: MarketDataEventKind;
  readonly marketDataType: MarketDataType;
  readonly timestamps: CanonicalTimestamps;
  readonly provenance: EventProvenance;
}

export interface NormalizedTrade extends NormalizedBase {
  readonly kind: 'trade';
  readonly tradeId: number;
  readonly price: number;
  readonly quantity: number;
  readonly buyerIsMaker: boolean;
}

export interface NormalizedAggregateTrade extends NormalizedBase {
  readonly kind: 'aggTrade';
  readonly aggregateTradeId: number;
  readonly price: number;
  readonly quantity: number;
  readonly firstTradeId: number;
  readonly lastTradeId: number;
  readonly buyerIsMaker: boolean;
}

export interface NormalizedTicker extends NormalizedBase {
  readonly kind: 'ticker';
  readonly lastPrice: number;
  readonly openPrice: number;
  readonly highPrice: number;
  readonly lowPrice: number;
  readonly baseVolume: number;
  readonly quoteVolume: number;
  readonly weightedAvgPrice?: number;
  readonly priceChange?: number;
  readonly priceChangePercent?: number;
  readonly tradeCount?: number;
  readonly windowMs?: number;
}

export interface NormalizedBookTicker extends NormalizedBase {
  readonly kind: 'bookTicker';
  readonly updateId: number;
  readonly bidPrice: number;
  readonly bidQuantity: number;
  readonly askPrice: number;
  readonly askQuantity: number;
}

export interface NormalizedOrderBookSnapshot extends NormalizedBase {
  readonly kind: 'orderBookSnapshot';
  readonly lastUpdateId: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

export interface NormalizedOrderBookDelta extends NormalizedBase {
  readonly kind: 'orderBookDelta';
  readonly firstUpdateId: number;
  readonly finalUpdateId: number;
  readonly previousFinalUpdateId?: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

export interface NormalizedCandlestick extends NormalizedBase {
  readonly kind: 'candlestick';
  readonly interval: string;
  readonly openTime: number;
  readonly closeTime: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly baseVolume: number;
  readonly quoteVolume: number;
  readonly trades: number;
  readonly closed: boolean;
}

export interface NormalizedMarkPrice extends NormalizedBase {
  readonly kind: 'markPrice';
  readonly markPrice: number;
  readonly indexPrice?: number;
  readonly estimatedSettlePrice?: number;
  readonly fundingRate?: number;
  readonly nextFundingTime?: number;
}

export interface NormalizedAveragePrice extends NormalizedBase {
  readonly kind: 'avgPrice';
  readonly intervalMinutes: number;
  readonly averagePrice: number;
  readonly lastTradeTime: number;
}

/** Any normalized, canonical market-data record the pipeline writes to the store. */
export type NormalizedMarketDataRecord =
  | NormalizedTrade
  | NormalizedAggregateTrade
  | NormalizedTicker
  | NormalizedBookTicker
  | NormalizedOrderBookSnapshot
  | NormalizedOrderBookDelta
  | NormalizedCandlestick
  | NormalizedMarkPrice
  | NormalizedAveragePrice;

/** Map each event kind to its canonical market-data type (for store partitioning/classification). */
export const MARKET_DATA_TYPE_BY_KIND: Readonly<Record<MarketDataEventKind, MarketDataType>> = {
  trade: 'TRADES',
  aggTrade: 'TRADES',
  ticker: 'INDEX_PRICES',
  bookTicker: 'ORDER_BOOKS',
  orderBookSnapshot: 'ORDER_BOOKS',
  orderBookDelta: 'ORDER_BOOKS',
  candlestick: 'OHLCV',
  markPrice: 'MARK_PRICES',
  avgPrice: 'INDEX_PRICES',
};
