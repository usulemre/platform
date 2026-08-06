/**
 * Minimal, dependency-free linear algebra for portfolio optimization — dense vectors and row-major
 * matrices with the operations the optimizers need: matrix-vector products, quadratic forms, a
 * Cholesky decomposition (with automatic ridge regularization for near-singular covariance),
 * symmetric-positive-definite solves and inverse, and a power-iteration estimate of the largest
 * eigenvalue (for step-size selection). Pure and deterministic; no randomness, no ambient state.
 */

/** A dense, row-major matrix. */
export interface Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: Float64Array;
}

/** Build a square matrix from a nested array (row-major). */
export function matrix(rows: readonly (readonly number[])[]): Matrix {
  const r = rows.length;
  const c = r > 0 ? rows[0]!.length : 0;
  const data = new Float64Array(r * c);
  for (let i = 0; i < r; i += 1) {
    if (rows[i]!.length !== c) throw new RangeError('ragged matrix');
    for (let j = 0; j < c; j += 1) data[i * c + j] = rows[i]![j]!;
  }
  return { rows: r, cols: c, data };
}

/** The n×n identity matrix. */
export function identity(n: number): Matrix {
  const data = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) data[i * n + i] = 1;
  return { rows: n, cols: n, data };
}

/** Element access. */
export function at(m: Matrix, i: number, j: number): number {
  return m.data[i * m.cols + j]!;
}

/** Matrix-vector product `A·v`. */
export function matVec(a: Matrix, v: Float64Array): Float64Array {
  if (a.cols !== v.length) throw new RangeError('matVec dimension mismatch');
  const out = new Float64Array(a.rows);
  for (let i = 0; i < a.rows; i += 1) {
    let sum = 0;
    for (let j = 0; j < a.cols; j += 1) sum += a.data[i * a.cols + j]! * v[j]!;
    out[i] = sum;
  }
  return out;
}

/** Dot product. */
export function dot(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += a[i]! * b[i]!;
  return sum;
}

/** Quadratic form `vᵀ A v` (≥ 0 for SPD `A`; clamped at 0 for tiny negative FP error). */
export function quadForm(a: Matrix, v: Float64Array): number {
  return Math.max(0, dot(v, matVec(a, v)));
}

/** A copy of `A` with `ridge` added to the diagonal (Tikhonov regularization). */
export function addRidge(a: Matrix, ridge: number): Matrix {
  const data = a.data.slice();
  for (let i = 0; i < a.rows; i += 1) data[i * a.cols + i] = data[i * a.cols + i]! + ridge;
  return { rows: a.rows, cols: a.cols, data };
}

/** The trace of a square matrix. */
export function trace(a: Matrix): number {
  let sum = 0;
  for (let i = 0; i < a.rows; i += 1) sum += a.data[i * a.cols + i]!;
  return sum;
}

/**
 * Cholesky decomposition `A = L·Lᵀ` for a symmetric positive-definite `A`. Returns the lower-
 * triangular `L` (row-major) or `null` if `A` is not positive-definite.
 */
export function cholesky(a: Matrix): Float64Array | null {
  const n = a.rows;
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = a.data[i * n + j]!;
      for (let k = 0; k < j; k += 1) sum -= L[i * n + k]! * L[j * n + k]!;
      if (i === j) {
        if (sum <= 0) return null;
        L[i * n + j] = Math.sqrt(sum);
      } else {
        L[i * n + j] = sum / L[j * n + j]!;
      }
    }
  }
  return L;
}

/**
 * A Cholesky factor for `A`, adding an increasing diagonal ridge until it is positive-definite.
 * Guarantees a factorization for any symmetric `A` (handles singular/near-singular covariance —
 * a real numerical edge case). Returns the factor and the ridge that was applied.
 */
export function safeCholesky(a: Matrix): { L: Float64Array; ridge: number } {
  const direct = cholesky(a);
  if (direct) return { L: direct, ridge: 0 };
  const base = Math.max(trace(a) / a.rows, 1) * 1e-12;
  for (let ridge = base; ridge < 1e6; ridge *= 10) {
    const L = cholesky(addRidge(a, ridge));
    if (L) return { L, ridge };
  }
  throw new Error('matrix could not be regularized to positive-definite');
}

/** Solve `L·Lᵀ·x = b` given a Cholesky factor `L` (forward then back substitution). */
export function choleskySolve(L: Float64Array, b: Float64Array): Float64Array {
  const n = b.length;
  const y = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    let sum = b[i]!;
    for (let k = 0; k < i; k += 1) sum -= L[i * n + k]! * y[k]!;
    y[i] = sum / L[i * n + i]!;
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i -= 1) {
    let sum = y[i]!;
    for (let k = i + 1; k < n; k += 1) sum -= L[k * n + i]! * x[k]!;
    x[i] = sum / L[i * n + i]!;
  }
  return x;
}

/** Solve `A·x = b` for symmetric positive-(semi)definite `A` (ridge-regularized as needed). */
export function solveSPD(a: Matrix, b: Float64Array): Float64Array {
  const { L } = safeCholesky(a);
  return choleskySolve(L, b);
}

/** The inverse of a symmetric positive-(semi)definite matrix (ridge-regularized as needed). */
export function invSPD(a: Matrix): Matrix {
  const n = a.rows;
  const { L } = safeCholesky(a);
  const data = new Float64Array(n * n);
  const e = new Float64Array(n);
  for (let col = 0; col < n; col += 1) {
    e.fill(0);
    e[col] = 1;
    const x = choleskySolve(L, e);
    for (let row = 0; row < n; row += 1) data[row * n + col] = x[row]!;
  }
  return { rows: n, cols: n, data };
}

/**
 * The largest eigenvalue of a symmetric matrix via power iteration (deterministic all-ones start).
 * Used to pick a stable projected-gradient step size (`1/λmax`).
 */
export function largestEigenvalue(a: Matrix, iterations = 100): number {
  const n = a.rows;
  let v = new Float64Array(n).fill(1 / Math.sqrt(n));
  let lambda = 0;
  for (let iter = 0; iter < iterations; iter += 1) {
    const av = matVec(a, v);
    const norm = Math.sqrt(dot(av, av));
    if (norm === 0) return 0;
    for (let i = 0; i < n; i += 1) av[i] = av[i]! / norm;
    const next = dot(av, matVec(a, av));
    if (Math.abs(next - lambda) < 1e-12) {
      lambda = next;
      break;
    }
    lambda = next;
    v = av;
  }
  return lambda;
}
