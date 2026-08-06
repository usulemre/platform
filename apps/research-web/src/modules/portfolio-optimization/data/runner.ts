/**
 * A runner that builds the optimization input from a universe and binds each catalog optimizer key
 * to its REAL algorithm in `@platform/portfolio-optimization-sdk`. The optimization and the
 * statistical estimation it uses are the real SDK ones — no optimization is mocked. Pure, no IO.
 */
import {
  cashAllocationPortfolio,
  covarianceMatrix,
  describeOptimizer,
  equalRiskContributionPortfolio,
  equalWeights,
  equalWeightPortfolio,
  inverseVolatilityPortfolio,
  maximumDiversificationPortfolio,
  maximumSharpePortfolio,
  meanReturns,
  meanVariancePortfolio,
  minimumVariancePortfolio,
  momentumSignals,
  positionSizingPortfolio,
  rebalancePortfolio,
  targetVolatilityPortfolio,
  volatilities,
  type ConstraintConfig,
  type OptimizationInput,
  type OptimizationResult,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import type { Universe } from './synthetic';

export type OptimizerParams = Readonly<Record<string, number>>;

/** A UI constraint configuration (nullable caps mean "disabled" → Infinity). */
export interface ConstraintDto {
  readonly longOnly: boolean;
  readonly minWeight: number;
  readonly maxWeight: number;
  readonly maxLeverage: number;
  readonly cashReserve: number;
  readonly maxTurnover: number | null;
  readonly maxSectorExposure: number | null;
}

export const DEFAULT_CONSTRAINTS: ConstraintDto = {
  longOnly: true,
  minWeight: 0,
  maxWeight: 1,
  maxLeverage: 1,
  cashReserve: 0,
  maxTurnover: null,
  maxSectorExposure: null,
};

/** Convert a UI constraint DTO into an SDK partial constraint override. */
export function toConstraints(dto: ConstraintDto): Partial<ConstraintConfig> {
  return {
    longOnly: dto.longOnly,
    minWeight: dto.minWeight,
    maxWeight: dto.maxWeight,
    maxAssetExposure: dto.maxWeight,
    maxLeverage: dto.maxLeverage,
    cashReserve: dto.cashReserve,
    maxTurnover: dto.maxTurnover ?? Number.POSITIVE_INFINITY,
    maxSectorExposure: dto.maxSectorExposure ?? Number.POSITIVE_INFINITY,
  };
}

/** Build the estimated optimization input for a universe (real covariance / mean / signals). */
export function buildInput(universe: Universe): OptimizationInput {
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
    riskFreeRate: 0,
  };
}

function param(optimizerKey: OptimizerKey, params: OptimizerParams, name: string): number {
  const provided = params[name];
  if (provided !== undefined) return provided;
  return describeOptimizer(optimizerKey)?.params.find((p) => p.name === name)?.defaultValue ?? 0;
}

/** Merge catalog defaults with the provided params. */
export function resolveParams(
  optimizerKey: OptimizerKey,
  params?: OptimizerParams,
): OptimizerParams {
  const resolved: Record<string, number> = {};
  for (const definition of describeOptimizer(optimizerKey)?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** Run an optimizer (the real SDK algorithm). */
export function runOptimizer(
  optimizerKey: OptimizerKey,
  input: OptimizationInput,
  config: ConstraintConfig,
  params: OptimizerParams,
): OptimizationResult {
  switch (optimizerKey) {
    case 'equal_weight':
      return equalWeightPortfolio(input, config);
    case 'inverse_volatility':
      return inverseVolatilityPortfolio(input, config);
    case 'minimum_variance':
      return minimumVariancePortfolio(input, config);
    case 'mean_variance':
      return meanVariancePortfolio(input, config, param('mean_variance', params, 'riskAversion'));
    case 'maximum_sharpe':
      return maximumSharpePortfolio(input, config);
    case 'maximum_diversification':
      return maximumDiversificationPortfolio(input, config);
    case 'risk_parity':
    case 'equal_risk_contribution':
      return equalRiskContributionPortfolio(input, config);
    case 'target_volatility':
      return targetVolatilityPortfolio(
        input,
        config,
        param('target_volatility', params, 'targetVol'),
      );
    case 'position_sizing':
      return positionSizingPortfolio(input, config);
    case 'portfolio_rebalancing':
      return rebalancePortfolio(input, config);
    case 'cash_allocation':
      return cashAllocationPortfolio(input, config);
    default:
      throw new RangeError(`no runner for optimizer '${optimizerKey}'`);
  }
}

/** Conceptual optimizer→optimizer dependencies for the dependency-graph view (mirrors the service). */
export const OPTIMIZER_DEPENDENCIES: Partial<Record<OptimizerKey, readonly OptimizerKey[]>> = {
  target_volatility: ['maximum_sharpe'],
  cash_allocation: ['risk_parity'],
  portfolio_rebalancing: ['equal_weight'],
};
