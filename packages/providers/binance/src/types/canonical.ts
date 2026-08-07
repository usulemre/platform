/**
 * The **canonical trading vocabulary** the Binance provider translates to and from — the
 * venue-neutral shapes the rest of the platform speaks. Where the Broker Gateway SDK already defines a
 * canonical account-sync shape ({@link PositionSnapshot}, {@link BalanceSnapshot},
 * {@link OrderSyncRecord}) the provider maps directly onto it; the richer order/trade/execution/symbol
 * models below fill the gaps the SDK is silent on so a full round-trip mapping exists. These are inert
 * data shapes only — no venue specifics leak in (asset-agnostic per CP-8); every Binance-specific
 * field is confined to {@link ./binance}.
 */
import type {
  AssetClass,
  BalanceSnapshot,
  OrderSyncRecord,
  PositionSnapshot,
} from '@platform/broker-sdk';

export type { AssetClass, BalanceSnapshot, OrderSyncRecord, PositionSnapshot };

/** Canonical order side. */
export type CanonicalSide = 'BUY' | 'SELL';

/** Canonical order type (venue-neutral). */
export type CanonicalOrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'TAKE_PROFIT';

/** Canonical time-in-force. */
export type CanonicalTimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';

/** Canonical order lifecycle status (venue statuses collapse onto these). */
export type CanonicalOrderStatus =
  | 'NEW'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELED'
  | 'PENDING_CANCEL'
  | 'REJECTED'
  | 'EXPIRED';

/** A canonical order request (submission intent), venue-neutral. */
export interface CanonicalOrderRequest {
  readonly symbol: string;
  readonly side: CanonicalSide;
  readonly type: CanonicalOrderType;
  readonly quantity: number;
  /** Quote-asset amount to spend (venue-permitting: Spot MARKET orders only). */
  readonly quoteQuantity?: number;
  readonly price?: number;
  readonly stopPrice?: number;
  readonly timeInForce?: CanonicalTimeInForce;
  readonly clientOrderId?: string;
  readonly reduceOnly?: boolean;
}

/** A canonical order (venue order projected onto the neutral model). */
export interface CanonicalOrder {
  readonly venueOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: CanonicalSide;
  readonly type: CanonicalOrderType;
  readonly status: CanonicalOrderStatus;
  readonly quantity: number;
  readonly filledQuantity: number;
  readonly remainingQuantity: number;
  readonly price?: number;
  readonly averagePrice?: number;
  readonly timeInForce?: CanonicalTimeInForce;
  readonly reduceOnly?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

/** A canonical fill/trade. */
export interface CanonicalTrade {
  readonly tradeId: string;
  readonly venueOrderId: string;
  readonly symbol: string;
  readonly side: CanonicalSide;
  readonly price: number;
  readonly quantity: number;
  readonly fee: number;
  readonly feeCurrency: string;
  readonly maker: boolean;
  readonly executedAt: string;
}

/** A canonical execution event (a state change reported by the venue user-data stream). */
export interface CanonicalExecution {
  readonly venueOrderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: CanonicalSide;
  readonly status: CanonicalOrderStatus;
  readonly lastFilledQuantity: number;
  readonly cumulativeFilledQuantity: number;
  readonly lastFilledPrice: number;
  readonly orderType: CanonicalOrderType;
  readonly eventAt: string;
}

/** A canonical instrument/symbol definition. */
export interface CanonicalSymbol {
  readonly symbol: string;
  readonly baseAsset: string;
  readonly quoteAsset: string;
  readonly assetClass: AssetClass;
  readonly status: string;
  readonly pricePrecision: number;
  readonly quantityPrecision: number;
  readonly tickSize?: number;
  readonly stepSize?: number;
  readonly minNotional?: number;
}

/** A single price level in an order book. */
export interface CanonicalBookLevel {
  readonly price: number;
  readonly quantity: number;
}

/** A canonical order-book snapshot. */
export interface CanonicalOrderBook {
  readonly symbol: string;
  readonly lastUpdateId: number;
  readonly bids: readonly CanonicalBookLevel[];
  readonly asks: readonly CanonicalBookLevel[];
}

/** A canonical OHLCV bar. */
export interface CanonicalKline {
  readonly symbol: string;
  readonly interval: string;
  readonly openTime: number;
  readonly closeTime: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
  readonly closed: boolean;
}

/** A canonical ticker (best bid/ask + last). */
export interface CanonicalTicker {
  readonly symbol: string;
  readonly lastPrice: number;
  readonly bidPrice?: number;
  readonly askPrice?: number;
  readonly at: number;
}
