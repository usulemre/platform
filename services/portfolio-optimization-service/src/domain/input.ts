/**
 * The optimization-input builder — turns a universe (assets + a returns matrix + sectors) into the
 * SDK `OptimizationInput` by estimating the mean returns, covariance, volatilities and momentum
 * signals with the real SDK statistics. Deterministic; the previous weights default to equal weight.
 */
import {
  covarianceMatrix,
  equalWeights,
  meanReturns,
  momentumSignals,
  volatilities,
  type Matrix,
  type OptimizationInput,
} from '@platform/portfolio-optimization-sdk';

/** A tradable universe: assets, a `T×N` returns matrix and optional per-asset sectors. */
export interface Universe {
  readonly ref: string;
  readonly label: string;
  readonly assets: readonly string[];
  readonly returns: Matrix;
  readonly sectors?: readonly string[];
}

/** Build the estimated optimization input for a universe (real covariance / mean / signal estimation). */
export function buildInput(universe: Universe, riskFreeRate = 0): OptimizationInput {
  const covariance = covarianceMatrix(universe.returns);
  const n = universe.assets.length;
  return {
    assets: universe.assets,
    n,
    meanReturns: meanReturns(universe.returns),
    covariance,
    volatilities: volatilities(covariance),
    signals: momentumSignals(universe.returns),
    previousWeights: equalWeights(n),
    sectors: universe.sectors,
    riskFreeRate,
  };
}
