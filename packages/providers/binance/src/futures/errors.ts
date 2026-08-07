/**
 * USDⓈ-M Futures-scoped errors, extending the provider's canonical {@link BinanceError} hierarchy so
 * callers catch a single family. These cover local, pre-flight failures for Futures operations
 * (request validation, an unsupported feature, an invalid configuration request such as an
 * out-of-range leverage); venue-reported failures are translated by {@link ./error-mapper}. No secret
 * material appears in any message.
 */
import { BinanceError } from '../errors';

/** A canonical Futures order/config request failed local validation. */
export class BinanceFuturesValidationError extends BinanceError {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`Futures request is invalid: ${issues.join('; ')}`, 'INVALID_REQUEST', false);
    this.name = 'BinanceFuturesValidationError';
    this.issues = issues;
  }
}

/** A requested feature/operation is not supported (e.g. invoked on a non-Futures market). */
export class BinanceFuturesUnsupportedError extends BinanceError {
  constructor(feature: string) {
    super(`Futures feature "${feature}" is not supported on this market.`, 'CONFIGURATION', false);
    this.name = 'BinanceFuturesUnsupportedError';
  }
}

/** A Futures configuration request (leverage / margin type / position mode) is invalid. */
export class BinanceFuturesConfigError extends BinanceError {
  constructor(message: string) {
    super(message, 'INVALID_REQUEST', false);
    this.name = 'BinanceFuturesConfigError';
  }
}
