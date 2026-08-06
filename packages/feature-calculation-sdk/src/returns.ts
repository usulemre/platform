/**
 * Return and normalization transforms — arithmetic/log returns, rate of change, momentum and
 * rolling z-score. All causal, deterministic and NaN-aware.
 */
import { allocOutput, assertWindow, type NumberSeries } from './types';
import { rollingMean } from './moving-averages';
import { rollingStd } from './rolling';

/** Arithmetic (simple) returns: `r[i] = v[i]/v[i-1] - 1`. `r[0] = NaN`. Division by zero ⇒ `NaN`. */
export function arithmeticReturns(values: NumberSeries): Float64Array {
  const n = values.length;
  const out = allocOutput(n);
  for (let i = 1; i < n; i += 1) {
    const cur = values[i]!;
    const prev = values[i - 1]!;
    if (Number.isNaN(cur) || Number.isNaN(prev) || prev === 0) continue;
    out[i] = cur / prev - 1;
  }
  return out;
}

/** Continuously-compounded (log) returns: `r[i] = ln(v[i]/v[i-1])`. Requires positive prices. */
export function logReturns(values: NumberSeries): Float64Array {
  const n = values.length;
  const out = allocOutput(n);
  for (let i = 1; i < n; i += 1) {
    const cur = values[i]!;
    const prev = values[i - 1]!;
    if (Number.isNaN(cur) || Number.isNaN(prev) || cur <= 0 || prev <= 0) continue;
    out[i] = Math.log(cur / prev);
  }
  return out;
}

/**
 * Rate of Change over `window`, in percent: `roc[i] = (v[i]/v[i-window] - 1)·100`. `NaN` for
 * `i < window`; division by zero ⇒ `NaN`.
 */
export function rateOfChange(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  for (let i = window; i < n; i += 1) {
    const cur = values[i]!;
    const past = values[i - window]!;
    if (Number.isNaN(cur) || Number.isNaN(past) || past === 0) continue;
    out[i] = (cur / past - 1) * 100;
  }
  return out;
}

/** Momentum over `window`: `mom[i] = v[i] - v[i-window]`. `NaN` for `i < window`. */
export function momentum(values: NumberSeries, window: number): Float64Array {
  assertWindow(window);
  const n = values.length;
  const out = allocOutput(n);
  for (let i = window; i < n; i += 1) {
    const cur = values[i]!;
    const past = values[i - window]!;
    if (Number.isNaN(cur) || Number.isNaN(past)) continue;
    out[i] = cur - past;
  }
  return out;
}

/**
 * Rolling z-score: `z[i] = (v[i] - rollingMean[i]) / rollingStd[i]`. Uses the sample standard
 * deviation (`ddof = 1`) by default. A zero rolling std ⇒ `NaN` (undefined normalization).
 */
export function zScore(values: NumberSeries, window: number, ddof = 1): Float64Array {
  assertWindow(window);
  const mean = rollingMean(values, window);
  const std = rollingStd(values, window, ddof);
  const n = values.length;
  const out = allocOutput(n);
  for (let i = 0; i < n; i += 1) {
    const v = values[i]!;
    const m = mean[i]!;
    const s = std[i]!;
    if (Number.isNaN(v) || Number.isNaN(m) || Number.isNaN(s) || s === 0) continue;
    out[i] = (v - m) / s;
  }
  return out;
}
