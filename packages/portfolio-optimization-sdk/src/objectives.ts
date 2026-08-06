/**
 * The **Objective Function Engine** — the scalar objectives and portfolio statistics the optimizers
 * maximize/minimize and the reports display: expected return, variance/volatility, Sharpe ratio,
 * diversification ratio, risk contributions, concentration and the mean-variance utility. Pure and
 * deterministic.
 */
import { dot, matVec, quadForm, type Matrix } from './linalg';
import type { OptimizationInput, PortfolioMetrics, RiskContribution } from './types';

/** Portfolio expected return `μᵀw`. */
export function portfolioReturn(weights: Float64Array, meanReturns: Float64Array): number {
  return dot(weights, meanReturns);
}

/** Portfolio variance `wᵀΣw` (≥ 0). */
export function portfolioVariance(weights: Float64Array, covariance: Matrix): number {
  return quadForm(covariance, weights);
}

/** Portfolio volatility `√(wᵀΣw)`. */
export function portfolioVolatility(weights: Float64Array, covariance: Matrix): number {
  return Math.sqrt(portfolioVariance(weights, covariance));
}

/** Sharpe ratio `(μᵀw − rf) / σ_p`. Returns 0 when volatility is 0. */
export function sharpeRatio(
  weights: Float64Array,
  meanReturns: Float64Array,
  covariance: Matrix,
  riskFreeRate = 0,
): number {
  const vol = portfolioVolatility(weights, covariance);
  if (vol === 0) return 0;
  return (portfolioReturn(weights, meanReturns) - riskFreeRate) / vol;
}

/**
 * Diversification ratio `(Σ wᵢσᵢ) / σ_p` — the weighted average of asset volatilities over the
 * portfolio volatility. 1 for a single asset; higher is more diversified. Uses `|wᵢ|` so it is
 * well-defined for long/short portfolios. Returns 0 when volatility is 0.
 */
export function diversificationRatio(
  weights: Float64Array,
  volatilities: Float64Array,
  covariance: Matrix,
): number {
  const vol = portfolioVolatility(weights, covariance);
  if (vol === 0) return 0;
  let weightedVol = 0;
  for (let i = 0; i < weights.length; i += 1)
    weightedVol += Math.abs(weights[i]!) * volatilities[i]!;
  return weightedVol / vol;
}

/** Mean-variance utility `μᵀw − (λ/2)·wᵀΣw`. */
export function meanVarianceUtility(
  weights: Float64Array,
  meanReturns: Float64Array,
  covariance: Matrix,
  riskAversion: number,
): number {
  return (
    portfolioReturn(weights, meanReturns) -
    (riskAversion / 2) * portfolioVariance(weights, covariance)
  );
}

/**
 * Fractional risk contributions `RCᵢ = wᵢ·(Σw)ᵢ / (wᵀΣw)`, one per asset (they sum to 1 when the
 * variance is non-zero). Equal contributions characterize a risk-parity portfolio.
 */
export function riskContributions(
  weights: Float64Array,
  covariance: Matrix,
  assets: readonly string[],
): RiskContribution[] {
  const variance = portfolioVariance(weights, covariance);
  const marginal = matVec(covariance, weights);
  const out: RiskContribution[] = [];
  for (let i = 0; i < weights.length; i += 1) {
    const contribution = variance > 0 ? (weights[i]! * marginal[i]!) / variance : 0;
    out.push({ asset: assets[i] ?? `asset-${i}`, weight: weights[i]!, contribution });
  }
  return out;
}

/** Herfindahl concentration `Σ wᵢ²`. */
export function concentration(weights: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) sum += weights[i]! * weights[i]!;
  return sum;
}

/** Turnover `Σ|wᵢ − wᵢ_prev|`. */
export function turnover(weights: Float64Array, previous: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) sum += Math.abs(weights[i]! - (previous[i]! ?? 0));
  return sum;
}

/** Gross leverage `Σ|wᵢ|`. */
export function grossLeverage(weights: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) sum += Math.abs(weights[i]!);
  return sum;
}

/** Net exposure `Σ wᵢ`. */
export function netExposure(weights: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) sum += weights[i]!;
  return sum;
}

/** Assemble the full portfolio metric set for a weight vector. */
export function portfolioMetrics(
  weights: Float64Array,
  input: OptimizationInput,
): PortfolioMetrics {
  const net = netExposure(weights);
  const gross = grossLeverage(weights);
  const variance = portfolioVariance(weights, input.covariance);
  const previous = input.previousWeights;
  let maxWeight = Number.NEGATIVE_INFINITY;
  let minWeight = Number.POSITIVE_INFINITY;
  for (let i = 0; i < weights.length; i += 1) {
    maxWeight = Math.max(maxWeight, weights[i]!);
    minWeight = Math.min(minWeight, weights[i]!);
  }
  const conc = concentration(weights);
  return {
    expectedReturn: portfolioReturn(weights, input.meanReturns),
    variance,
    volatility: Math.sqrt(variance),
    sharpe: sharpeRatio(weights, input.meanReturns, input.covariance, input.riskFreeRate),
    diversificationRatio: diversificationRatio(weights, input.volatilities, input.covariance),
    effectiveAssets: conc > 0 ? 1 / conc : 0,
    concentration: conc,
    maxWeight: weights.length > 0 ? maxWeight : 0,
    minWeight: weights.length > 0 ? minWeight : 0,
    grossLeverage: gross,
    netExposure: net,
    cashWeight: 1 - net,
    turnover: previous ? turnover(weights, previous) : 0,
    riskContributions: riskContributions(weights, input.covariance, input.assets),
  };
}
