/**
 * `FailureTracker` and `SuccessTracker` — the counting state of a circuit breaker. The failure tracker
 * wraps the sliding window and records success/failure outcomes while CLOSED (the signal that may open
 * the circuit). The success tracker counts consecutive successful trial calls while HALF_OPEN (the
 * signal that closes the circuit). Both are deterministic; time is always supplied by the caller.
 */
import type { SlidingWindow } from './window';

export interface FailureSnapshot {
  readonly failures: number;
  readonly successes: number;
  readonly total: number;
  readonly failureRate: number;
}

/** Tracks the recent success/failure outcomes in the sliding window (CLOSED-state signal). */
export class FailureTracker {
  constructor(private readonly window: SlidingWindow) {}

  recordSuccess(now: number): void {
    this.window.record(true, now);
  }
  recordFailure(now: number): void {
    this.window.record(false, now);
  }
  failures(now: number): number {
    return this.window.failures(now);
  }
  successes(now: number): number {
    return this.window.successes(now);
  }
  total(now: number): number {
    return this.window.total(now);
  }
  failureRate(now: number): number {
    return this.window.failureRate(now);
  }
  snapshot(now: number): FailureSnapshot {
    return {
      failures: this.window.failures(now),
      successes: this.window.successes(now),
      total: this.window.total(now),
      failureRate: this.window.failureRate(now),
    };
  }
  reset(): void {
    this.window.reset();
  }
}

/** Counts consecutive successful trial calls in HALF_OPEN (the CLOSE signal). */
export class SuccessTracker {
  private count = 0;
  record(): void {
    this.count += 1;
  }
  get successes(): number {
    return this.count;
  }
  reset(): void {
    this.count = 0;
  }
}
