/**
 * Signal derivation and expected-return tilts — the bridge from the Signal Calculation Engine into
 * the optimizer. `momentumSignals` derives a per-asset directional signal in `[-1, 1]` from a
 * returns matrix (the sign/strength of recent cumulative return); `tiltExpectedReturns` blends a
 * base expected-return estimate with a signal view. Pure, deterministic and causal (uses only the
 * trailing window).
 */
import { at, type Matrix } from './linalg';

/**
 * Per-asset momentum signals in `[-1, 1]` from the trailing `lookback` periods of a `T×N` returns
 * matrix: the cumulative return over the window, squashed by `tanh(scale·cum)`. Deterministic.
 */
export function momentumSignals(returns: Matrix, lookback = 60, scale = 20): Float64Array {
  const t = returns.rows;
  const n = returns.cols;
  const start = Math.max(0, t - lookback);
  const out = new Float64Array(n);
  for (let j = 0; j < n; j += 1) {
    let cumulative = 0;
    for (let i = start; i < t; i += 1) {
      const v = at(returns, i, j);
      if (Number.isFinite(v)) cumulative += v;
    }
    out[j] = Math.tanh(scale * cumulative);
  }
  return out;
}

/**
 * Blend a base expected-return vector with a signal view: `μ' = (1−α)·μ + α·(signal · σ_scale)`.
 * `alpha` in `[0, 1]` controls how strongly the signals tilt the estimate. Deterministic.
 */
export function tiltExpectedReturns(
  baseReturns: Float64Array,
  signals: Float64Array,
  volatilities: Float64Array,
  alpha = 0.5,
): Float64Array {
  const out = new Float64Array(baseReturns.length);
  for (let i = 0; i < baseReturns.length; i += 1) {
    const view = signals[i]! * volatilities[i]!;
    out[i] = (1 - alpha) * baseReturns[i]! + alpha * view;
  }
  return out;
}
