/**
 * Optimizer executors — the uniform interface that binds each catalog optimizer key to its REAL
 * algorithm in `@platform/portfolio-optimization-sdk`. Executors are pure and deterministic: they
 * take the estimated input, the resolved constraints and parameters, and return the optimized
 * weights. No IO, no mutation of inputs.
 */
import {
  cashAllocationPortfolio,
  describeOptimizer,
  equalRiskContributionPortfolio,
  equalWeightPortfolio,
  inverseVolatilityPortfolio,
  maximumDiversificationPortfolio,
  maximumSharpePortfolio,
  meanVariancePortfolio,
  minimumVariancePortfolio,
  positionSizingPortfolio,
  rebalancePortfolio,
  targetVolatilityPortfolio,
  type ConstraintConfig,
  type OptimizationInput,
  type OptimizationResult,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import type { OptimizerParams } from './models';

export type OptimizerExecutor = (
  input: OptimizationInput,
  config: ConstraintConfig,
  params: OptimizerParams,
) => OptimizationResult;

/** Resolve a numeric parameter, falling back to the catalog default. */
function param(optimizerKey: OptimizerKey, params: OptimizerParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  const definition = describeOptimizer(optimizerKey)?.params.find((p) => p.name === name);
  if (!definition)
    throw new RangeError(`unknown parameter '${name}' for optimizer '${optimizerKey}'`);
  return definition.defaultValue;
}

const EXECUTORS: Record<OptimizerKey, OptimizerExecutor> = {
  equal_weight: (i, c) => equalWeightPortfolio(i, c),
  inverse_volatility: (i, c) => inverseVolatilityPortfolio(i, c),
  minimum_variance: (i, c) => minimumVariancePortfolio(i, c),
  mean_variance: (i, c, p) =>
    meanVariancePortfolio(i, c, param('mean_variance', p, 'riskAversion')),
  maximum_sharpe: (i, c) => maximumSharpePortfolio(i, c),
  maximum_diversification: (i, c) => maximumDiversificationPortfolio(i, c),
  risk_parity: (i, c) => equalRiskContributionPortfolio(i, c),
  equal_risk_contribution: (i, c) => equalRiskContributionPortfolio(i, c),
  target_volatility: (i, c, p) =>
    targetVolatilityPortfolio(i, c, param('target_volatility', p, 'targetVol')),
  position_sizing: (i, c) => positionSizingPortfolio(i, c),
  portfolio_rebalancing: (i, c) => rebalancePortfolio(i, c),
  cash_allocation: (i, c) => cashAllocationPortfolio(i, c),
};

/** Look up the executor for an optimizer key. */
export function getExecutor(optimizerKey: OptimizerKey): OptimizerExecutor {
  const executor = EXECUTORS[optimizerKey];
  if (!executor) throw new RangeError(`no executor registered for optimizer '${optimizerKey}'`);
  return executor;
}

/** Every optimizer key that has a registered executor. */
export function executableOptimizers(): readonly OptimizerKey[] {
  return Object.keys(EXECUTORS) as OptimizerKey[];
}
