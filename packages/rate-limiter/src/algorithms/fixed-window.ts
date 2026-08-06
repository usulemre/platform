/**
 * Fixed Window — time is divided into aligned windows of `intervalMs`; each window admits up to
 * `limit` weighted permits and the counter resets at the window boundary. Simple and exact within a
 * window, at the cost of a possible 2× burst across a boundary. Deterministic (time is injected).
 */
import {
  allowed,
  denied,
  type RateLimitAlgorithm,
  type RateLimitDecision,
  type RateLimitParams,
} from './types';

export class FixedWindowLimiter implements RateLimitAlgorithm {
  readonly name = 'fixed-window';
  private limit: number;
  private windowMs: number;
  private windowStart: number;
  private count = 0;

  constructor(params: RateLimitParams, now = 0) {
    this.limit = params.limit;
    this.windowMs = params.intervalMs;
    this.windowStart = this.alignedStart(now);
  }

  private alignedStart(now: number): number {
    return Math.floor(now / this.windowMs) * this.windowMs;
  }

  private roll(now: number): void {
    const start = this.alignedStart(now);
    if (start > this.windowStart) {
      this.windowStart = start;
      this.count = 0;
    }
  }

  tryAcquire(weight: number, now: number): RateLimitDecision {
    this.roll(now);
    if (this.count + weight <= this.limit) {
      this.count += weight;
      return allowed(this.limit - this.count);
    }
    return denied(this.windowStart + this.windowMs - now, Math.max(0, this.limit - this.count));
  }

  available(now: number): number {
    this.roll(now);
    return Math.max(0, this.limit - this.count);
  }

  update(params: RateLimitParams, now: number): void {
    this.roll(now);
    this.limit = params.limit;
    this.windowMs = params.intervalMs;
  }

  reset(now: number): void {
    this.windowStart = this.alignedStart(now);
    this.count = 0;
  }
}
