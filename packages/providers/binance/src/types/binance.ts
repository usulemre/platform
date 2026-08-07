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

/** A price/lot/notional filter entry from exchangeInfo (fields vary by `filterType`). */
export interface BinanceSymbolFilter {
  readonly filterType: string;
  readonly tickSize?: string;
  readonly stepSize?: string;
  readonly minPrice?: string;
  readonly maxPrice?: string;
  readonly minQty?: string;
  readonly maxQty?: string;
  readonly minNotional?: string;
  readonly maxNotional?: string;
  readonly notional?: string;
  readonly limit?: number;
  readonly maxNumOrders?: number;
  readonly maxNumAlgoOrders?: number;
  readonly multiplierUp?: string;
  readonly multiplierDown?: string;
  readonly avgPriceMins?: number;
}

/** A single instrument in `exchangeInfo` (Spot & Futures share most fields). */
export interface BinanceSymbolInfo {
  readonly symbol: string;
  readonly status: string;
  readonly baseAsset: string;
  readonly quoteAsset: string;
  readonly baseAssetPrecision?: number;
  readonly quoteAssetPrecision?: number;
  readonly quotePrecision?: number;
  readonly quantityPrecision?: number;
  readonly pricePrecision?: number;
  readonly contractType?: string;
  readonly orderTypes?: readonly string[];
  readonly permissions?: readonly string[];
  readonly permissionSets?: readonly (readonly string[])[];
  readonly isSpotTradingAllowed?: boolean;
  readonly isMarginTradingAllowed?: boolean;
  readonly filters?: readonly BinanceSymbolFilter[];
}

/** A rate-limit entry from exchangeInfo. */
export interface BinanceRateLimit {
  readonly rateLimitType: string;
  readonly interval: string;
  readonly intervalNum: number;
  readonly limit: number;
}

/** `GET .../exchangeInfo`. */
export interface BinanceExchangeInfo {
  readonly timezone?: string;
  readonly serverTime?: number;
  readonly rateLimits?: readonly BinanceRateLimit[];
  readonly exchangeFilters?: readonly BinanceSymbolFilter[];
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
  readonly canWithdraw?: boolean;
  readonly canDeposit?: boolean;
  readonly permissions?: readonly string[];
  readonly updateTime?: number;
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
  readonly liquidationPrice?: string;
  readonly marginType?: string;
  readonly isolatedMargin?: string;
  readonly isolatedWallet?: string;
  readonly notional?: string;
  readonly maxNotionalValue?: string;
  readonly isAutoAddMargin?: string;
  readonly updateTime?: number;
}

/* ---------------------------- USDⓈ-M Futures-only REST payloads (Phase 9.1.7) ---------------------------- */

/** An asset line within `GET /fapi/v2/account`. */
export interface BinanceFuturesAccountAsset {
  readonly asset: string;
  readonly walletBalance: string;
  readonly unrealizedProfit?: string;
  readonly marginBalance?: string;
  readonly maintMargin?: string;
  readonly initialMargin?: string;
  readonly positionInitialMargin?: string;
  readonly openOrderInitialMargin?: string;
  readonly crossWalletBalance?: string;
  readonly crossUnPnl?: string;
  readonly availableBalance?: string;
  readonly maxWithdrawAmount?: string;
  readonly marginAvailable?: boolean;
  readonly updateTime?: number;
}

/** A position line within `GET /fapi/v2/account`. */
export interface BinanceFuturesAccountPosition {
  readonly symbol: string;
  readonly positionSide?: string;
  readonly positionAmt: string;
  readonly entryPrice?: string;
  readonly markPrice?: string;
  readonly unrealizedProfit?: string;
  readonly leverage?: string;
  readonly isolated?: boolean;
  readonly initialMargin?: string;
  readonly maintMargin?: string;
  readonly positionInitialMargin?: string;
  readonly openOrderInitialMargin?: string;
  readonly isolatedWallet?: string;
  readonly maxNotional?: string;
  readonly notional?: string;
  readonly updateTime?: number;
}

