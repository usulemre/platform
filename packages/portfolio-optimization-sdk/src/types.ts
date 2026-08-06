/**
 * Core types for the Portfolio Optimization SDK — the production library that constructs optimal
 * portfolios from expected returns, a covariance matrix and trading signals, subject to real
 * constraints. All optimizers are deterministic and reproducible (RP-1): the same input always
 * yields the same weights. No randomness, no ambient state, no wall-clock reads.
 *
 * A portfolio is a weight vector `w` (one weight per asset). Fully-invested long-only portfolios
 * have `Σ wᵢ = 1 − cashReserve` and `wᵢ ≥ 0`; long/short portfolios allow negative weights bounded
 * by a gross-leverage cap `Σ|wᵢ| ≤ L`. Cash is `1 − Σ wᵢ`.
 */
import type { Matrix } from './linalg';

export type { Matrix } from './linalg';

/** The estimated inputs an optimizer works from (produced from a returns matrix + signals). */
export interface OptimizationInput {
  readonly assets: readonly string[];
  readonly n: number;
  /** Expected (mean) return per asset, per period. */
  readonly meanReturns: Float64Array;
  /** The asset return covariance matrix `Σ`. */
  readonly covariance: Matrix;
  /** Per-asset volatility `σ = √diag(Σ)`. */
  readonly volatilities: Float64Array;
  /** Per-asset trading signal (direction/strength) in `[-1, 1]`. */
  readonly signals: Float64Array;
  /** The previous portfolio weights (for turnover / rebalancing); defaults to equal weight. */
  readonly previousWeights?: Float64Array;
  /** Per-asset sector label (for sector-exposure constraints). */
  readonly sectors?: readonly string[];
  /** Per-asset liquidity capacity as a max weight (for liquidity constraints). */
  readonly liquidityCaps?: Float64Array;
  /** The per-period risk-free rate used by Sharpe-based objectives. */
  readonly riskFreeRate: number;
}

/**
 * A portfolio constraint configuration. `Infinity` disables an upper-bound constraint; the box
 * `[minWeight, maxWeight]` and `maxAssetExposure` bound individual positions.
 */
export interface ConstraintConfig {
  /** Long-only (`wᵢ ≥ max(minWeight, 0)`) vs long/short (negatives allowed). */
  readonly longOnly: boolean;
  /** Per-position lower bound (for long-only, a floor ≥ 0). */
  readonly minWeight: number;
  /** Per-position upper bound. */
  readonly maxWeight: number;
  /** Absolute per-asset exposure cap `|wᵢ| ≤ maxAssetExposure`. */
  readonly maxAssetExposure: number;
  /** Gross-leverage cap `Σ|wᵢ| ≤ maxLeverage`. */
  readonly maxLeverage: number;
  /** Fraction held as cash — the invested weights sum to `1 − cashReserve`. */
  readonly cashReserve: number;
  /** Max turnover `Σ|wᵢ − wᵢ_prev| ≤ maxTurnover` (`Infinity` = unconstrained). */
  readonly maxTurnover: number;
  /** Max exposure of any one sector `Σ_{i∈sector} wᵢ ≤ maxSectorExposure` (`Infinity` = off). */
  readonly maxSectorExposure: number;
}

/** The risk contribution of a single asset. */
export interface RiskContribution {
  readonly asset: string;
  readonly weight: number;
  /** Fraction of total portfolio variance attributable to this asset. */
  readonly contribution: number;
}

/** Portfolio-level metrics computed from a weight vector and the optimization input. */
export interface PortfolioMetrics {
  readonly expectedReturn: number;
  readonly variance: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly diversificationRatio: number;
  /** Effective number of assets `1 / Σ wᵢ²` (inverse Herfindahl). */
  readonly effectiveAssets: number;
  /** Herfindahl concentration `Σ wᵢ²`. */
  readonly concentration: number;
  readonly maxWeight: number;
  readonly minWeight: number;
  /** Gross leverage `Σ|wᵢ|`. */
  readonly grossLeverage: number;
  /** Net exposure `Σ wᵢ`. */
  readonly netExposure: number;
  readonly cashWeight: number;
  /** Turnover vs the previous weights `Σ|wᵢ − wᵢ_prev|` (0 if no previous weights). */
  readonly turnover: number;
  readonly riskContributions: readonly RiskContribution[];
}

/** The result of one optimization: weights, cash and diagnostics. */
export interface OptimizationResult {
  readonly weights: Float64Array;
  readonly cashWeight: number;
  /** Iterations used by an iterative optimizer (0 for closed-form). */
  readonly iterations: number;
  readonly converged: boolean;
}

/** A point on the efficient frontier. */
export interface FrontierPoint {
  readonly riskAversion: number;
  readonly volatility: number;
  readonly expectedReturn: number;
  readonly sharpe: number;
  readonly weights: Float64Array;
}

/** The default (fully-invested, long-only, unlevered) constraint configuration. */
export function defaultConstraints(): ConstraintConfig {
  return {
    longOnly: true,
    minWeight: 0,
    maxWeight: 1,
    maxAssetExposure: 1,
    maxLeverage: 1,
    cashReserve: 0,
    maxTurnover: Number.POSITIVE_INFINITY,
    maxSectorExposure: Number.POSITIVE_INFINITY,
  };
}

/** Merge a partial constraint override onto the defaults. */
export function resolveConstraints(overrides?: Partial<ConstraintConfig>): ConstraintConfig {
  return { ...defaultConstraints(), ...overrides };
}

/** An equal-weight vector of length `n`. */
export function equalWeights(n: number): Float64Array {
  const w = new Float64Array(n);
  w.fill(n > 0 ? 1 / n : 0);
  return w;
}
