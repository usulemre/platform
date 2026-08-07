/**
 * `BinanceFuturesCapabilityRegistry` — the truthful declaration of which USDⓈ-M Futures operations,
 * order types, times-in-force and Futures features Binance officially supports. The request builder
 * and validator consult it so no undocumented feature is ever sent to the venue. Deterministic
 * reference data; it enforces no policy and performs no IO.
 */
import { FUTURES_ORDER_TYPES } from './constants';
import type { CanonicalTimeInForce } from '../types/canonical';
import type { FuturesOrderType } from './types';

/** The Futures operations the integration exposes. */
export type FuturesOperation =
  | 'CREATE_ORDER'
  | 'QUERY_ORDER'
  | 'CANCEL_ORDER'
  | 'CANCEL_ALL_ORDERS'
  | 'MODIFY_ORDER'
  | 'SET_LEVERAGE'
  | 'SET_MARGIN_TYPE'
  | 'SET_POSITION_MODE'
  | 'MODIFY_POSITION_MARGIN'
  | 'QUERY_POSITIONS'
  | 'QUERY_ACCOUNT'
  | 'QUERY_BALANCE'
  | 'MARK_PRICE'
  | 'FUNDING_RATE'
  | 'LEVERAGE_BRACKET';

/** The canonical Futures order types (a subset of {@link FuturesOrderType}). */
const CANONICAL_ORDER_TYPES: readonly FuturesOrderType[] = [
  'MARKET',
  'LIMIT',
  'STOP',
  'STOP_LIMIT',
  'TAKE_PROFIT',
  'TRAILING_STOP',
];

const OPERATIONS: readonly FuturesOperation[] = [
  'CREATE_ORDER',
  'QUERY_ORDER',
  'CANCEL_ORDER',
  'CANCEL_ALL_ORDERS',
  'MODIFY_ORDER',
  'SET_LEVERAGE',
  'SET_MARGIN_TYPE',
  'SET_POSITION_MODE',
  'MODIFY_POSITION_MARGIN',
  'QUERY_POSITIONS',
  'QUERY_ACCOUNT',
  'QUERY_BALANCE',
  'MARK_PRICE',
  'FUNDING_RATE',
  'LEVERAGE_BRACKET',
];

const TIME_IN_FORCE: readonly CanonicalTimeInForce[] = ['GTC', 'IOC', 'FOK', 'GTD'];

export class BinanceFuturesCapabilityRegistry {
  /** Every supported Futures operation. */
  operations(): readonly FuturesOperation[] {
    return OPERATIONS;
  }

  /** Whether an operation is supported. */
  supportsOperation(operation: FuturesOperation): boolean {
    return OPERATIONS.includes(operation);
  }

  /** The canonical order types supported for submission. */
  orderTypes(): readonly FuturesOrderType[] {
    return CANONICAL_ORDER_TYPES;
  }

  /** Whether a canonical order type is supported. */
  supportsOrderType(type: FuturesOrderType): boolean {
    return CANONICAL_ORDER_TYPES.includes(type);
  }

  /** The documented venue order-type names (for reference/audit). */
  venueOrderTypes(): readonly string[] {
    return FUTURES_ORDER_TYPES;
  }

  /** The supported times-in-force. */
  timeInForce(): readonly CanonicalTimeInForce[] {
    return TIME_IN_FORCE;
  }

  /** Whether a time-in-force is supported. */
  supportsTimeInForce(tif: CanonicalTimeInForce): boolean {
    return TIME_IN_FORCE.includes(tif);
  }

  /** USDⓈ-M Futures supports `reduceOnly`. */
  readonly supportsReduceOnly = true;
  /** USDⓈ-M Futures supports `closePosition`. */
  readonly supportsClosePosition = true;
  /** USDⓈ-M Futures supports hedge-mode `positionSide`. */
  readonly supportsPositionSide = true;
  /** USDⓈ-M Futures supports a stop-price `workingType`. */
  readonly supportsWorkingType = true;
  /** USDⓈ-M Futures supports conditional-order price protection. */
  readonly supportsPriceProtection = true;
}
