/**
 * `AccountErrorMapper` — canonicalizes any account-read failure (transport, venue-reported, or
 * validation) into the provider's {@link BinanceError} hierarchy, reusing the provider-wide
 * {@link BinanceErrorMapper}. It classifies whether a failure is *recoverable* by a fresh snapshot
 * (transport / rate-limit / server / timestamp) versus a hard failure (auth / configuration), which the
 * synchronizer uses to choose between RECOVERING and FAILED. Deterministic; no IO.
 */
import { BinanceError, BinanceErrorMapper } from '../errors';

export class AccountErrorMapper {
  constructor(private readonly base: BinanceErrorMapper = new BinanceErrorMapper()) {}

  /** Canonicalize any thrown value into a {@link BinanceError}. */
  map(error: unknown): BinanceError {
    if (error instanceof BinanceError) return error;
    return this.base.map(error);
  }

  /** Whether the failure is plausibly resolved by reloading a snapshot / retrying. */
  isRecoverable(error: unknown): boolean {
    const canonical = this.map(error);
    switch (canonical.category) {
      case 'TRANSPORT':
      case 'CIRCUIT_OPEN':
      case 'RATE_LIMIT':
      case 'SERVER':
      case 'TIMESTAMP':
        return true;
      default:
        return canonical.retryable;
    }
  }
}
