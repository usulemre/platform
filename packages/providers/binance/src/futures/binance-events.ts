/**
 * Raw USDⓈ-M Futures **user data stream** payload shapes not already declared by the Authentication &
 * User Data Streams module — the Futures-only account events `ACCOUNT_CONFIG_UPDATE` (leverage /
 * multi-assets-mode changes) and `MARGIN_CALL` (a margin-call warning with at-risk positions). Typed to
 * match the officially-documented schemas; numeric fields arrive as strings. The shared events
 * (`ACCOUNT_UPDATE`, `ORDER_TRADE_UPDATE`, `listenKeyExpired`) live in
 * {@link ../auth/binance-user-events} and are reused. These are the ONLY place these venue field names
 * live; the {@link ./event-mapper} translates them to canonical Futures events.
 */

/** `ACCOUNT_CONFIG_UPDATE` — a leverage change (`ac`) or a multi-assets-mode change (`ai`). */
export interface BinanceFuturesAccountConfigUpdate {
  readonly e: 'ACCOUNT_CONFIG_UPDATE';
  readonly E: number;
  readonly T: number;
  /** Present on a leverage change: symbol (`s`) and new leverage (`l`). */
  readonly ac?: { readonly s: string; readonly l: number };
  /** Present on a multi-assets-mode change: the mode flag (`j`). */
  readonly ai?: { readonly j: boolean };
}

/** A `MARGIN_CALL` at-risk position line. */
export interface BinanceFuturesMarginCallPosition {
  readonly s: string;
  readonly ps: string;
  readonly pa: string;
  readonly mt: string;
  readonly iw?: string;
  readonly mp: string;
  readonly up: string;
  readonly mm: string;
}

/** `MARGIN_CALL` — a margin-call warning carrying the cross wallet balance and at-risk positions. */
export interface BinanceFuturesMarginCall {
  readonly e: 'MARGIN_CALL';
  readonly E: number;
  readonly cw?: string;
  readonly p: readonly BinanceFuturesMarginCallPosition[];
}

/** Any Futures-only raw user-data event handled by this module. */
export type BinanceFuturesUserEvent = BinanceFuturesAccountConfigUpdate | BinanceFuturesMarginCall;
