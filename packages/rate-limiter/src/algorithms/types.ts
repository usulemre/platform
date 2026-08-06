/**
 * The rate-limit algorithm contract. Every algorithm is a pure, deterministic function of the weight
 * requested and the current time (supplied by the caller — never read ambiently). `tryAcquire`
 * consumes capacity when it returns `allowed`, and otherwise reports how long to wait. This keeps the
 * algorithms testable and reproducible; the async waiting/queuing lives in the scheduler above them.
 */

/** The immutable parameters shared by every algorithm. */
export interface RateLimitParams {
  /** The number of permits allowed per `intervalMs`. */
  readonly limit: number;
  /** The refill/window interval in milliseconds. */
  readonly intervalMs: number;
  /** Optional burst capacity (bucket size); defaults to `limit`. */
  readonly burst?: number;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  /** Milliseconds until enough capacity exists for the request; 0 when allowed. */
  readonly retryAfterMs: number;
  /** Remaining capacity after this call (algorithm-specific units). */
  readonly remaining: number;
}

export type RateLimitAlgorithmName =
  | 'token-bucket'
  | 'leaky-bucket'
  | 'sliding-window'
  | 'fixed-window';

export interface RateLimitAlgorithm {
  readonly name: RateLimitAlgorithmName;
  /** Attempt to consume `weight` permits at time `now`; consumes only when `allowed`. */
  tryAcquire(weight: number, now: number): RateLimitDecision;
  /** The currently available capacity at `now` (for metrics; does not consume). */
  available(now: number): number;
  /** Apply a dynamic quota update, preserving as much live state as is sensible. */
  update(params: RateLimitParams, now: number): void;
  /** Reset the algorithm to a fresh, full state as of `now`. */
  reset(now: number): void;
}

export function allowed(remaining: number): RateLimitDecision {
  return { allowed: true, retryAfterMs: 0, remaining };
}
export function denied(retryAfterMs: number, remaining: number): RateLimitDecision {
  return { allowed: false, retryAfterMs: Math.max(0, Math.ceil(retryAfterMs)), remaining };
}
