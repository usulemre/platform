/**
 * The **Efficient Frontier** — the set of mean-variance-optimal portfolios across a range of
 * risk-aversion values. For each `λ` on a geometric grid the constrained mean-variance problem is
 * solved and the resulting risk/return/Sharpe point recorded, sorted by volatility. Deterministic.
 */
import { meanVariancePortfolio } from './optimizers';
import { portfolioReturn, portfolioVolatility, sharpeRatio } from './objectives';
import type { ConstraintConfig, FrontierPoint, OptimizationInput } from './types';

/** Compute an efficient frontier of `points` mean-variance portfolios (sorted by volatility). */
export function efficientFrontier(
  input: OptimizationInput,
  config: ConstraintConfig,
  points = 20,
): FrontierPoint[] {
  const count = Math.max(2, points);
  const minLambda = 0.1;
  const maxLambda = 200;
  const logMin = Math.log(minLambda);
  const logMax = Math.log(maxLambda);
  const frontier: FrontierPoint[] = [];
  for (let k = 0; k < count; k += 1) {
    const riskAversion = Math.exp(logMin + ((logMax - logMin) * k) / (count - 1));
    const solution = meanVariancePortfolio(input, config, riskAversion);
    frontier.push({
      riskAversion,
      volatility: portfolioVolatility(solution.weights, input.covariance),
      expectedReturn: portfolioReturn(solution.weights, input.meanReturns),
      sharpe: sharpeRatio(
        solution.weights,
        input.meanReturns,
        input.covariance,
        input.riskFreeRate,
      ),
      weights: solution.weights,
    });
  }
  return frontier.sort((a, b) => a.volatility - b.volatility);
}

/** The portfolio with the maximum Sharpe ratio on a computed frontier. */
export function frontierMaxSharpe(frontier: readonly FrontierPoint[]): FrontierPoint | undefined {
  let best: FrontierPoint | undefined;
  for (const point of frontier) if (!best || point.sharpe > best.sharpe) best = point;
  return best;
}
