/**
 * Volatility calculations — True Range, Average True Range (Wilder) and Bollinger Bands. All
 * causal, deterministic and NaN-aware.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';
import { sma } from './moving-averages';
import { rollingStd } from './rolling';

/**
 * True Range: `TR[i] = max(high-low, |high-prevClose|, |low-prevClose|)`. `TR[0] = high[0] -
 * low[0]` (no prior close). Any `NaN` in the required inputs ⇒ `NaN`.
 */
export function trueRange(
  high: NumberSeries,
  low: NumberSeries,
  close: NumberSeries,
): Float64Array {
  const n = high.length;
  if (low.length !== n || close.length !== n)
    throw new RangeError('high/low/close length mismatch');
  const out = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const h = high[i]!;
    const l = low[i]!;
    if (Number.isNaN(h) || Number.isNaN(l)) continue;
    if (i === 0) {
      out[i] = h - l;
      continue;
    }
    const prevClose = close[i - 1]!;
    if (Number.isNaN(prevClose)) {
      out[i] = h - l;
      continue;
    }
    out[i] = Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose));
  }
  return out;
}

/**
 * Average True Range (Wilder smoothing) over `window`. The first value at index `window-1` is
 * the simple mean of `TR[0 .. window-1]`; thereafter `ATR[i] = (ATR[i-1]·(window-1) + TR[i]) /
 * window`. Requires a contiguous finite seed window; a later `NaN` TR yields `NaN` and holds
 * the running ATR.
 */
export function atr(
  high: NumberSeries,
  low: NumberSeries,
  close: NumberSeries,
  window = 14,
): Float64Array {
  assertWindow(window);
  const tr = trueRange(high, low, close);
  const n = tr.length;
  const out = allocOutput(n);
  let prev = NaN;
  let seeded = false;
  let seedSum = 0;
  let seedCount = 0;
  for (let i = 0; i < n; i += 1) {
    const t = tr[i]!;
    if (!seeded) {
      if (Number.isNaN(t)) {
        seedSum = 0;
        seedCount = 0;
        continue;
      }
      seedSum += t;
      seedCount += 1;
      if (seedCount === window) {
        prev = seedSum / window;
        out[i] = prev;
        seeded = true;
      }
    } else if (Number.isNaN(t)) {
      out[i] = NaN;
    } else {
      prev = (prev * (window - 1) + t) / window;
      out[i] = prev;
    }
  }
  return out;
}

/** Bollinger Bands: middle (SMA), upper and lower bands `middle ± k·std`. */
export interface BollingerBands {
  readonly middle: Float64Array;
  readonly upper: Float64Array;
  readonly lower: Float64Array;
}

/**
 * Bollinger Bands over `window` with `k` standard deviations. Uses the **population** standard
 * deviation (`ddof = 0`, the TA-Lib convention) by default. Any `NaN` inside the window yields
 * `NaN` for all three bands at that position.
 */
export function bollingerBands(values: NumberSeries, window = 20, k = 2, ddof = 0): BollingerBands {
  assertWindow(window);
  const middle = sma(values, window);
  const std = rollingStd(values, window, ddof);
  const n = values.length;
  const upper = allocOutput(n);
  const lower = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const m = middle[i]!;
    const s = std[i]!;
    if (Number.isNaN(m) || Number.isNaN(s)) continue;
    upper[i] = m + k * s;
    lower[i] = m - k * s;
  }
  return { middle, upper, lower };
}
