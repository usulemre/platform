/**
 * USDⓈ-M Futures enumerations and the deterministic canonical⇄venue translations for Futures-specific
 * vocabulary (order type, position side, margin type, working type, position mode). These are the
 * single source of truth for the Futures order semantics that differ from Spot; the request builder,
 * validator and mappers consult them so no undocumented enum value is ever sent to or read from the
 * venue. Pure reference data — no transport, no policy.
 */
import type {
  FuturesMarginType,
  FuturesOrderType,
  FuturesPositionMode,
  FuturesWorkingType,
  PositionSide,
} from './types';

/** The officially-documented USDⓈ-M Futures order types. */
export const FUTURES_ORDER_TYPES = [
  'LIMIT',
  'MARKET',
  'STOP',
  'STOP_MARKET',
  'TAKE_PROFIT',
  'TAKE_PROFIT_MARKET',
  'TRAILING_STOP_MARKET',
] as const;

/** The officially-documented USDⓈ-M Futures position sides. */
export const FUTURES_POSITION_SIDES: readonly PositionSide[] = ['BOTH', 'LONG', 'SHORT'];

/** The officially-documented USDⓈ-M Futures margin types (venue spelling). */
export const FUTURES_MARGIN_TYPES: readonly FuturesMarginType[] = ['ISOLATED', 'CROSSED'];

/** The officially-documented USDⓈ-M Futures stop-price working types. */
export const FUTURES_WORKING_TYPES: readonly FuturesWorkingType[] = [
  'MARK_PRICE',
  'CONTRACT_PRICE',
];

/**
 * Canonical Futures order type → venue order type. `hasPrice` selects between the limit-style and
 * market-style variants of STOP / TAKE_PROFIT, matching the documented Futures order-type names.
 */
export function toFuturesOrderType(type: FuturesOrderType, hasPrice: boolean): string {
  switch (type) {
    case 'MARKET':
      return 'MARKET';
    case 'LIMIT':
      return 'LIMIT';
    case 'STOP':
      return hasPrice ? 'STOP' : 'STOP_MARKET';
    case 'STOP_LIMIT':
      return 'STOP';
    case 'TAKE_PROFIT':
      return hasPrice ? 'TAKE_PROFIT' : 'TAKE_PROFIT_MARKET';
    case 'TRAILING_STOP':
      return 'TRAILING_STOP_MARKET';
  }
}

const CANONICAL_BY_VENUE_TYPE: Readonly<Record<string, FuturesOrderType>> = {
  LIMIT: 'LIMIT',
  MARKET: 'MARKET',
  STOP: 'STOP_LIMIT',
  STOP_MARKET: 'STOP',
  TAKE_PROFIT: 'TAKE_PROFIT',
  TAKE_PROFIT_MARKET: 'TAKE_PROFIT',
  TRAILING_STOP_MARKET: 'TRAILING_STOP',
};

/** Venue Futures order type → canonical Futures order type (`LIMIT` for unknown, fail-soft). */
export function fromFuturesOrderType(type: string): FuturesOrderType {
  return CANONICAL_BY_VENUE_TYPE[type.toUpperCase()] ?? 'LIMIT';
}

/** Normalize a venue position-side string to the canonical enum (`BOTH` for unknown). */
export function toCanonicalPositionSide(side: string | undefined): PositionSide {
  const value = (side ?? 'BOTH').toUpperCase();
  return value === 'LONG' || value === 'SHORT' ? (value as PositionSide) : 'BOTH';
}

/** Normalize a venue margin-type string (`cross`/`crossed`/`isolated`) to the canonical enum. */
export function toCanonicalMarginType(marginType: string | undefined): FuturesMarginType {
  return (marginType ?? '').toUpperCase().startsWith('ISOLAT') ? 'ISOLATED' : 'CROSSED';
}

/** The venue `dualSidePosition` flag → canonical position mode. */
export function toPositionMode(dualSidePosition: boolean): FuturesPositionMode {
  return dualSidePosition ? 'HEDGE' : 'ONE_WAY';
}

/** The canonical position mode → the venue `dualSidePosition` flag. */
export function fromPositionMode(mode: FuturesPositionMode): boolean {
  return mode === 'HEDGE';
}
