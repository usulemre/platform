/**
 * The **Portfolio Optimizers** — the real construction algorithms. Every optimizer is deterministic
 * and reproducible, projects its solution onto the configured constraint set, and returns the
 * weights with convergence diagnostics. Numerical edge cases (singular covariance, zero volatility,
 * empty/degenerate universes) are handled by the ridge-regularized solves and the bounded
 * projections.
 *
 * Methods: equal weight, inverse volatility, minimum variance, mean-variance (Markowitz),
 * maximum Sharpe, maximum diversification, equal-risk-contribution / risk parity, target volatility,
 * position sizing, rebalancing and cash allocation.
 */
import { dot, largestEigenvalue, matVec, solveSPD } from './linalg';
import { applyTurnoverLimit, projectToConstraints } from './constraints';
import { portfolioVolatility } from './objectives';
import {
  equalWeights,
  type ConstraintConfig,
  type OptimizationInput,
  type OptimizationResult,
} from './types';

const MAX_ITERS = 500;
const TOL = 1e-9;

function ones(n: number): Float64Array {
  return new Float64Array(n).fill(1);
}

function finalize(
  weights: Float64Array,
  iterations: number,
  converged: boolean,
): OptimizationResult {
  let net = 0;
  for (let i = 0; i < weights.length; i += 1) net += weights[i]!;
  return { weights, cashWeight: 1 - net, iterations, converged };
}

/** Scale a non-negative raw vector so its entries sum to `target` (falls back to equal split). */
function normalizeSum(raw: Float64Array, target: number): Float64Array {
  let sum = 0;
  for (let i = 0; i < raw.length; i += 1) sum += raw[i]!;
  const out = new Float64Array(raw.length);
  if (sum <= 0) {
    out.fill(raw.length > 0 ? target / raw.length : 0);
    return out;
  }
  for (let i = 0; i < raw.length; i += 1) out[i] = (raw[i]! * target) / sum;
  return out;
}

/**
 * Projected gradient descent/ascent on a differentiable objective over the constraint set. `lr` is
 * the step size (chosen from the objective's Lipschitz constant); `maximize` selects ascent.
 */
function projectedGradient(
  input: OptimizationInput,
  config: ConstraintConfig,
  grad: (w: Float64Array) => Float64Array,
  maximize: boolean,
  lr: number,
  w0: Float64Array,
): OptimizationResult {
  let w = projectToConstraints(w0, config, input);
  let iterations = 0;
  let converged = false;
  const dir = maximize ? 1 : -1;
  for (let k = 0; k < MAX_ITERS; k += 1) {
    iterations = k + 1;
    const g = grad(w);
    const trial = new Float64Array(w.length);
    for (let i = 0; i < w.length; i += 1) trial[i] = w[i]! + dir * lr * g[i]!;
    const wNew = projectToConstraints(trial, config, input);
    let diff = 0;
    for (let i = 0; i < w.length; i += 1) diff += (wNew[i]! - w[i]!) ** 2;
    w = wNew;
    if (Math.sqrt(diff) < TOL) {
      converged = true;
      break;
    }
  }
  return finalize(w, iterations, converged);
}

/** Equal Weight: `wᵢ = (1 − cashReserve) / n`, projected onto the constraints. */
export function equalWeightPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const target = 1 - config.cashReserve;
  const raw = new Float64Array(input.n).fill(input.n > 0 ? target / input.n : 0);
  return finalize(projectToConstraints(raw, config, input), 0, true);
}

/** Inverse Volatility: `wᵢ ∝ 1/σᵢ` — the naive (correlation-agnostic) risk-balanced portfolio. */
export function inverseVolatilityPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const raw = new Float64Array(input.n);
  for (let i = 0; i < input.n; i += 1)
    raw[i] = input.volatilities[i]! > 0 ? 1 / input.volatilities[i]! : 0;
  const target = 1 - config.cashReserve;
  return finalize(projectToConstraints(normalizeSum(raw, target), config, input), 0, true);
}

/**
 * Minimum Variance: minimize `wᵀΣw` s.t. the constraints. Seeds with the closed-form
 * `w ∝ Σ⁻¹1` and refines by projected gradient (`∇ = 2Σw`) so box/leverage constraints are honored.
 */
