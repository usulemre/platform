/**
 * `BinanceOrderErrorMapper` — translates any order failure (local validation, venue-reported
 * `{ code, msg }`, or transport/resilience error) into the canonical {@link CanonicalOrderError}. It
 * reuses the provider-wide {@link BinanceErrorMapper} to first canonicalize the error, then refines the
 * category for the order domain (e.g. Binance code `-2010` → `INSUFFICIENT_BALANCE`, `-2013` →
 * `NOT_FOUND`). Deterministic; no IO.
 */
import { BinanceApiError, BinanceError, BinanceErrorMapper } from '../errors';
import {
  BinanceOrderStateError,
  BinanceOrderUnsupportedError,
  BinanceOrderValidationError,
} from './errors';
import type { BinanceErrorCategory } from '../errors';
import type { CanonicalOrderError, CanonicalOrderErrorCategory } from './canonical';

/** Binance order-reject codes with a known order-domain classification. */
const CODE_CATEGORY: Readonly<Record<number, CanonicalOrderErrorCategory>> = {
  [-2010]: 'INSUFFICIENT_BALANCE',
  [-2011]: 'NOT_FOUND',
  [-2013]: 'NOT_FOUND',
  [-2014]: 'REJECTED',
  [-2021]: 'REJECTED',
  [-2022]: 'REJECTED',
  [-1013]: 'REJECTED',
  [-1102]: 'VALIDATION',
  [-1100]: 'VALIDATION',
  [-1121]: 'VALIDATION',
  [-1111]: 'VALIDATION',
};

const CATEGORY_MAP: Readonly<Record<BinanceErrorCategory, CanonicalOrderErrorCategory>> = {
  CONFIGURATION: 'UNSUPPORTED',
  AUTHENTICATION: 'REJECTED',
  AUTHORIZATION: 'REJECTED',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_REQUEST: 'VALIDATION',
  ORDER_REJECTED: 'REJECTED',
  NOT_FOUND: 'NOT_FOUND',
  TIMESTAMP: 'TRANSPORT',
  MARKET_CLOSED: 'MARKET_CLOSED',
  TRANSPORT: 'TRANSPORT',
  CIRCUIT_OPEN: 'TRANSPORT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

export class BinanceOrderErrorMapper {
  constructor(private readonly base: BinanceErrorMapper = new BinanceErrorMapper()) {}

  /** Canonicalize any thrown value into a {@link BinanceError}. */
  map(error: unknown): BinanceError {
    if (error instanceof BinanceError) return error;
    return this.base.map(error);
  }

  /** Translate any order failure into a canonical order error. */
  toCanonical(error: unknown): CanonicalOrderError {
    if (error instanceof BinanceOrderValidationError)
      return { category: 'VALIDATION', message: error.message, retryable: false };
    if (error instanceof BinanceOrderUnsupportedError)
      return { category: 'UNSUPPORTED', message: error.message, retryable: false };
    if (error instanceof BinanceOrderStateError)
      return { category: 'VALIDATION', message: error.message, retryable: false };

    const canonical = this.map(error);
    if (canonical instanceof BinanceApiError) {
      const category = CODE_CATEGORY[canonical.code] ?? CATEGORY_MAP[canonical.category];
      return {
        category,
        message: canonical.message,
        retryable: canonical.retryable,
        venueCode: canonical.code,
        httpStatus: canonical.httpStatus,
      };
    }
    return {
      category: CATEGORY_MAP[canonical.category],
      message: canonical.message,
      retryable: canonical.retryable,
    };
  }
}
