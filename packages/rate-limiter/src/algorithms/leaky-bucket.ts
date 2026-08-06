/**
 * Leaky Bucket (as a meter) — the bucket fills by `weight` on each admitted request and leaks
 * continuously at `limit / intervalMs` per millisecond. A request is admitted while the resulting
 * level stays within `capacity`; otherwise it must wait for the level to drain. This smooths bursts
 * into a steady output rate with a bounded buffer. Deterministic (time is injected).
 */
import {
  allowed,
  denied,
  type RateLimitAlgorithm,
  type RateLimitDecision,
  type RateLimitParams,
} from './types';

export class LeakyBucketLimiter implements RateLimitAlgorithm {
  readonly name = 'leaky-bucket';
  private capacity: number;
  private leakPerMs: number;
  private level: number;
  private lastLeak: number;

  constructor(params: RateLimitParams, now = 0) {
    this.capacity = params.burst ?? params.limit;
    this.leakPerMs = params.limit / params.intervalMs;
    this.level = 0;
    this.lastLeak = now;
  }

  private leak(now: number): void {
    if (now <= this.lastLeak) return;
    this.level = Math.max(0, this.level - (now - this.lastLeak) * this.leakPerMs);
    this.lastLeak = now;
  }

  tryAcquire(weight: number, now: number): RateLimitDecision {
    this.leak(now);
    if (this.level + weight <= this.capacity) {
      this.level += weight;
      return allowed(Math.floor(this.capacity - this.level));
    }
    const overflow = this.level + weight - this.capacity;
    return denied(overflow / this.leakPerMs, Math.floor(Math.max(0, this.capacity - this.level)));
  }

  available(now: number): number {
    this.leak(now);
    return Math.floor(Math.max(0, this.capacity - this.level));
  }

  update(params: RateLimitParams, now: number): void {
    this.leak(now);
    this.capacity = params.burst ?? params.limit;
    this.leakPerMs = params.limit / params.intervalMs;
    this.level = Math.min(this.level, this.capacity);
  }

  reset(now: number): void {
    this.level = 0;
    this.lastLeak = now;
  }
}
