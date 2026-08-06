/**
 * Return-series statistics — sample mean returns, the sample covariance matrix, volatilities and
 * correlations, estimated from a `T×N` returns matrix (rows = periods, columns = assets). These are
 * the real inputs to the optimizers. Pure, deterministic and NaN-tolerant (NaN observations are
 * skipped pairwise). All estimators use `ddof = 1` (sample) by default.
 */
import { at, matrix, type Matrix } from './linalg';

/** Column (per-asset) mean returns of a `T×N` returns matrix. */
export function meanReturns(returns: Matrix): Float64Array {
  const t = returns.rows;
  const n = returns.cols;
  const out = new Float64Array(n);
  for (let j = 0; j < n; j += 1) {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < t; i += 1) {
      const v = at(returns, i, j);
      if (Number.isFinite(v)) {
        sum += v;
        count += 1;
      }
    }
    out[j] = count > 0 ? sum / count : 0;
  }
  return out;
}

/**
 * The `N×N` sample covariance matrix of a `T×N` returns matrix. `ddof = 1` gives the unbiased
 * sample covariance (÷ `T−1`). Symmetric by construction.
 */
export function covarianceMatrix(returns: Matrix, ddof = 1): Matrix {
  const t = returns.rows;
  const n = returns.cols;
  const mu = meanReturns(returns);
  const data = new Float64Array(n * n);
  const denom = Math.max(1, t - ddof);
  for (let a = 0; a < n; a += 1) {
    for (let b = a; b < n; b += 1) {
      let sum = 0;
      for (let i = 0; i < t; i += 1) {
        const va = at(returns, i, a);
        const vb = at(returns, i, b);
        if (Number.isFinite(va) && Number.isFinite(vb)) sum += (va - mu[a]!) * (vb - mu[b]!);
      }
      const cov = sum / denom;
      data[a * n + b] = cov;
      data[b * n + a] = cov;
    }
  }
  return { rows: n, cols: n, data };
}

/** Per-asset volatility `σ = √diag(Σ)` (0-clamped for tiny negative FP error). */
export function volatilities(covariance: Matrix): Float64Array {
  const n = covariance.rows;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) out[i] = Math.sqrt(Math.max(0, at(covariance, i, i)));
  return out;
}

/** The correlation matrix implied by a covariance matrix (0 where a volatility is 0). */
export function correlationMatrix(covariance: Matrix): Matrix {
  const n = covariance.rows;
  const vol = volatilities(covariance);
  const data = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const denom = vol[i]! * vol[j]!;
      data[i * n + j] = denom > 0 ? at(covariance, i, j) / denom : i === j ? 1 : 0;
    }
  }
  return { rows: n, cols: n, data };
}

/** Build a `T×N` returns matrix from an array of per-period rows. */
export function returnsMatrix(rows: readonly (readonly number[])[]): Matrix {
  return matrix(rows);
}