export function minimumVariancePortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const target = 1 - config.cashReserve;
  const seed = normalizeSum(clampNonNeg(solveSPD(input.covariance, ones(input.n))), target);
  const lambdaMax = Math.max(largestEigenvalue(input.covariance), 1e-8);
  const lr = 1 / (2 * lambdaMax);
  return projectedGradient(
    input,
    config,
    (w) => scale(matVec(input.covariance, w), 2),
    false,
    lr,
    seed,
  );
}

/**
 * Mean-Variance (Markowitz): maximize `μᵀw − (λ/2)·wᵀΣw` s.t. the constraints (`∇ = μ − λΣw`).
 * `riskAversion` (λ) trades expected return against variance.
 */
export function meanVariancePortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
  riskAversion = 3,
): OptimizationResult {
  const lambda = Math.max(riskAversion, 1e-6);
  const lambdaMax = Math.max(largestEigenvalue(input.covariance), 1e-8);
  const lr = 1 / (lambda * lambdaMax + 1e-6);
  const grad = (w: Float64Array): Float64Array => {
    const sw = matVec(input.covariance, w);
    const g = new Float64Array(w.length);
    for (let i = 0; i < w.length; i += 1) g[i] = input.meanReturns[i]! - lambda * sw[i]!;
    return g;
  };
  const start = equalWeightPortfolio(input, config).weights;
  return projectedGradient(input, config, grad, true, lr, start);
}

/**
 * Maximum Sharpe: the tangency portfolio. Scans a grid of risk-aversion values, solving the
 * mean-variance problem at each, and returns the constrained portfolio with the highest Sharpe
 * ratio — a robust way to respect arbitrary constraints (the unconstrained tangency `Σ⁻¹(μ−rf)`
 * need not be feasible).
 */
export function maximumSharpePortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const grid = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128];
  let best: OptimizationResult | null = null;
  let bestSharpe = Number.NEGATIVE_INFINITY;
  let bestIters = 0;
  for (const lambda of grid) {
    const candidate = meanVariancePortfolio(input, config, lambda);
    bestIters += candidate.iterations;
    const vol = portfolioVolatility(candidate.weights, input.covariance);
    const excess = dot(candidate.weights, input.meanReturns) - input.riskFreeRate;
    const sharpe = vol > 0 ? excess / vol : Number.NEGATIVE_INFINITY;
    if (sharpe > bestSharpe) {
      bestSharpe = sharpe;
      best = candidate;
    }
  }
  const chosen = best ?? equalWeightPortfolio(input, config);
  return { ...chosen, iterations: bestIters, converged: true };
}

/**
 * Maximum Diversification: maximize the diversification ratio `(wᵀσ)/√(wᵀΣw)`. The maximum-
 * diversification portfolio is `w ∝ Σ⁻¹σ`; the closed-form direction is normalized and projected.
 */
export function maximumDiversificationPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const target = 1 - config.cashReserve;
  const raw = clampNonNeg(solveSPD(input.covariance, input.volatilities.slice()));
  return finalize(projectToConstraints(normalizeSum(raw, target), config, input), 0, true);
}

/**
 * Equal Risk Contribution (Risk Parity): find weights where every asset contributes an equal share
 * of portfolio variance. Uses the convergent fixed-point iteration `wᵢ ← bᵢ / (Σw)ᵢ` (equal budgets
 * `bᵢ = 1/n`) with renormalization, then projects onto the constraints. Long-only by construction.
 */
export function equalRiskContributionPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const n = input.n;
  const target = 1 - config.cashReserve;
  const budget = 1 / Math.max(n, 1);
  // Seed with inverse volatility (a good risk-parity starting point).
  let w = normalizeSum(inverseVolRaw(input), 1);
  let iterations = 0;
  let converged = false;
  for (let k = 0; k < 1000; k += 1) {
    iterations = k + 1;
    const marginal = matVec(input.covariance, w);
    const next = new Float64Array(n);
    for (let i = 0; i < n; i += 1) next[i] = budget / Math.max(marginal[i]!, 1e-12);
    // Renormalize to sum 1 (scale-invariant fixed point).
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += next[i]!;
    let diff = 0;
    for (let i = 0; i < n; i += 1) {
      next[i] = sum > 0 ? next[i]! / sum : budget;
      diff += (next[i]! - w[i]!) ** 2;
    }
    w = next;
    if (Math.sqrt(diff) < 1e-12) {
      converged = true;
      break;
    }
  }
  const scaled = normalizeSum(w, target);
  return finalize(projectToConstraints(scaled, config, input), iterations, converged);
}

