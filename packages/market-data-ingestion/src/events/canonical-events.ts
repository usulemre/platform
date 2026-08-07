/**
 * The canonical, provider-neutral **market-data event vocabulary** the ingestion pipeline consumes.
 *
 * These are the *only* shapes the ingestion core knows about. A provider adapter (Binance, and any
 * future venue) is responsible for translating its wire protocol into these events before handing
 * them to the {@link MarketDataIngestionGateway}; the ingestion core never imports a provider SDK,
 * DTO, enum, or client (provider independence — CP-8, asset-agnostic core). Every model is `readonly`
 * and every numeric field is an already-parsed `number`.
 *
 * A raw event carries a `providerSymbol` (the venue's own symbol string). The pipeline resolves it to
 * a canonical instrument id via the {@link SymbolNormalizer}; the ingestion layer therefore hardcodes
 * no venue symbol convention. Timestamps are optional on the raw event (a venue may omit them); the
 * {@link TimestampNormalizer} fills the canonical timestamp model, always stamping a receive time.
 */

/** The kinds of market-data event the pipeline ingests. */
export type MarketDataEventKind =
  | 'trade'
  | 'aggTrade'
  | 'ticker'
  | 'bookTicker'
  | 'orderBookSnapshot'
  | 'orderBookDelta'
  | 'candlestick'
  | 'markPrice'
  | 'avgPrice';

/** A single price level in an order book. */
export interface OrderBookLevel {
  readonly price: number;
  readonly quantity: number;
}

/** Fields common to every raw provider event. */
interface RawEventBase {
  /** The venue's own symbol string (e.g. `BTCUSDT`); normalized to a canonical instrument id. */
  readonly providerSymbol: string;
  /** When the venue emitted the event (epoch ms), if reported. */
  readonly eventTime?: number;
  /** When the matching/transaction occurred on the exchange (epoch ms), if distinct and reported. */
  readonly exchangeTime?: number;
}

/** A single executed trade. */
export interface RawTradeEvent extends RawEventBase {
  readonly kind: 'trade';
  readonly tradeId: number;
  readonly price: number;
  readonly quantity: number;
  /** Whether the buyer was the maker (the trade was a sell into the bid). */
  readonly buyerIsMaker: boolean;
  readonly tradeTime: number;
}

/** An aggregate of trades filled at the same price from one taker order. */
export interface RawAggregateTradeEvent extends RawEventBase {
  readonly kind: 'aggTrade';
  readonly aggregateTradeId: number;
  readonly price: number;
  readonly quantity: number;
  readonly firstTradeId: number;
  readonly lastTradeId: number;
  readonly buyerIsMaker: boolean;
  readonly tradeTime: number;
}

/** A rolling statistics snapshot (24h / mini / rolling-window ticker). */
export interface RawTickerEvent extends RawEventBase {
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
  /** Rolling window in ms, when this is a windowed ticker. */
  readonly windowMs?: number;
}

/** A best bid/ask update. */
export interface RawBookTickerEvent extends RawEventBase {
  readonly kind: 'bookTicker';
  readonly updateId: number;
  readonly bidPrice: number;
  readonly bidQuantity: number;
  readonly askPrice: number;
  readonly askQuantity: number;
}

/** A full or partial order-book snapshot. */
export interface RawOrderBookSnapshotEvent extends RawEventBase {
  readonly kind: 'orderBookSnapshot';
  readonly lastUpdateId: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

/** A diff-depth (delta) update. */
export interface RawOrderBookDeltaEvent extends RawEventBase {
  readonly kind: 'orderBookDelta';
  readonly firstUpdateId: number;
  readonly finalUpdateId: number;
  /**
   * The final update id of the previous event, when the venue reports it (e.g. USDⓈ-M Futures `pu`).
   * When present it is used for sequence validation instead of the `firstUpdateId = prevFinal + 1`
   * contiguity rule.
   */
  readonly previousFinalUpdateId?: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

/** A candlestick (OHLCV bar) update. */
export interface RawCandlestickEvent extends RawEventBase {
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
  /** Whether this bar is closed (final). Open bars are ingested but flagged. */
  readonly closed: boolean;
}

/** A mark price / funding update (derivatives). */
export interface RawMarkPriceEvent extends RawEventBase {
  readonly kind: 'markPrice';
  readonly markPrice: number;
  readonly indexPrice?: number;
  readonly estimatedSettlePrice?: number;
  readonly fundingRate?: number;
  readonly nextFundingTime?: number;
}

/** An average-price update over a rolling interval. */
export interface RawAveragePriceEvent extends RawEventBase {
  readonly kind: 'avgPrice';
  readonly intervalMinutes: number;
  readonly averagePrice: number;
  readonly lastTradeTime: number;
}

/** Any raw, provider-neutral market-data event the pipeline ingests. */
export type RawMarketDataEvent =
  | RawTradeEvent
  | RawAggregateTradeEvent
  | RawTickerEvent
  | RawBookTickerEvent
  | RawOrderBookSnapshotEvent
  | RawOrderBookDeltaEvent
  | RawCandlestickEvent
  | RawMarkPriceEvent
  | RawAveragePriceEvent;

/**
 * The **stream key** uniquely identifies the logical stream an event belongs to, for per-stream
 * sequencing, duplicate detection and state tracking. Two events with the same key are the same
 * stream (a provider's symbol × kind, plus interval for candlesticks).
 */
export function streamKey(providerId: string, event: RawMarketDataEvent): string {
  // Order-book snapshots and deltas describe the *same* book, so they share one logical stream.
  if (event.kind === 'orderBookSnapshot' || event.kind === 'orderBookDelta') {
    return `${providerId}:orderBook:${event.providerSymbol}`;
  }
  // Candlesticks are streamed per interval, so the interval is part of the stream identity.
  if (event.kind === 'candlestick') {
    return `${providerId}:candlestick:${event.providerSymbol}:${event.interval}`;
  }
  return `${providerId}:${event.kind}:${event.providerSymbol}`;
}

/**
 * The **monotonic sequence number** for an event within its stream, when the event type carries one.
 * Used for out-of-order/duplicate/gap detection. Returns `undefined` for stateless snapshot-style
 * events (tickers, mark/avg prices) which are last-write-wins and not sequence-checked.
 */
export function sequenceNumber(event: RawMarketDataEvent): number | undefined {
  switch (event.kind) {
    case 'trade':
      return event.tradeId;
    case 'aggTrade':
      return event.aggregateTradeId;
    case 'bookTicker':
      return event.updateId;
    case 'orderBookSnapshot':
      return event.lastUpdateId;
    case 'orderBookDelta':
      return event.finalUpdateId;
    case 'candlestick':
      return event.openTime;
    case 'ticker':
    case 'markPrice':
    case 'avgPrice':
      return undefined;
  }
}
