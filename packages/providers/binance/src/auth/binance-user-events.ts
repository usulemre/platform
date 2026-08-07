/**
 * Raw Binance **user data stream** payload shapes — typed to match the officially-documented schemas
 * (Binance Spot & USDⓈ-M Futures user data streams). These are the ONLY place the venue's field names
 * for account events live; the {@link ./event-mapper} consumes these and emits the canonical events in
 * {@link ./events}. Numeric fields arrive as strings; ids/timestamps as numbers. Only documented fields
 * are declared.
 */

/** Spot `outboundAccountPosition` — account balance state. */
export interface BinanceOutboundAccountPosition {
  readonly e: 'outboundAccountPosition';
  readonly E: number;
  readonly u: number;
  readonly B: readonly { readonly a: string; readonly f: string; readonly l: string }[];
}

/** Spot `balanceUpdate` — a single-asset balance delta. */
export interface BinanceBalanceUpdate {
  readonly e: 'balanceUpdate';
  readonly E: number;
  readonly a: string;
  readonly d: string;
  readonly T: number;
}

/** Spot `executionReport` — an order/execution update. */
export interface BinanceSpotExecutionReport {
  readonly e: 'executionReport';
  readonly E: number;
  readonly s: string;
  readonly c: string;
  readonly S: string;
  readonly o: string;
  readonly f: string;
  readonly q: string;
  readonly p: string;
  readonly P: string;
  readonly x: string;
  readonly X: string;
  readonly r: string;
  readonly i: number;
  readonly l: string;
  readonly z: string;
  readonly L: string;
  readonly n: string;
  readonly N: string | null;
  readonly T: number;
  readonly t: number;
  readonly m: boolean;
  readonly O: number;
  readonly Z: string;
}

/** Futures `ACCOUNT_UPDATE` balance line. */
export interface BinanceFuturesBalanceLine {
  readonly a: string;
  readonly wb: string;
  readonly cw: string;
  readonly bc: string;
}

/** Futures `ACCOUNT_UPDATE` position line. */
export interface BinanceFuturesPositionLine {
  readonly s: string;
  readonly pa: string;
  readonly ep: string;
  readonly cr: string;
  readonly up: string;
  readonly mt: string;
  readonly iw: string;
  readonly ps: string;
}

/** Futures `ACCOUNT_UPDATE`. */
export interface BinanceFuturesAccountUpdate {
  readonly e: 'ACCOUNT_UPDATE';
  readonly E: number;
  readonly T: number;
  readonly a: {
    readonly m: string;
    readonly B: readonly BinanceFuturesBalanceLine[];
    readonly P: readonly BinanceFuturesPositionLine[];
  };
}

/** Futures `ORDER_TRADE_UPDATE` order block. */
export interface BinanceFuturesOrderBlock {
  readonly s: string;
  readonly c: string;
  readonly S: string;
  readonly o: string;
  readonly f: string;
  readonly q: string;
  readonly p: string;
  readonly ap: string;
  readonly sp: string;
  readonly x: string;
  readonly X: string;
  readonly i: number;
  readonly l: string;
  readonly z: string;
  readonly L: string;
  readonly n: string;
  readonly N: string;
  readonly T: number;
  readonly t: number;
  readonly m: boolean;
  readonly R: boolean;
  readonly ps: string;
  readonly rp: string;
}

/** Futures `ORDER_TRADE_UPDATE`. */
export interface BinanceFuturesOrderTradeUpdate {
  readonly e: 'ORDER_TRADE_UPDATE';
  readonly E: number;
  readonly T: number;
  readonly o: BinanceFuturesOrderBlock;
}

/** `listenKeyExpired` (Spot & Futures). */
export interface BinanceListenKeyExpired {
  readonly e: 'listenKeyExpired';
  readonly E: number;
  readonly listenKey?: string;
}

/** Any raw user-data event (discriminated by `e`). */
export type BinanceUserDataEvent =
  | BinanceOutboundAccountPosition
  | BinanceBalanceUpdate
  | BinanceSpotExecutionReport
  | BinanceFuturesAccountUpdate
  | BinanceFuturesOrderTradeUpdate
  | BinanceListenKeyExpired;
