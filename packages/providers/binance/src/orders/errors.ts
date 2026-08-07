/**
 * Order-scoped errors, extending the provider's canonical {@link BinanceError} hierarchy so callers
 * catch a single family. These cover local, pre-flight failures (request validation, unsupported
 * feature, illegal state transition); venue-reported failures are translated by
 * {@link ./error-mapper}. No secret material appears in any message.
 */
import { BinanceError } from '../errors';
import type { CanonicalOrderStatus } from './canonical';

/** A canonical order request failed local validation. */
export class BinanceOrderValidationError extends BinanceError {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    super(`Order request is invalid: ${issues.join('; ')}`, 'INVALID_REQUEST', false);
    this.name = 'BinanceOrderValidationError';
    this.issues = issues;
  }
}

/** An order feature/operation is not supported on the configured market. */
export class BinanceOrderUnsupportedError extends BinanceError {
  constructor(feature: string, market: string) {
    super(
      `Order feature "${feature}" is not supported on the Binance ${market} market.`,
      'CONFIGURATION',
      false,
    );
    this.name = 'BinanceOrderUnsupportedError';
  }
}

/** An order status transition is not permitted by the documented lifecycle. */
export class BinanceOrderStateError extends BinanceError {
  readonly from: CanonicalOrderStatus;
  readonly to: CanonicalOrderStatus;
  constructor(from: CanonicalOrderStatus, to: CanonicalOrderStatus) {
    super(`Illegal order status transition ${from} → ${to}.`, 'INVALID_REQUEST', false);
    this.name = 'BinanceOrderStateError';
    this.from = from;
    this.to = to;
  }
}
