/**
 * The canonical, immutable **market-data domain events** the Binance WebSocket streams emit after
 * translation. These are venue-neutral (asset-agnostic per CP-8): no Binance field names appear here —
 * those are confined to {@link ./binance-events} and translated by the {@link ./event-mapper}. Every
 * numeric field is a parsed `number` (Binance sends strings on the wire); every model is `readonly`.
 * These describe market observations only — no orders, no account data, no trading logic.
 */
/** A single price level in an order book. */
export interface OrderBookLevel {
  readonly price: number;
  readonly quantity: number;
}

/** `<symbol>@trade` — a single executed trade. */
export interface MarketTradeEvent {
  readonly kind: 'trade';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly tradeId: number;
  readonly price: number;
  readonly quantity: number;
  /** Whether the buyer was the maker (i.e. the trade was a sell into the bid). */
  readonly buyerIsMaker: boolean;
  readonly tradeTime: number;
  readonly eventTime: number;
}

/** `<symbol>@aggTrade` — an aggregate of trades filled at the same price from one taker order. */
export interface AggregateTradeEvent {
  readonly kind: 'aggTrade';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly aggregateTradeId: number;
  readonly price: number;
  readonly quantity: number;
  readonly firstTradeId: number;
  readonly lastTradeId: number;
  readonly buyerIsMaker: boolean;
  readonly tradeTime: number;
  readonly eventTime: number;
}

/** The flavour of a {@link TickerEvent}: full 24h, mini, or a rolling-window statistic. */
export type TickerKind = 'FULL' | 'MINI' | 'ROLLING';

/** `<symbol>@ticker` / `@miniTicker` / `@ticker_<window>` — a rolling statistics snapshot. */
export interface TickerEvent {
  readonly kind: 'ticker';
  readonly tickerKind: TickerKind;
  readonly symbol: string;
  readonly venueSymbol: string;
  /** Rolling window in ms (ROLLING tickers only). */
  readonly windowMs?: number;
  readonly lastPrice: number;
  readonly openPrice: number;
  readonly highPrice: number;
  readonly lowPrice: number;
  readonly baseVolume: number;
  readonly quoteVolume: number;
  readonly weightedAvgPrice?: number;
  readonly priceChange?: number;
  readonly priceChangePercent?: number;
  readonly bidPrice?: number;
  readonly bidQuantity?: number;
  readonly askPrice?: number;
  readonly askQuantity?: number;
  readonly tradeCount?: number;
  readonly eventTime: number;
}

/** `<symbol>@bookTicker` — best bid/ask update. */
export interface BookTickerEvent {
  readonly kind: 'bookTicker';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly updateId: number;
  readonly bidPrice: number;
  readonly bidQuantity: number;
  readonly askPrice: number;
  readonly askQuantity: number;
  /** Event/transaction time (Futures book ticker only; undefined on Spot). */
  readonly eventTime?: number;
  readonly transactionTime?: number;
}

/** A partial or fully-synchronized order-book snapshot. */
export interface OrderBookSnapshot {
  readonly kind: 'orderBookSnapshot';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly lastUpdateId: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
  /** Present for the maintained (synchronized) book; absent for a raw partial-depth snapshot. */
  readonly eventTime?: number;
}

/** `<symbol>@depth` — a diff-depth (delta) update. */
export interface OrderBookDelta {
  readonly kind: 'orderBookDelta';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly firstUpdateId: number;
  readonly finalUpdateId: number;
  /** Futures only: the final update id of the previous event (`pu`), used for sequence validation. */
  readonly previousFinalUpdateId?: number;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
  readonly eventTime: number;
  readonly transactionTime?: number;
}

/** `<symbol>@kline_<interval>` — a candlestick update. */
export interface CandlestickEvent {
  readonly kind: 'kline';
  readonly symbol: string;
  readonly venueSymbol: string;
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
  readonly firstTradeId: number;
  readonly lastTradeId: number;
  readonly takerBuyBaseVolume: number;
  readonly takerBuyQuoteVolume: number;
  /** Whether this candlestick is closed (final). */
  readonly closed: boolean;
  readonly eventTime: number;
}

/** `<symbol>@avgPrice` — the current average price over a rolling interval (Spot). */
export interface AveragePriceEvent {
  readonly kind: 'avgPrice';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly intervalMinutes: number;
  readonly averagePrice: number;
  readonly lastTradeTime: number;
  readonly eventTime: number;
}

/** `<symbol>@markPrice` — mark price / funding update (Futures). */
export interface MarkPriceEvent {
  readonly kind: 'markPrice';
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly markPrice: number;
  readonly indexPrice: number;
  readonly estimatedSettlePrice: number;
  readonly fundingRate: number;
  readonly nextFundingTime: number;
  readonly eventTime: number;
}

/** Any canonical market-data event this module emits. */
export type MarketDataEvent =
  | MarketTradeEvent
  | AggregateTradeEvent
  | TickerEvent
  | BookTickerEvent
  | OrderBookSnapshot
  | OrderBookDelta
  | CandlestickEvent
  | AveragePriceEvent
  | MarkPriceEvent;
