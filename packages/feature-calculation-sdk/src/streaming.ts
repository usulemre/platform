/**
 * Streaming (incremental) feature calculators. Each accepts one value at a time via `push`,
 * returning the current output (`NaN` during warm-up), and supports `reset`. They are stateful
 * and therefore NOT thread-safe: use one instance per stream. Given the same sequence of
 * pushes, each produces exactly the batch result of its vectorized counterpart — enabling O(1)
 * incremental recomputation for live/streaming updates without re-scanning history.
 */

/** Common interface for incremental calculators. */
export interface StreamingFeature {
  /** Push the next input value; returns the current output (`NaN` during warm-up). */
  push(value: number): number;
  /** Reset to the initial (empty) state. */
  reset(): void;
}

/** Incremental Simple Moving Average (O(1) per push) — matches `sma`. */
export class SmaStream implements StreamingFeature {
  private readonly ring: Float64Array;
  private index = 0;
  private filled = 0;
  private sum = 0;
  private nan = 0;

  constructor(private readonly window: number) {
    if (!Number.isInteger(window) || window <= 0)
      throw new RangeError('window must be a positive integer');
    this.ring = new Float64Array(window);
  }

  push(value: number): number {
    if (this.filled === this.window) {
      const old = this.ring[this.index]!;
      if (Number.isNaN(old)) this.nan -= 1;
      else this.sum -= old;
    } else {
      this.filled += 1;
    }
    this.ring[this.index] = value;
    if (Number.isNaN(value)) this.nan += 1;
    else this.sum += value;
    this.index = (this.index + 1) % this.window;
    return this.filled === this.window && this.nan === 0 ? this.sum / this.window : NaN;
  }

  reset(): void {
    this.ring.fill(0);
    this.index = 0;
    this.filled = 0;
    this.sum = 0;
    this.nan = 0;
  }
}

/** Incremental rolling sum (O(1) per push) — matches `rollingSum`. */
export class RollingSumStream implements StreamingFeature {
  private readonly ring: Float64Array;
  private index = 0;
  private filled = 0;
  private sum = 0;
  private nan = 0;

  constructor(private readonly window: number) {
    if (!Number.isInteger(window) || window <= 0)
      throw new RangeError('window must be a positive integer');
    this.ring = new Float64Array(window);
  }

  push(value: number): number {
    if (this.filled === this.window) {
      const old = this.ring[this.index]!;
      if (Number.isNaN(old)) this.nan -= 1;
      else this.sum -= old;
    } else {
      this.filled += 1;
    }
    this.ring[this.index] = value;
    if (Number.isNaN(value)) this.nan += 1;
    else this.sum += value;
    this.index = (this.index + 1) % this.window;
    return this.filled === this.window && this.nan === 0 ? this.sum : NaN;
  }

  reset(): void {
    this.ring.fill(0);
    this.index = 0;
    this.filled = 0;
    this.sum = 0;
    this.nan = 0;
  }
}

/** Incremental rolling standard deviation (O(1) per push) — matches `rollingStd`. */
export class RollingStdStream implements StreamingFeature {
  private readonly ring: Float64Array;
  private index = 0;
  private filled = 0;
  private sum = 0;
  private sumSq = 0;
  private nan = 0;

  constructor(
    private readonly window: number,
    private readonly ddof = 1,
  ) {
    if (!Number.isInteger(window) || window <= 0)
      throw new RangeError('window must be a positive integer');
    if (window - ddof <= 0) throw new RangeError('window must exceed ddof');
    this.ring = new Float64Array(window);
  }

  push(value: number): number {
    if (this.filled === this.window) {
      const old = this.ring[this.index]!;
      if (Number.isNaN(old)) {
        this.nan -= 1;
      } else {
        this.sum -= old;
        this.sumSq -= old * old;
      }
    } else {
      this.filled += 1;
    }
    this.ring[this.index] = value;
    if (Number.isNaN(value)) {
      this.nan += 1;
    } else {
      this.sum += value;
      this.sumSq += value * value;
    }
    this.index = (this.index + 1) % this.window;
    if (this.filled !== this.window || this.nan !== 0) return NaN;
    const numerator = this.sumSq - (this.sum * this.sum) / this.window;
    return Math.sqrt(Math.max(numerator, 0) / (this.window - this.ddof));
  }

