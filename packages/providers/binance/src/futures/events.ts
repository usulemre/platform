/**
 * The canonical, immutable **USDⓈ-M Futures user-data events** the Futures WebSocket client emits after
 * translation. These cover the Futures-only events (`futuresConfigUpdated` from `ACCOUNT_CONFIG_UPDATE`,
 * `futuresMarginCall` from `MARGIN_CALL`) plus re-exports of the shared canonical account/order events
 * the Futures stream also delivers (reused from {@link ../auth/events}). Every model is venue-neutral
 * (asset-agnostic per CP-8) and `readonly`; no Binance field name appears here.
 */
import type { PositionSide, FuturesMarginType } from './types';
import type {
  AccountUpdatedEvent,
  ListenKeyExpiredEvent,
  OrderUpdatedEvent,
  PositionUpdatedEvent,
  ExecutionReportEvent,
  TradeExecutionEvent,
} from '../auth/events';

export type {
  AccountUpdatedEvent,
  ListenKeyExpiredEvent,
  OrderUpdatedEvent,
  PositionUpdatedEvent,
  ExecutionReportEvent,
  TradeExecutionEvent,
};

/** `ACCOUNT_CONFIG_UPDATE` → a canonical leverage / multi-assets-mode configuration change. */
export interface FuturesConfigUpdatedEvent {
  readonly kind: 'futuresConfigUpdated';
  /** Present on a leverage change. */
  readonly symbol?: string;
  readonly venueSymbol?: string;
  readonly leverage?: number;
  /** Present on a multi-assets-mode change. */
  readonly multiAssetsMode?: boolean;
  readonly eventTime: number;
  readonly transactionTime: number;
}

/** An at-risk position line within a canonical margin-call event. */
export interface FuturesMarginCallPosition {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly positionSide: PositionSide;
  readonly positionAmount: number;
  readonly marginType: FuturesMarginType;
  readonly isolatedWallet?: number;
  readonly markPrice: number;
  readonly unrealizedPnl: number;
  readonly maintenanceMargin: number;
}

/** `MARGIN_CALL` → a canonical margin-call warning. */
export interface FuturesMarginCallEvent {
  readonly kind: 'futuresMarginCall';
  readonly crossWalletBalance?: number;
  readonly positions: readonly FuturesMarginCallPosition[];
  readonly eventTime: number;
}

/** Any canonical Futures user-data event the stream emits. */
export type FuturesUserEvent =
  | AccountUpdatedEvent
  | PositionUpdatedEvent
  | OrderUpdatedEvent
  | ExecutionReportEvent
  | TradeExecutionEvent
  | FuturesConfigUpdatedEvent
  | FuturesMarginCallEvent
  | ListenKeyExpiredEvent;

/** Canonical Futures event kind → event type, for typed subscriptions. */
export interface FuturesEventMap {
  accountUpdated: AccountUpdatedEvent;
  positionUpdated: PositionUpdatedEvent;
  orderUpdated: OrderUpdatedEvent;
  executionReport: ExecutionReportEvent;
  tradeExecution: TradeExecutionEvent;
  futuresConfigUpdated: FuturesConfigUpdatedEvent;
  futuresMarginCall: FuturesMarginCallEvent;
  listenKeyExpired: ListenKeyExpiredEvent;
}
