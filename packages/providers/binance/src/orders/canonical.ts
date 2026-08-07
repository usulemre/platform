/**
 * The canonical **order-execution domain models** the order module exposes — the venue-neutral shapes
 * the rest of the platform speaks. It reuses the base order vocabulary already defined in
 * {@link ../types/canonical} (order, request, status, type, side, time-in-force, execution) and adds
 * the execution-result models the order lifecycle needs: fills, commission, the full order response
 * and a canonical order error. All models are immutable; no Binance field name appears here (asset
 * agnostic, CP-8).
 */
import type {
  CanonicalOrder,
  CanonicalOrderRequest,
  CanonicalOrderStatus,
  CanonicalOrderType,
  CanonicalSide,
  CanonicalTimeInForce,
  CanonicalExecution,
  CanonicalTrade,
} from '../types/canonical';

export type {
  CanonicalOrder,
  CanonicalOrderRequest,
  CanonicalOrderStatus,
  CanonicalOrderType,
  CanonicalSide,
  CanonicalTimeInForce,
  CanonicalExecution,
  CanonicalTrade,
};

/** Alias: the canonical order side (mirrors {@link CanonicalSide}). */
export type CanonicalOrderSide = CanonicalSide;

/** A single fill (partial execution) of an order. */
export interface CanonicalFill {
  readonly tradeId?: number;
  readonly price: number;
  readonly quantity: number;
  readonly commission: number;
  readonly commissionAsset?: string;
  readonly quoteQuantity?: number;
  readonly isMaker?: boolean;
}

/** A canonical commission (an amount denominated in an asset). */
export interface CanonicalCommission {
  readonly amount: number;
  readonly asset?: string;
}

/** The canonical response to a create/query/replace operation: the order plus its fills. */
export interface CanonicalOrderResponse {
  readonly order: CanonicalOrder;
  readonly fills: readonly CanonicalFill[];
  /** Aggregate commission across fills (grouped by asset when uniform). */
  readonly commissions: readonly CanonicalCommission[];
  readonly transactTime?: number;
}

/** Canonical order-error categories (a subset of the provider error categories, order-scoped). */
export type CanonicalOrderErrorCategory =
  | 'VALIDATION'
  | 'INSUFFICIENT_BALANCE'
  | 'REJECTED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'RATE_LIMIT'
  | 'MARKET_CLOSED'
  | 'UNSUPPORTED'
  | 'TRANSPORT'
  | 'SERVER'
  | 'UNKNOWN';

/** A canonical, immutable order error (venue code preserved for provenance). */
export interface CanonicalOrderError {
  readonly category: CanonicalOrderErrorCategory;
  readonly message: string;
  readonly retryable: boolean;
  readonly venueCode?: number;
  readonly httpStatus?: number;
}
