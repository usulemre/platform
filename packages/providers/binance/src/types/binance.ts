/**
 * Raw Binance REST/WebSocket payload shapes — the exact JSON the venue returns, typed. These are the
 * ONLY place Binance-specific field names live; every mapper consumes these and emits the canonical
 * models in {@link ./canonical}, keeping the venue vocabulary quarantined at the adapter boundary.
 * Numeric fields arrive as strings from Binance (its convention) and are parsed by the mappers.
 */

/** `GET /api/v3/time` — server clock. */
export interface BinanceServerTime {
  readonly serverTime: number;
}

/** A price/lot/notional filter entry from exchangeInfo. */
export interface BinanceSymbolFilter {
  readonly filterType: string;
  readonly tickSize?: string;
  readonly stepSize?: string;
  readonly minQty?: string;
  readonly maxQty?: string;
  readonly minNotional?: string;
  readonly notional?: string;
}

/** A single instrument in `exchangeInfo`. */
export interface BinanceSymbolInfo {
  readonly symbol: string;
  readonly status: string;
  readonly baseAsset: string;
  readonly quoteAsset: string;
  readonly baseAssetPrecision?: number;
  readonly quotePrecision?: number;
  readonly quantityPrecision?: number;
  readonly pricePrecision?: number;
  readonly contractType?: string;
  readonly filters?: readonly BinanceSymbolFilter[];
}

/** `GET .../exchangeInfo`. */
export interface BinanceExchangeInfo {
  readonly timezone?: string;
  readonly serverTime?: number;
  readonly symbols: readonly BinanceSymbolInfo[];
}

/** A single spot balance line from `GET /api/v3/account`. */
export interface BinanceSpotBalance {
  readonly asset: string;
  readonly free: string;
  readonly locked: string;
}

/** `GET /api/v3/account`. */
export interface BinanceAccountInfo {
  readonly accountType?: string;
  readonly canTrade?: boolean;
  readonly balances: readonly BinanceSpotBalance[];
}

/** A single futures balance line from `GET /fapi/v2/balance`. */
export interface BinanceFuturesBalance {
  readonly asset: string;
  readonly balance: string;
  readonly availableBalance: string;
  readonly crossWalletBalance?: string;
}

/** A single futures position from `GET /fapi/v2/positionRisk`. */
export interface BinancePositionRisk {
  readonly symbol: string;
  readonly positionAmt: string;
  readonly entryPrice: string;
  readonly markPrice?: string;
  readonly unRealizedProfit?: string;
  readonly leverage?: string;
  readonly positionSide?: string;
}

/** An order object (spot & futures share most fields). */
export interface BinanceOrder {
  readonly symbol: string;
  readonly orderId: number;
  readonly clientOrderId: string;
  readonly price: string;
  readonly origQty: string;
  readonly executedQty: string;
  readonly cummulativeQuoteQty?: string;
  readonly avgPrice?: string;
  readonly status: string;
  readonly timeInForce?: string;
  readonly type: string;
  readonly side: string;
  readonly stopPrice?: string;
  readonly reduceOnly?: boolean;
  readonly time?: number;
  readonly updateTime?: number;
  readonly transactTime?: number;
}

/** A user trade line from `GET /api/v3/myTrades` or `/fapi/v1/userTrades`. */
export interface BinanceUserTrade {
  readonly id: number;
  readonly orderId: number;
  readonly symbol: string;
  readonly price: string;
  readonly qty: string;
  readonly commission: string;
  readonly commissionAsset: string;
  readonly isBuyer: boolean;
  readonly isMaker: boolean;
  readonly time: number;
}

/** `GET .../depth`. */
export interface BinanceDepth {
  readonly lastUpdateId: number;
  readonly bids: readonly [string, string][];
  readonly asks: readonly [string, string][];
}

/** A single kline row `[openTime, open, high, low, close, volume, closeTime, ...]`. */
export type BinanceKline = readonly [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  ...unknown[],
];

/** The Binance error envelope `{ code, msg }`. */
export interface BinanceErrorBody {
  readonly code: number;
  readonly msg: string;
}

/** `POST .../userDataStream` (spot) or `/fapi/v1/listenKey` (futures). */
export interface BinanceListenKey {
  readonly listenKey: string;
}

/* ---------------------------- WebSocket payloads ---------------------------- */

/** A combined-stream envelope `{ stream, data }`. */
export interface BinanceStreamEnvelope {
  readonly stream: string;
  readonly data: unknown;
}

/** A `@ticker` stream payload (subset). */
export interface BinanceTickerEvent {
  readonly e?: string;
  readonly s: string;
  readonly c: string;
  readonly b?: string;
  readonly a?: string;
  readonly E: number;
}

/** A `@kline` stream payload (subset). */
export interface BinanceKlineEvent {
  readonly e?: string;
  readonly s: string;
  readonly k: {
    readonly t: number;
    readonly T: number;
    readonly i: string;
    readonly o: string;
    readonly h: string;
    readonly l: string;
    readonly c: string;
    readonly v: string;
    readonly x: boolean;
  };
}

/** A `@depth` stream payload (subset). */
export interface BinanceDepthEvent {
  readonly e?: string;
  readonly s: string;
  readonly U?: number;
  readonly u: number;
  readonly b: readonly [string, string][];
  readonly a: readonly [string, string][];
}

/** An `executionReport` user-data event (subset). */
export interface BinanceExecutionReport {
  readonly e: 'executionReport' | 'ORDER_TRADE_UPDATE' | string;
  readonly s: string;
  readonly S: string;
  readonly o: string;
  readonly X: string;
  readonly i: number;
  readonly c: string;
  readonly l: string;
  readonly z: string;
  readonly L: string;
  readonly E: number;
}