  reset(): void {
    this.ring.fill(0);
    this.index = 0;
    this.filled = 0;
    this.sum = 0;
    this.sumSq = 0;
    this.nan = 0;
  }
}

/** Incremental Exponential Moving Average — matches `ema` (SMA-seeded, NaN-holding). */
export class EmaStream implements StreamingFeature {
  private readonly alpha: number;
  private prev = NaN;
  private seeded = false;
  private seedSum = 0;
  private seedCount = 0;

  constructor(
    private readonly window: number,
    alpha?: number,
  ) {
    if (!Number.isInteger(window) || window <= 0)
      throw new RangeError('window must be a positive integer');
    this.alpha = alpha ?? 2 / (window + 1);
    if (!(this.alpha > 0 && this.alpha <= 1)) throw new RangeError('alpha must be in (0, 1]');
  }

  push(value: number): number {
    if (!this.seeded) {
      if (Number.isNaN(value)) {
        this.seedSum = 0;
        this.seedCount = 0;
        return NaN;
      }
      this.seedSum += value;
      this.seedCount += 1;
      if (this.seedCount === this.window) {
        this.prev = this.seedSum / this.window;
        this.seeded = true;
        return this.prev;
      }
      return NaN;
    }
    if (Number.isNaN(value)) return NaN;
    this.prev = this.alpha * value + (1 - this.alpha) * this.prev;
    return this.prev;
  }

  reset(): void {
    this.prev = NaN;
    this.seeded = false;
    this.seedSum = 0;
    this.seedCount = 0;
  }
}

/** Incremental Relative Strength Index (Wilder) — matches `rsi`. */
export class RsiStream implements StreamingFeature {
  private prevValue = NaN;
  private hasPrev = false;
  private avgGain = NaN;
  private avgLoss = NaN;
  private seeded = false;
  private seedGain = 0;
  private seedLoss = 0;
  private seedCount = 0;

  constructor(private readonly window: number) {
    if (!Number.isInteger(window) || window <= 0)
      throw new RangeError('window must be a positive integer');
  }

  private static rsiFrom(avgGain: number, avgLoss: number): number {
    if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  push(value: number): number {
    if (!this.hasPrev) {
      this.prevValue = value;
      this.hasPrev = true;
      return NaN;
    }
    const delta =
      Number.isNaN(value) || Number.isNaN(this.prevValue) ? NaN : value - this.prevValue;
    this.prevValue = value;
    if (!this.seeded) {
      if (Number.isNaN(delta)) {
        this.seedGain = 0;
        this.seedLoss = 0;
        this.seedCount = 0;
        return NaN;
      }
      this.seedGain += Math.max(delta, 0);
      this.seedLoss += Math.max(-delta, 0);
      this.seedCount += 1;
      if (this.seedCount === this.window) {
        this.avgGain = this.seedGain / this.window;
        this.avgLoss = this.seedLoss / this.window;
        this.seeded = true;
        return RsiStream.rsiFrom(this.avgGain, this.avgLoss);
      }
      return NaN;
    }
    if (Number.isNaN(delta)) return NaN;
    this.avgGain = (this.avgGain * (this.window - 1) + Math.max(delta, 0)) / this.window;
    this.avgLoss = (this.avgLoss * (this.window - 1) + Math.max(-delta, 0)) / this.window;
    return RsiStream.rsiFrom(this.avgGain, this.avgLoss);
  }

  reset(): void {
    this.prevValue = NaN;
    this.hasPrev = false;
    this.avgGain = NaN;
    this.avgLoss = NaN;
    this.seeded = false;
    this.seedGain = 0;
    this.seedLoss = 0;
    this.seedCount = 0;
  }
}
