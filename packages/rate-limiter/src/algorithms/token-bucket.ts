/**
 * Token Bucket — the bucket holds up to `capacity` tokens and refills continuously at
 * `limit / intervalMs` tokens per millisecond. A request of `weight` is admitted when at least
 * `weight` tokens are available; otherwise it must wait for the deficit to refill. Allows bursts up to
 * the capacity while enforcing the long-run average rate. Deterministic (time is injected).
 */
import {
  allowed,
  denied,
  type RateLimitAlgorithm,
  type RateLimitDecision,
  type RateLimitParams,
} from './types';

export class TokenBucketLimiter implements RateLimitAlgorithm {
  readonly name = 'token-bucket';
  private capacity: number;
  private refillPerMs: number;
  private tokens: number;
  private lastRefill: number;

  constructor(params: RateLimitParams, now = 0) {
    this.capacity = params.burst ?? params.limit;
    this.refillPerMs = params.limit / params.intervalMs;
    this.tokens = this.capacity;
    this.lastRefill = now;
  }

  private refill(now: number): void {
    if (now <= this.lastRefill) return;
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.lastRefill) * this.refillPerMs);
    this.lastRefill = now;
  }

  tryAcquire(weight: number, now: number): RateLimitDecision {
    this.refill(now);
    if (this.tokens >= weight) {
      this.tokens -= weight;
      return allowed(Math.floor(this.tokens));
    }
    const deficit = weight - this.tokens;
    return denied(deficit / this.refillPerMs, Math.floor(this.tokens));
  }

  available(now: number): number {
    this.refill(now);
    return Math.floor(this.tokens);
  }

  update(params: RateLimitParams, now: number): void {
    this.refill(now);
    this.capacity = params.burst ?? params.limit;
    this.refillPerMs = params.limit / params.intervalMs;
    this.tokens = Math.min(this.tokens, this.capacity);
  }

  reset(now: number): void {
    this.tokens = this.capacity;
    this.lastRefill = now;
  }
}
