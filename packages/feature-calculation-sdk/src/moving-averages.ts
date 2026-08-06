/**
 * Moving-average calculations — Simple, Exponential and Weighted. All causal (no
 * look-ahead), deterministic, and NaN-aware. Outputs are `Float64Array` with `NaN` in the
 * warm-up region.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';

/**
 * Simple Moving Average. `out[i] = mean(values[i-window+1 .. i])`.
 *
 * O(n) via a running sum with an in-window NaN counter — any `NaN` inside the window yields
 * `NaN` for that position. No per-window allocation.
 */
export function sma(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  let sum = 0;
  let nan = 0;
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) nan += 1;
    else sum += v;
    if (i >= window) {
      const old = values[i - window]!;
      if (Number.isNaN(old)) nan -= 1;
      else sum -= old;
    }
    if (i >= window - 1 && nan === 0) out[i] = sum / window;
  }
  return out;
}

/**
 * Exponential Moving Average with smoothing factor `alpha = 2/(window+1)` (or an explicit
 * `alpha`). Seeded, TA-Lib style, with the SMA of the first full window of finite values, then
 * recursed: `ema[i] = alpha*v[i] + (1-alpha)*ema[i-1]`.
 *
 * NaN policy: leading `NaN`s (and any `NaN` before the seed) reset seed accumulation — a
 * contiguous window of finite values is required to seed. After seeding, a `NaN` input yields
 * a `NaN` output while the internal EMA state is held, so the series resumes on the next finite
 * value. This makes the EMA robust for chained inputs such as the MACD signal line.
 */
export function ema(values: NumberSeries, window: number, alpha?: number): Float64Array {
  assertWindow(window);
  const a = alpha ?? 2 / (window + 1);
  if (!(a > 0 && a <= 1)) throw new RangeError(`alpha must be in (0, 1], received ${a}`);
  const n = values.length;
  const out = allocOutput(n);
  let prev = NaN;
  let seeded = false;
  let seedSum = 0;
  let seedCount = 0;
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    if (!seeded) {
      if (Number.isNaN(v)) {
        seedSum = 0;
        seedCount = 0;
        continue;
      }
      seedSum += v;
      seedCount += 1;
      if (seedCount === window) {
        prev = seedSum / window;
        out[i] = prev;
        seeded = true;
      }
    } else if (Number.isNaN(v)) {
      out[i] = NaN;
    } else {
      prev = a * v + (1 - a) * prev;
      out[i] = prev;
    }
  }
  return out;
}

/**
 * Weighted Moving Average with linearly increasing weights `1, 2, …, window` (most recent
 * value weighted highest). `out[i] = Σ (k+1)·v[i-window+1+k] / Σ (k+1)`. Any `NaN` inside the
 * window yields `NaN`. No per-window allocation.
 */
export function wma(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  const denom = (window * (window + 1)) / 2;
  for (let i = window - 1; i < n; i += 1) {
    let weighted = 0;
    let hasNan = false;
    for (let k = 0; k < window; k += 1) {
      const v = values[i - window + 1 + k]!;
      if (Number.isNaN(v)) {
        hasNan = true;
        break;
      }
      weighted += (k + 1) * v;
    }
    if (!hasNan) out[i] = weighted / denom;
  }
  return out;
}

/** Alias — rolling arithmetic mean is the Simple Moving Average. */
export const rollingMean = sma;
