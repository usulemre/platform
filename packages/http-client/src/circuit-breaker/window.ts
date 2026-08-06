/**
 * Sliding windows — the bounded statistics behind the failure decision. A `CountSlidingWindow` keeps
 * the last N outcomes; a `TimeSlidingWindow` keeps outcomes within the last `windowMs`. Both are
 * deterministic (time is supplied by the caller, never read ambiently) and expose success/failure
 * counts and the failure rate. Only success/failure outcomes are recorded; ignored outcomes never
 * reach the window.
 */

export interface SlidingWindow {
  readonly kind: 'count' | 'time';
  record(success: boolean, now: number): void;
  successes(now: number): number;
  failures(now: number): number;
  total(now: number): number;
  failureRate(now: number): number;
  reset(): void;
}

/** A ring buffer of the last `size` outcomes. */
export class CountSlidingWindow implements SlidingWindow {
  readonly kind = 'count';
  private readonly buffer: boolean[] = [];
  private index = 0;
  constructor(private readonly size: number) {
    if (size <= 0) throw new RangeError(`Count window size must be positive, received ${size}`);
  }
  record(success: boolean, _now?: number): void {
    if (this.buffer.length < this.size) this.buffer.push(success);
    else {
      this.buffer[this.index] = success;
      this.index = (this.index + 1) % this.size;
    }
  }
  successes(_now?: number): number {
    return this.buffer.filter((s) => s).length;
  }
  failures(_now?: number): number {
    return this.buffer.filter((s) => !s).length;
  }
  total(_now?: number): number {
    return this.buffer.length;
  }
  failureRate(_now?: number): number {
    return this.buffer.length === 0 ? 0 : this.failures() / this.buffer.length;
  }
  reset(): void {
    this.buffer.length = 0;
    this.index = 0;
  }
}

interface TimedOutcome {
  readonly at: number;
  readonly success: boolean;
}

/** Outcomes within a rolling time window of `windowMs`. */
export class TimeSlidingWindow implements SlidingWindow {
  readonly kind = 'time';
  private entries: TimedOutcome[] = [];
  constructor(private readonly windowMs: number) {
    if (windowMs <= 0) throw new RangeError(`Time window must be positive, received ${windowMs}`);
  }
  private evict(now: number): void {
    const cutoff = now - this.windowMs;
    if (this.entries.length > 0 && this.entries[0]!.at <= cutoff) {
      this.entries = this.entries.filter((e) => e.at > cutoff);
    }
  }
  record(success: boolean, now: number): void {
    this.evict(now);
    this.entries.push({ at: now, success });
  }
  successes(now: number): number {
    this.evict(now);
    return this.entries.filter((e) => e.success).length;
  }
  failures(now: number): number {
    this.evict(now);
    return this.entries.filter((e) => !e.success).length;
  }
  total(now: number): number {
    this.evict(now);
    return this.entries.length;
  }
  failureRate(now: number): number {
    this.evict(now);
    return this.entries.length === 0
      ? 0
      : this.entries.filter((e) => !e.success).length / this.entries.length;
  }
  reset(): void {
    this.entries = [];
  }
}
