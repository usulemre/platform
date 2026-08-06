/**
 * Sliding Window (log) — keeps the timestamped weight of every admitted request within the last
 * `intervalMs` and admits a new request only while the rolling sum stays within `limit`. Exact and
 * boundary-free (no fixed-window burst artifact), at the cost of retaining recent entries.
 * Deterministic (time is injected).
 */
import {
  allowed,
  denied,
  type RateLimitAlgorithm,
  type RateLimitDecision,
  type RateLimitParams,
} from './types';

interface Entry {
  readonly at: number;
  readonly weight: number;
}

export class SlidingWindowLimiter implements RateLimitAlgorithm {
  readonly name = 'sliding-window';
  private limit: number;
  private windowMs: number;
  private entries: Entry[] = [];

  constructor(params: RateLimitParams) {
    this.limit = params.limit;
    this.windowMs = params.intervalMs;
  }

  private evict(now: number): void {
    const cutoff = now - this.windowMs;
    if (this.entries.length > 0 && this.entries[0]!.at <= cutoff) {
      this.entries = this.entries.filter((e) => e.at > cutoff);
    }
  }
  private sum(): number {
    return this.entries.reduce((total, e) => total + e.weight, 0);
  }

  tryAcquire(weight: number, now: number): RateLimitDecision {
    this.evict(now);
    const used = this.sum();
    if (used + weight <= this.limit) {
      this.entries.push({ at: now, weight });
      return allowed(this.limit - used - weight);
    }
    const oldest = this.entries[0];
    const retryAfter = oldest ? oldest.at + this.windowMs - now : this.windowMs;
    return denied(retryAfter, Math.max(0, this.limit - used));
  }

  available(now: number): number {
    this.evict(now);
    return Math.max(0, this.limit - this.sum());
  }

  update(params: RateLimitParams, now: number): void {
    this.evict(now);
    this.limit = params.limit;
    this.windowMs = params.intervalMs;
  }

  reset(): void {
    this.entries = [];
  }
}
