/**
 * Core numeric types for the Feature Calculation SDK.
 *
 * REAL calculation library. All calculations are **causal** (point-in-time): the value at
 * index `i` depends only on inputs at indices `≤ i`. No function ever reads a future value
 * (PIT-3 / CP-3). Warm-up positions before a window is full are filled with `NaN`; inputs
 * containing `NaN` propagate to `NaN` outputs per each function's documented policy. Every
 * function is deterministic and free of hidden state.
 */

/** A read-only numeric input series — accepts `number[]`, `Float64Array`, etc. */
export type NumberSeries = ArrayLike<number>;

/** A single OHLCV bar. */
export interface OhlcvBar {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

/** A column-oriented OHLCV series (typed dataset) for vectorized processing. */
export interface OhlcvSeries {
  readonly time: Float64Array;
  readonly open: Float64Array;
  readonly high: Float64Array;
  readonly low: Float64Array;
  readonly close: Float64Array;
  readonly volume: Float64Array;
  readonly length: number;
}

/** Build a column-oriented `OhlcvSeries` from an array of bars (single pass, typed arrays). */
export function toOhlcvSeries(bars: readonly OhlcvBar[]): OhlcvSeries {
  const length = bars.length;
  const time = new Float64Array(length);
  const open = new Float64Array(length);
  const high = new Float64Array(length);
  const low = new Float64Array(length);
  const close = new Float64Array(length);
  const volume = new Float64Array(length);
  for (let i = 0; i < length; i += 1) {
    const bar = bars[i]!;
    time[i] = bar.time;
    open[i] = bar.open;
    high[i] = bar.high;
    low[i] = bar.low;
    close[i] = bar.close;
    volume[i] = bar.volume;
  }
  return { time, open, high, low, close, volume, length };
}

/** Allocate an output series pre-filled with `NaN` (the warm-up marker). */
export function allocOutput(length: number): Float64Array {
  const out = new Float64Array(length);
  out.fill(NaN);
  return out;
}

/** Assert a positive integer window, throwing a clear error otherwise. */
export function assertWindow(window: number, name = 'window'): void {
  if (!Number.isInteger(window) || window <= 0) {
    throw new RangeError(`${name} must be a positive integer, received ${window}`);
  }
}

/** The number of leading `NaN` (warm-up) values in a series. */
export function warmupLength(values: NumberSeries): number {
  let i = 0;
  while (i < values.length && Number.isNaN(values[i]!)) i += 1;
  return i;
}

/** The count of finite (non-NaN, non-Infinity) values in a series. */
export function finiteCount(values: NumberSeries): number {
  let count = 0;
  for (let i = 0; i < values.length; i += 1) if (Number.isFinite(values[i]!)) count += 1;
  return count;
}
