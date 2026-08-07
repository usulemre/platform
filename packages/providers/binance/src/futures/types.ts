/**
 * The canonical **USDⓈ-M Futures domain models** the Futures integration (Phase 9.1.7) exposes — the
 * venue-neutral shapes the rest of the platform speaks for Futures-specific concepts (leverage, margin
 * type, position mode, mark price, funding, rich positions and the Futures account). They extend the
 * base canonical trading vocabulary ({@link ../types/canonical}) rather than redefining it, and reuse
 * the canonical position side already defined by the account module. Every model is immutable and
 * asset-agnostic (CP-8); no Binance field name appears here — those are confined to
 * {@link ../types/binance} and translated by the Futures mappers.
 */
import type { PositionSide } from '../account/canonical';
import type { CanonicalCommission, CanonicalFill } from '../orders/canonical';
import type { CanonicalOrder, CanonicalOrderRequest, CanonicalOrderType } from '../types/canonical';

export type { PositionSide };

/** Canonical Futures margin mode. */
export type FuturesMarginType = 'ISOLATED' | 'CROSSED';

/** Canonical Futures position mode (`ONE_WAY` = single BOTH position; `HEDGE` = dual LONG/SHORT). */
export type FuturesPositionMode = 'ONE_WAY' | 'HEDGE';

/** Canonical stop/trigger price basis for conditional Futures orders. */
export type FuturesWorkingType = 'MARK_PRICE' | 'CONTRACT_PRICE';

/** The direction of an isolated position-margin adjustment. */
export type FuturesMarginDirection = 'ADD' | 'REDUCE';

/**
 * Canonical Futures order type. Extends the base canonical order types with `TRAILING_STOP`, the only
 * additional order class USDⓈ-M Futures documents (`TRAILING_STOP_MARKET`).
 */
export type FuturesOrderType = CanonicalOrderType | 'TRAILING_STOP';

/**
 * A canonical Futures order request — the base canonical request plus the officially-documented
 * USDⓈ-M Futures order fields. Only fields Binance Futures documents are present.
 */
export interface FuturesOrderRequest extends Omit<CanonicalOrderRequest, 'type'> {
  readonly type: FuturesOrderType;
  /** Position side (`BOTH` in one-way mode; `LONG`/`SHORT` in hedge mode). */
  readonly positionSide?: PositionSide;
  /** Close the entire position (`closePosition=true`); mutually exclusive with `quantity`. */
  readonly closePosition?: boolean;
  /** Activation price for `TRAILING_STOP_MARKET` orders. */
  readonly activationPrice?: number;
  /** Callback rate (percent) for `TRAILING_STOP_MARKET` orders. */
  readonly callbackRate?: number;
  /** Trigger price basis for STOP/TAKE_PROFIT orders. */
  readonly workingType?: FuturesWorkingType;
  /** Enable Futures price protection on conditional orders. */
  readonly priceProtection?: boolean;
}

/** A canonical Futures order (base canonical order enriched with Futures-only fields). */
export interface FuturesOrder extends Omit<CanonicalOrder, 'type'> {
  readonly type: FuturesOrderType;
  readonly positionSide?: PositionSide;
  readonly closePosition?: boolean;
  readonly stopPrice?: number;
  readonly workingType?: FuturesWorkingType;
  readonly activatePrice?: number;
  readonly priceRate?: number;
}

/** The canonical response to a Futures create/modify operation: the Futures order plus its fills. */
export interface FuturesOrderResponse {
  readonly order: FuturesOrder;
  readonly fills: readonly CanonicalFill[];
  readonly commissions: readonly CanonicalCommission[];
  readonly transactTime?: number;
}

/** The result of a leverage change (`POST /fapi/v1/leverage`). */
export interface FuturesLeverage {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly leverage: number;
  readonly maxNotionalValue: number;
}

/** The result of a margin-type change (`POST /fapi/v1/marginType`). */
export interface FuturesMarginTypeChange {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly marginType: FuturesMarginType;
  readonly acknowledged: boolean;
}

/** The account's current position mode (`GET/POST /fapi/v1/positionSide/dual`). */
export interface FuturesPositionModeState {
  readonly mode: FuturesPositionMode;
}

/** The result of an isolated position-margin change (`POST /fapi/v1/positionMargin`). */
export interface FuturesPositionMarginChange {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly amount: number;
  readonly direction: FuturesMarginDirection;
  readonly acknowledged: boolean;
}

/** Mark price, index price and current funding data (`GET /fapi/v1/premiumIndex`). */
export interface FuturesMarkPrice {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly markPrice: number;
  readonly indexPrice?: number;
  readonly estimatedSettlePrice?: number;
  readonly lastFundingRate?: number;
  readonly interestRate?: number;
  readonly nextFundingTime?: number;
  readonly time?: number;
}

/** A historical funding-rate observation (`GET /fapi/v1/fundingRate`). */
export interface FuturesFundingRate {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly fundingRate: number;
  readonly fundingTime: number;
  readonly markPrice?: number;
}

/** A single notional/leverage bracket. */
export interface FuturesBracket {
  readonly bracket: number;
  readonly initialLeverage: number;
  readonly notionalCap: number;
  readonly notionalFloor: number;
  readonly maintMarginRatio: number;
  readonly cum?: number;
}

/** A symbol's notional/leverage brackets (`GET /fapi/v1/leverageBracket`). */
export interface FuturesLeverageBracket {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly brackets: readonly FuturesBracket[];
}

/** A canonical, rich Futures position (`GET /fapi/v2/positionRisk` or the account document). */
export interface FuturesPosition {
  readonly symbol: string;
  readonly venueSymbol: string;
  readonly positionSide: PositionSide;
  readonly positionAmount: number;
  readonly entryPrice: number;
  readonly markPrice?: number;
  readonly liquidationPrice?: number;
  readonly unrealizedPnl: number;
  readonly leverage?: number;
  readonly marginType: FuturesMarginType;
  readonly isolatedMargin?: number;
  readonly isolatedWallet?: number;
  readonly notional?: number;
  readonly maxNotionalValue?: number;
  readonly initialMargin?: number;
  readonly maintMargin?: number;
  readonly updateTime?: number;
}

/** A canonical Futures wallet balance line. */
export interface FuturesBalance {
  readonly asset: string;
  readonly walletBalance: number;
  readonly availableBalance: number;
  readonly crossWalletBalance?: number;
  readonly crossUnrealizedPnl?: number;
  readonly marginBalance?: number;
  readonly maxWithdrawAmount?: number;
  readonly initialMargin?: number;
  readonly maintMargin?: number;
  readonly unrealizedPnl?: number;
}

/** The canonical Futures account aggregate (`GET /fapi/v2/account`). */
export interface FuturesAccount {
  readonly canTrade: boolean;
  readonly feeTier?: number;
  readonly totalWalletBalance: number;
  readonly totalUnrealizedProfit: number;
  readonly totalMarginBalance: number;
  readonly availableBalance: number;
  readonly assets: readonly FuturesBalance[];
  readonly positions: readonly FuturesPosition[];
  readonly updateTime: number;
}
