/**
 * The canonical, immutable **account & authentication domain events** the authenticated Binance user
 * data stream emits after translation. These are venue-neutral (asset-agnostic per CP-8): no Binance
 * field names appear here — those are confined to {@link ./binance-user-events} and translated by the
 * {@link ./event-mapper}. Every numeric field is a parsed `number`; every model is `readonly`. These
 * describe account state changes only — this module never places orders or runs trading logic.
 */
import type { CanonicalOrderStatus, CanonicalOrderType, CanonicalSide } from '../types/canonical';
import type { BinanceMarket } from '../constants';

/** The authentication lifecycle states. */
export type AuthenticationState =
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'EXPIRED'
  | 'REAUTHENTICATING'
  | 'FAILED'
  | 'CLOSED';

/** Emitted whenever the authentication state changes. */
export interface AuthenticationStateChangedEvent {
  readonly kind: 'authStateChanged';
  readonly previous: AuthenticationState;
  readonly current: AuthenticationState;
  readonly reason: string;
  readonly at: number;
}

/** A canonical asset balance line (free / locked). */
export interface AccountBalance {
  readonly asset: string;
  readonly free: number;
  readonly locked: number;
  /** Present on Futures wallet updates (wallet balance / cross wallet / balance change). */
  readonly walletBalance?: number;
  readonly crossWalletBalance?: number;
  readonly balanceChange?: number;
}

/** A canonical position line (Futures). */
export interface AccountPosition {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly positionAmount: number;
  readonly entryPrice: number;
  readonly unrealizedPnl: number;
  readonly accumulatedRealized: number;
  readonly marginType: string;
  readonly isolatedWallet: number;
  readonly positionSide: string;
  /** Present on a REST position-risk snapshot (not on the ACCOUNT_UPDATE event). */
  readonly markPrice?: number;
  readonly leverage?: number;
}

/** `outboundAccountPosition` (Spot) / `ACCOUNT_UPDATE` (Futures) — an account state change. */
export interface AccountUpdatedEvent {
  readonly kind: 'accountUpdated';
  readonly market: BinanceMarket;
  /** The event reason (Futures `a.m`, e.g. `ORDER`, `DEPOSIT`); undefined on Spot. */
  readonly reason?: string;
  readonly balances: readonly AccountBalance[];
  readonly positions: readonly AccountPosition[];
  readonly eventTime: number;
  /** Spot: the account last-update time (`u`); Futures: the transaction time (`T`). */
  readonly lastUpdateTime?: number;
}

/** `balanceUpdate` (Spot) — a single-asset balance delta (deposit/withdrawal/transfer). */
export interface BalanceUpdatedEvent {
  readonly kind: 'balanceUpdated';
  readonly asset: string;
  readonly delta: number;
  readonly clearTime: number;
  readonly eventTime: number;
}

/** A position state change (Futures), derived from `ACCOUNT_UPDATE`. */
export interface PositionUpdatedEvent extends AccountPosition {
  readonly kind: 'positionUpdated';
  readonly reason?: string;
  readonly eventTime: number;
}

/** A venue order execution type (`executionReport.x` / `ORDER_TRADE_UPDATE.o.x`). */
export type ExecutionType =
  | 'NEW'
  | 'CANCELED'
  | 'REPLACED'
  | 'REJECTED'
  | 'TRADE'
  | 'EXPIRED'
  | 'CALCULATED'
  | 'RESTATED'
  | 'AMENDMENT'
  | 'TRADE_PREVENTION'
  | 'UNKNOWN';

/** An order-level state update (summary), from `executionReport` / `ORDER_TRADE_UPDATE`. */
export interface OrderUpdatedEvent {
  readonly kind: 'orderUpdated';
  readonly market: BinanceMarket;
  readonly venueOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly side: CanonicalSide;
  readonly type: CanonicalOrderType;
  readonly status: CanonicalOrderStatus;
  readonly price: number;
  readonly stopPrice?: number;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly cumulativeQuoteQuantity?: number;
  readonly averagePrice?: number;
  readonly reduceOnly?: boolean;
  readonly positionSide?: string;
  readonly eventTime: number;
  readonly orderTime?: number;
}

/** The richer per-execution report (a superset of {@link OrderUpdatedEvent}). */
export interface ExecutionReportEvent {
  readonly kind: 'executionReport';
  readonly market: BinanceMarket;
  readonly venueOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly side: CanonicalSide;
  readonly type: CanonicalOrderType;
  readonly status: CanonicalOrderStatus;
  readonly executionType: ExecutionType;
  readonly price: number;
  readonly quantity: number;
  readonly lastFilledQuantity: number;
  readonly cumulativeFilledQuantity: number;
  readonly lastFilledPrice: number;
  readonly commission: number;
  readonly commissionAsset?: string;
  readonly tradeId?: number;
  readonly isMaker?: boolean;
  readonly rejectReason?: string;
  readonly eventTime: number;
}

/** A fill (an `executionReport`/`ORDER_TRADE_UPDATE` whose execution type is `TRADE`). */
export interface TradeExecutionEvent {
  readonly kind: 'tradeExecution';
  readonly market: BinanceMarket;
  readonly venueOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly tradeId: number;
  readonly side: CanonicalSide;
  readonly price: number;
  readonly quantity: number;
  readonly commission: number;
  readonly commissionAsset?: string;
  readonly isMaker: boolean;
  readonly realizedPnl?: number;
  readonly eventTime: number;
}

/** `listenKeyExpired` — the listen key is no longer valid; the stream must re-authenticate. */
export interface ListenKeyExpiredEvent {
  readonly kind: 'listenKeyExpired';
  readonly listenKey?: string;
  readonly eventTime: number;
}

/** Any canonical account event the user data stream emits. */
export type AccountEvent =
  | AccountUpdatedEvent
  | BalanceUpdatedEvent
  | PositionUpdatedEvent
  | OrderUpdatedEvent
  | ExecutionReportEvent
  | TradeExecutionEvent
  | ListenKeyExpiredEvent;
