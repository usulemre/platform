/**
 * Raw Binance WebSocket market-stream payload shapes — typed to match the officially-documented
 * schemas exactly (Binance Spot & USDⓈ-M Futures WebSocket Market Streams). These are the ONLY place
 * the venue's single-letter field names live; the {@link ./event-mapper} consumes these and emits the
 * canonical events in {@link ./events}. Numeric fields arrive as strings (Binance convention) except
 * ids/timestamps which arrive as numbers. Only documented fields are declared here.
 */

/** The combined-stream envelope: `{ "stream": "<name>", "data": <payload> }`. */
export interface BinanceCombinedStreamMessage {
  readonly stream: string;
  readonly data: unknown;
}

/** A subscription-control response: `{ "result": null, "id": <n> }`. */
export interface BinanceStreamControlResponse {
  readonly result: unknown;
  readonly id: number;
}

/** `<symbol>@trade`. */
export interface BinanceRawTrade {
  readonly e: 'trade';
  readonly E: number;
  readonly s: string;
  readonly t: number;
  readonly p: string;
  readonly q: string;
  readonly T: number;
  readonly m: boolean;
}

/** `<symbol>@aggTrade`. */
export interface BinanceRawAggTrade {
  readonly e: 'aggTrade';
  readonly E: number;
  readonly s: string;
  readonly a: number;
  readonly p: string;
  readonly q: string;
  readonly f: number;
  readonly l: number;
  readonly T: number;
  readonly m: boolean;
}

/** `<symbol>@miniTicker` (`e` = `24hrMiniTicker`). */
export interface BinanceRawMiniTicker {
  readonly e: '24hrMiniTicker';
  readonly E: number;
  readonly s: string;
  readonly c: string;
  readonly o: string;
  readonly h: string;
  readonly l: string;
  readonly v: string;
  readonly q: string;
}

/** `<symbol>@ticker` (`e` = `24hrTicker`). */
export interface BinanceRawTicker {
  readonly e: '24hrTicker';
  readonly E: number;
  readonly s: string;
  readonly p: string;
  readonly P: string;
  readonly w: string;
  readonly c: string;
  readonly Q: string;
  readonly b: string;
  readonly B: string;
  readonly a: string;
  readonly A: string;
  readonly o: string;
  readonly h: string;
  readonly l: string;
  readonly v: string;
  readonly q: string;
  readonly n: number;
}

/** `<symbol>@ticker_<window>` (`e` = `<window>Ticker`, e.g. `1hTicker`). */
export interface BinanceRawRollingTicker {
  readonly e: string;
  readonly E: number;
  readonly s: string;
  readonly p: string;
  readonly P: string;
  readonly o: string;
  readonly h: string;
  readonly l: string;
  readonly c: string;
  readonly w: string;
  readonly v: string;
  readonly q: string;
  readonly n: number;
}

/** `<symbol>@bookTicker` (Spot: no `e`; Futures adds `e`=`bookTicker`, `T`, `E`). */
export interface BinanceRawBookTicker {
  readonly e?: 'bookTicker';
  readonly u: number;
  readonly s: string;
  readonly b: string;
  readonly B: string;
  readonly a: string;
  readonly A: string;
  readonly E?: number;
  readonly T?: number;
}

/** `<symbol>@depth<levels>` — partial book depth snapshot (Spot form has no `e`). */
export interface BinanceRawPartialDepth {
  readonly lastUpdateId: number;
  readonly bids: readonly [string, string][];
  readonly asks: readonly [string, string][];
  /** Futures partial depth adds these. */
  readonly e?: 'depthUpdate';
  readonly E?: number;
  readonly T?: number;
  readonly U?: number;
  readonly u?: number;
  readonly pu?: number;
}

/** `<symbol>@depth` — diff-depth update (`e` = `depthUpdate`). */
export interface BinanceRawDepthUpdate {
  readonly e: 'depthUpdate';
  readonly E: number;
  readonly s: string;
  readonly U: number;
  readonly u: number;
  /** Futures only: previous final update id. */
  readonly pu?: number;
  readonly T?: number;
  readonly b: readonly [string, string][];
  readonly a: readonly [string, string][];
}

/** The `k` block of a `<symbol>@kline_<interval>` event. */
export interface BinanceRawKlineBlock {
  readonly t: number;
  readonly T: number;
  readonly s: string;
  readonly i: string;
  readonly f: number;
  readonly L: number;
  readonly o: string;
  readonly c: string;
  readonly h: string;
  readonly l: string;
  readonly v: string;
  readonly n: number;
  readonly x: boolean;
  readonly q: string;
  readonly V: string;
  readonly Q: string;
}

/** `<symbol>@kline_<interval>`. */
export interface BinanceRawKline {
  readonly e: 'kline';
  readonly E: number;
  readonly s: string;
  readonly k: BinanceRawKlineBlock;
}

/** `<symbol>@avgPrice` (`e` = `avgPrice`). */
export interface BinanceRawAvgPrice {
  readonly e: 'avgPrice';
  readonly E: number;
  readonly s: string;
  readonly i: string;
  readonly w: string;
  readonly T: number;
}

/** `<symbol>@markPrice` (`e` = `markPriceUpdate`, Futures). */
export interface BinanceRawMarkPrice {
  readonly e: 'markPriceUpdate';
  readonly E: number;
  readonly s: string;
  readonly p: string;
  readonly i: string;
  readonly P: string;
  readonly r: string;
  readonly T: number;
}
