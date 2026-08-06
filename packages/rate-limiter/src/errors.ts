/**
 * Rate-limiter rejection errors. `acquire` rejects with a `RateLimitRejectedError` carrying the reason
 * (backpressure queue full, wait-deadline exceeded, or cancellation) and the suggested retry-after.
 * The HTTP middleware translates this into the platform's `HttpRateLimitError`.
 */

export type RateLimitReason = 'queue-full' | 'timeout' | 'aborted' | 'disabled';

export class RateLimitRejectedError extends Error {
  readonly reason: RateLimitReason;
  readonly scope: string;
  readonly retryAfterMs: number;
  constructor(scope: string, reason: RateLimitReason, retryAfterMs = 0) {
    super(`Rate limit rejected on "${scope}" (${reason}).`);
    this.name = 'RateLimitRejectedError';
    this.scope = scope;
    this.reason = reason;
    this.retryAfterMs = retryAfterMs;
  }
}

export function isRateLimitRejected(value: unknown): value is RateLimitRejectedError {
  return value instanceof RateLimitRejectedError;
}
