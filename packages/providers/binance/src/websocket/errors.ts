/**
 * WebSocket market-data errors, extending the provider's canonical {@link BinanceError} hierarchy so
 * callers can catch a single family. A malformed payload or a detected sequence gap surfaces here
 * (never any secret material — market-data streams are unauthenticated).
 */
import { BinanceError } from '../errors';

/** A stream payload failed structural validation. */
export class BinanceStreamValidationError extends BinanceError {
  readonly stream: string;
  constructor(stream: string, detail: string) {
    super(`Invalid ${stream} payload: ${detail}`, 'INVALID_REQUEST', false);
    this.name = 'BinanceStreamValidationError';
    this.stream = stream;
  }
}

/** An order-book sequence gap was detected; the book must be re-synchronized. */
export class BinanceSequenceGapError extends BinanceError {
  readonly symbol: string;
  readonly expected: number;
  readonly received: number;
  constructor(symbol: string, expected: number, received: number) {
    super(
      `Order-book sequence gap on ${symbol}: expected ${expected}, received ${received}.`,
      'TRANSPORT',
      true,
    );
    this.name = 'BinanceSequenceGapError';
    this.symbol = symbol;
    this.expected = expected;
    this.received = received;
  }
}

/** A requested channel is not available on the configured market. */
export class BinanceChannelUnavailableError extends BinanceError {
  constructor(channel: string, market: string) {
    super(
      `Channel "${channel}" is not available on the Binance ${market} market.`,
      'CONFIGURATION',
      false,
    );
    this.name = 'BinanceChannelUnavailableError';
  }
}
