/**
 * The clock abstraction — the single seam for wall-clock time in the ingestion pipeline. Every
 * receive/processing timestamp the pipeline stamps flows through an injected {@link Clock}, which is
 * what makes ingestion deterministic and testable (CS-3: non-determinism is injected, never accessed
 * ambiently). `SystemClock` reads the host clock; `ManualClock` gives tests full control. Nothing
 * else in the package calls `Date.now` directly.
 */

/** A monotonic-enough source of epoch-millisecond timestamps. */
export interface Clock {
  /** The current time in epoch milliseconds. */
  now(): number;
}

/** The production clock, backed by the host `Date.now`. */
export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/**
 * A deterministic, controllable clock for tests and benchmarks. The virtual time only moves when the
 * caller calls {@link advance} or {@link set}, so ordering and latency assertions are reproducible.
 */
export class ManualClock implements Clock {
  private current: number;

  constructor(start = 0) {
    this.current = start;
  }

  now(): number {
    return this.current;
  }

  /** Advance the virtual clock by `ms` (must be non-negative) and return the new time. */
  advance(ms: number): number {
    if (ms < 0) throw new Error('ManualClock cannot move backwards.');
    this.current += ms;
    return this.current;
  }

  /** Set the virtual clock to an absolute time (must not move backwards). */
  set(ms: number): number {
    if (ms < this.current) throw new Error('ManualClock cannot move backwards.');
    this.current = ms;
    return this.current;
  }
}
