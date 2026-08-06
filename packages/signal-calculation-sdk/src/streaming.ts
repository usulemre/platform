/**
 * Streaming (incremental) signal evaluators. Each accepts one bar/value at a time via `push`,
 * returning the current signal (`NaN` during warm-up), and supports `reset`. They are stateful
 * (one instance per stream, NOT thread-safe) and reproduce their batch counterpart exactly — the
 * basis for O(1) incremental recomputation on live data.
 */
import { RsiStream, SmaStream } from '@platform/feature-calculation-sdk';
import { FLAT, LONG, SHORT } from './types';

/** Common interface for incremental signal evaluators. */
export interface StreamingSignal {
  /** Push the next input; returns the current signal (`NaN` during warm-up). */
  push(value: number): number;
  /** Reset to the initial (empty) state. */
  reset(): void;
}

/** Incremental Moving-Average Crossover — matches `maCrossover` (over `close`). */
export class MaCrossoverStream implements StreamingSignal {
  private readonly fastMa: SmaStream;
  private readonly slowMa: SmaStream;

  constructor(fast = 12, slow = 26) {
    if (fast >= slow) throw new RangeError(`fast (${fast}) must be < slow (${slow})`);
    this.fastMa = new SmaStream(fast);
    this.slowMa = new SmaStream(slow);
  }

  push(value: number): number {
    const f = this.fastMa.push(value);
    const s = this.slowMa.push(value);
    if (Number.isNaN(f) || Number.isNaN(s)) return NaN;
    return f > s ? LONG : f < s ? SHORT : FLAT;
  }

  reset(): void {
    this.fastMa.reset();
    this.slowMa.reset();
  }
}

/** Incremental RSI Threshold signal — matches `rsiThresholdSignal` (over `close`). */
export class RsiThresholdStream implements StreamingSignal {
  private readonly rsiStream: RsiStream;

  constructor(
    window = 14,
    private readonly lower = 30,
    private readonly upper = 70,
  ) {
    if (lower > upper) throw new RangeError(`lower (${lower}) must be ≤ upper (${upper})`);
    this.rsiStream = new RsiStream(window);
  }

  push(value: number): number {
    const r = this.rsiStream.push(value);
    if (Number.isNaN(r)) return NaN;
    return r < this.lower ? LONG : r > this.upper ? SHORT : FLAT;
  }

  reset(): void {
    this.rsiStream.reset();
  }
}
