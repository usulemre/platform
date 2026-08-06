/**
 * Rolling-window statistics — sum, variance, standard deviation, maximum, minimum and median.
 * All causal, deterministic and NaN-aware. Variance/std use a running sum & sum-of-squares
 * (O(n)); max/min use monotonic deques (amortized O(n)); median sorts a window copy (O(n·w·log
 * w)). Any `NaN` inside a window yields `NaN` for that position.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';

/** Rolling sum over `window`. O(n) running sum; `NaN` in the window ⇒ `NaN`. */
export function rollingSum(values: NumberSeries, window: number): Float64Array {
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
    if (i >= window - 1 && nan === 0) out[i] = sum;
  }
  return out;
}

/**
 * Rolling variance over `window`. `ddof` is the delta degrees of freedom: `ddof = 1` (default)
 * gives the sample variance (÷ `window-1`); `ddof = 0` gives the population variance (÷
 * `window`). O(n) via running sum & sum-of-squares, with a floating-point guard clamping tiny
 * negative results to `0`.
 */
export function rollingVariance(values: NumberSeries, window: number, ddof = 1): Float64Array {
  assertWindow(window);
  if (window - ddof <= 0) throw new RangeError(`window (${window}) must exceed ddof (${ddof})`);
  const n = values.length;
  const out = allocOutput(n);
  let sum = 0;
  let sumSq = 0;
  let nan = 0;
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) {
      nan += 1;
    } else {
      sum += v;
      sumSq += v * v;
    }
    if (i >= window) {
      const old = values[i - window]!;
      if (Number.isNaN(old)) {
        nan -= 1;
      } else {
        sum -= old;
        sumSq -= old * old;
      }
    }
    if (i >= window - 1 && nan === 0) {
      const numerator = sumSq - (sum * sum) / window;
      out[i] = Math.max(numerator, 0) / (window - ddof);
    }
  }
  return out;
}

/** Rolling standard deviation over `window` (= √ rolling variance). See `rollingVariance`. */
export function rollingStd(values: NumberSeries, window: number, ddof = 1): Float64Array {
  const variance = rollingVariance(values, window, ddof);
  const out = allocOutput(variance.length);
  for (let i = 0; i < variance.length; i += 1) {
    const v = variance[i]!;
    if (!Number.isNaN(v)) out[i] = Math.sqrt(v);
  }
  return out;
}

/** Rolling maximum over `window` using a monotonic-decreasing deque (amortized O(n)). */
export function rollingMax(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  const deque: number[] = []; // indices, values decreasing
  let nan = 0;
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) nan += 1;
    // drop indices outside the window
    while (deque.length > 0 && deque[0]! <= i - window) deque.shift();
    if (!Number.isNaN(v)) {
      while (deque.length > 0 && values[deque[deque.length - 1]!]! <= v) deque.pop();
      deque.push(i);
    }
    if (i >= window) {
      const leaving = values[i - window]!;
      if (Number.isNaN(leaving)) nan -= 1;
    }
    if (i >= window - 1 && nan === 0 && deque.length > 0) out[i] = values[deque[0]!]!;
  }
  return out;
}

/** Rolling minimum over `window` using a monotonic-increasing deque (amortized O(n)). */
export function rollingMin(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  const deque: number[] = [];
  let nan = 0;
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    if (Number.isNaN(v)) nan += 1;
    while (deque.length > 0 && deque[0]! <= i - window) deque.shift();
    if (!Number.isNaN(v)) {
      while (deque.length > 0 && values[deque[deque.length - 1]!]! >= v) deque.pop();
      deque.push(i);
    }
    if (i >= window) {
      const leaving = values[i - window]!;
      if (Number.isNaN(leaving)) nan -= 1;
    }
    if (i >= window - 1 && nan === 0 && deque.length > 0) out[i] = values[deque[0]!]!;
  }
  return out;
}

/**
 * Rolling median over `window`. Sorts a copy of each full window (O(n·w·log w)). Any `NaN`
 * inside the window yields `NaN`. Even windows return the mean of the two central values.
 */
export function rollingMedian(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  const buffer = new Float64Array(window);
  for (let i = window - 1; i < n; i += 1) {
    let hasNan = false;
    for (let k = 0; k < window; k += 1) {
      const v = values[i - window + 1 + k]!;
      if (Number.isNaN(v)) {
        hasNan = true;
        break;
      }
      buffer[k] = v;
    }
    if (hasNan) continue;
    const sorted = Array.prototype.slice.call(buffer).sort((a, b) => a - b);
    const mid = window >> 1;
    out[i] = window % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return out;
}