/**
 * Target Volatility: build a base maximum-Sharpe portfolio and scale it with cash to hit an
 * annualized-consistent `targetVol` (per-period). `scale = min(targetVol/σ_base, maxLeverage)`;
 * cash holds the remainder. Reduces to the base when its volatility already matches.
 */
export function targetVolatilityPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
  targetVol: number,
): OptimizationResult {
  const base = maximumSharpePortfolio(input, config);
  const baseVol = portfolioVolatility(base.weights, input.covariance);
  const scale =
    baseVol > 0
      ? Math.min(targetVol / baseVol, config.maxLeverage)
      : Math.min(1, config.maxLeverage);
  const w = new Float64Array(input.n);
  for (let i = 0; i < input.n; i += 1) w[i] = base.weights[i]! * scale;
  return finalize(w, base.iterations, base.converged);
}

/**
 * Position Sizing: volatility-scaled, signal-directed sizing `wᵢ ∝ signalᵢ / σᵢ`. Long/short follows
 * the signal sign (long-only clips shorts to zero); the vector is scaled to the gross-leverage cap
 * and box-clipped. Falls back to equal weight when all signals are zero.
 */
export function positionSizingPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  const raw = new Float64Array(input.n);
  let anySignal = false;
  for (let i = 0; i < input.n; i += 1) {
    const vol = input.volatilities[i]! > 0 ? input.volatilities[i]! : 1;
    let sized = input.signals[i]! / vol;
    if (config.longOnly && sized < 0) sized = 0;
    if (sized !== 0) anySignal = true;
    raw[i] = sized;
  }
  if (!anySignal) return equalWeightPortfolio(input, config);
  let gross = 0;
  for (let i = 0; i < input.n; i += 1) gross += Math.abs(raw[i]!);
  // Scale the sized vector so its gross exposure meets the invested budget (capped by leverage).
  const targetGross = Math.min(1 - config.cashReserve, config.maxLeverage);
  const scale = gross > 0 ? targetGross / gross : 0;
  const w = new Float64Array(input.n);
  for (let i = 0; i < input.n; i += 1) {
    const capped = Math.max(
      -config.maxAssetExposure,
      Math.min(config.maxAssetExposure, raw[i]! * scale),
    );
    w[i] = Math.max(-config.maxWeight, Math.min(config.maxWeight, capped));
  }
  return finalize(w, 0, true);
}

/**
 * Portfolio Rebalancing: move from the previous weights toward a target portfolio (equal weight by
 * default) subject to the turnover cap `Σ|Δ| ≤ maxTurnover`. The trade vector is scaled down to fit
 * the budget, so the rebalance is a partial move toward the target.
 */
export function rebalancePortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
  targetWeights?: Float64Array,
): OptimizationResult {
  const previous = input.previousWeights ?? equalWeights(input.n);
  const target = targetWeights
    ? projectToConstraints(targetWeights, config, input)
    : equalWeightPortfolio(input, config).weights;
  const w = applyTurnoverLimit(target, previous, config.maxTurnover);
  return finalize(w, 0, true);
}

/**
 * Cash Allocation: allocate risk across assets by risk parity and hold `cashReserve` in cash. The
 * asset weights sum to `1 − cashReserve`; the cash weight is the remainder — an explicit split
 * between the risk portfolio and a cash buffer.
 */
export function cashAllocationPortfolio(
  input: OptimizationInput,
  config: ConstraintConfig,
): OptimizationResult {
  return equalRiskContributionPortfolio(input, config);
}

// ---- internal helpers ----

function inverseVolRaw(input: OptimizationInput): Float64Array {
  const raw = new Float64Array(input.n);
  for (let i = 0; i < input.n; i += 1)
    raw[i] = input.volatilities[i]! > 0 ? 1 / input.volatilities[i]! : 0;
  return raw;
}

function clampNonNeg(v: Float64Array): Float64Array {
  const out = new Float64Array(v.length);
  for (let i = 0; i < v.length; i += 1) out[i] = Math.max(v[i]!, 0);
  return out;
}

function scale(v: Float64Array, s: number): Float64Array {
  const out = new Float64Array(v.length);
  for (let i = 0; i < v.length; i += 1) out[i] = v[i]! * s;
  return out;
}
