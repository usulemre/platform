/**
 * `BinanceFuturesErrorMapper` — translates any Futures failure (local validation, venue-reported
 * `{ code, msg }`, or transport/resilience error) into the canonical {@link CanonicalOrderError}. It
 * builds on the order module's {@link BinanceOrderErrorMapper} (so it inherits the shared order
 * classification) and refines it with USDⓈ-M Futures-specific reject codes (e.g. `-4028` invalid
 * leverage, `-4061` position-side mismatch, `-2027` maximum position exceeded). Deterministic; no IO.
 */
import { BinanceApiError, BinanceError } from '../errors';
import { BinanceOrderErrorMapper } from '../orders/error-mapper';
import {
  BinanceFuturesConfigError,
  BinanceFuturesUnsupportedError,
  BinanceFuturesValidationError,
} from './errors';
import type { CanonicalOrderError, CanonicalOrderErrorCategory } from '../orders/canonical';

/** USDⓈ-M Futures-specific reject codes with a known order-domain classification. */
const FUTURES_CODE_CATEGORY: Readonly<Record<number, CanonicalOrderErrorCategory>> = {
  [-2019]: 'INSUFFICIENT_BALANCE', // Margin is insufficient.
  [-2020]: 'REJECTED', // Unable to fill.
  [-2021]: 'REJECTED', // Order would immediately trigger.
  [-2022]: 'REJECTED', // ReduceOnly Order is rejected.
  [-2027]: 'REJECTED', // Exceeded the maximum allowable position at current leverage.
  [-4028]: 'VALIDATION', // Invalid leverage.
  [-4046]: 'VALIDATION', // No need to change margin type.
  [-4059]: 'VALIDATION', // No need to change position side.
  [-4061]: 'VALIDATION', // Order's position side does not match user's setting.
  [-4164]: 'VALIDATION', // Order's notional must be no smaller than the minimum.
  [-1111]: 'VALIDATION', // Precision is over the maximum defined for this asset.
};

export class BinanceFuturesErrorMapper {
  constructor(private readonly base: BinanceOrderErrorMapper = new BinanceOrderErrorMapper()) {}

  /** Canonicalize any thrown value into a {@link BinanceError}. */
  map(error: unknown): BinanceError {
    return this.base.map(error);
  }

  /** Translate any Futures failure into a canonical order error. */
  toCanonical(error: unknown): CanonicalOrderError {
    if (error instanceof BinanceFuturesValidationError)
      return { category: 'VALIDATION', message: error.message, retryable: false };
    if (error instanceof BinanceFuturesUnsupportedError)
      return { category: 'UNSUPPORTED', message: error.message, retryable: false };
    if (error instanceof BinanceFuturesConfigError)
      return { category: 'VALIDATION', message: error.message, retryable: false };

    const canonical = this.base.map(error);
    if (canonical instanceof BinanceApiError) {
      const refined = FUTURES_CODE_CATEGORY[canonical.code];
      if (refined)
        return {
          category: refined,
          message: canonical.message,
          retryable: canonical.retryable,
          venueCode: canonical.code,
          httpStatus: canonical.httpStatus,
        };
    }
    return this.base.toCanonical(error);
  }
}