/** `GET /fapi/v2/account` — the full USDⓈ-M Futures account document. */
export interface BinanceFuturesAccountInfo {
  readonly feeTier?: number;
  readonly canTrade?: boolean;
  readonly canDeposit?: boolean;
  readonly canWithdraw?: boolean;
  readonly updateTime?: number;
  readonly totalWalletBalance?: string;
  readonly totalUnrealizedProfit?: string;
  readonly totalMarginBalance?: string;
  readonly totalInitialMargin?: string;
  readonly totalMaintMargin?: string;
  readonly availableBalance?: string;
  readonly maxWithdrawAmount?: string;
  readonly assets: readonly BinanceFuturesAccountAsset[];
  readonly positions: readonly BinanceFuturesAccountPosition[];
}

/** `POST /fapi/v1/leverage` — leverage change acknowledgement. */
export interface BinanceLeverageResponse {
  readonly leverage: number;
  readonly maxNotionalValue: string;
  readonly symbol: string;
}

/** `POST /fapi/v1/marginType` / `POST /fapi/v1/positionSide/dual` — a `{ code, msg }` acknowledgement. */
export interface BinanceCodeMsg {
  readonly code: number;
  readonly msg: string;
}

/** `POST /fapi/v1/positionMargin` — isolated position-margin change acknowledgement. */
export interface BinancePositionMarginResponse {
  readonly amount: number;
  readonly code: number;
  readonly msg: string;
  readonly type: number;
}

/** `GET /fapi/v1/positionSide/dual` — the account's position mode. */
export interface BinancePositionSideDual {
  readonly dualSidePosition: boolean;
}

/** `GET /fapi/v1/premiumIndex` — mark price, index price and current funding data. */
export interface BinancePremiumIndex {
  readonly symbol: string;
  readonly markPrice: string;
  readonly indexPrice?: string;
  readonly estimatedSettlePrice?: string;
  readonly lastFundingRate?: string;
  readonly interestRate?: string;
  readonly nextFundingTime?: number;
  readonly time?: number;
}

/** `GET /fapi/v1/fundingRate` — a historical funding-rate row. */
export interface BinanceFundingRate {
  readonly symbol: string;
  readonly fundingRate: string;
  readonly fundingTime: number;
  readonly markPrice?: string;
}

/** A single notional/leverage bracket within `GET /fapi/v1/leverageBracket`. */
export interface BinanceLeverageBracketEntry {
  readonly bracket: number;
  readonly initialLeverage: number;
  readonly notionalCap: number;
  readonly notionalFloor: number;
  readonly maintMarginRatio: number;
  readonly cum?: number;
}

/** `GET /fapi/v1/leverageBracket` — a symbol's notional/leverage brackets. */
export interface BinanceLeverageBracket {
  readonly symbol: string;
  readonly brackets: readonly BinanceLeverageBracketEntry[];
}

/** A single fill within a Spot order response (`fills[]`). */
export interface BinanceFill {
  readonly price: string;
  readonly qty: string;
  readonly commission: string;
  readonly commissionAsset: string;
  readonly tradeId?: number;
}

/** An order object (spot & futures share most fields; `fills` is Spot-only on create). */
export interface BinanceOrder {
  readonly symbol: string;
  readonly orderId: number;
  readonly orderListId?: number;
  readonly clientOrderId: string;
  readonly price: string;
  readonly origQty: string;
  readonly executedQty: string;
  readonly cummulativeQuoteQty?: string;
  readonly cumQuote?: string;
  readonly avgPrice?: string;
  readonly status: string;
  readonly timeInForce?: string;
  readonly type: string;
  readonly origType?: string;
  readonly side: string;
  readonly positionSide?: string;
  readonly stopPrice?: string;
  readonly reduceOnly?: boolean;
  readonly closePosition?: boolean;
  readonly workingType?: string;
  readonly time?: number;
  readonly updateTime?: number;
  readonly transactTime?: number;
  readonly workingTime?: number;
  readonly fills?: readonly BinanceFill[];
}

/** The Spot `POST /api/v3/order/cancelReplace` response envelope. */
export interface BinanceCancelReplaceResponse {
  readonly cancelResult: string;
  readonly newOrderResult: string;
  readonly cancelResponse?: BinanceOrder | BinanceErrorBody;
  readonly newOrderResponse?: BinanceOrder | BinanceErrorBody;
}

/** The Futures `DELETE /fapi/v1/allOpenOrders` acknowledgement. */
export interface BinanceFuturesAck {
  readonly code: number;
  readonly msg: string;
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
