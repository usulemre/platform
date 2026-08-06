/**
 * The optimization validation pipeline. Runs REAL, deterministic checks on a computed allocation:
 *
 *  1. **Finite** — every weight is a finite number (no NaN/Infinity from a numerical failure).
 *  2. **Feasible** — the weights satisfy every configured constraint (box, budget, leverage,
 *     long-only, asset/sector exposure, turnover) via the Constraint Engine.
 *  3. **Determinism** — recomputing yields a byte-identical weight vector (RP-1 reproducibility).
 *  4. **Objective** — a method-appropriate optimality sanity check (e.g. minimum variance really has
 *     variance ≤ the equal-weight portfolio; risk parity really equalizes risk contributions).
 *
 * Pure and deterministic; no IO.
 */
import {
  diversificationRatio,
  equalWeightPortfolio,
  evaluateConstraints,
  portfolioMetrics,
  portfolioVariance,
  sharpeRatio,
  type ConstraintConfig,
  type OptimizationInput,
  type OptimizationResult,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { getExecutor } from './executors';
import { hashFloat64 } from './hashing';
import type { OptimizerParams, ValidationCheck, ValidationReport } from './models';

const TOL = 1e-6;

/** A method-appropriate optimality/quality sanity check (or `null` if none applies). */
function objectiveCheck(
  optimizerKey: OptimizerKey,
  weights: Float64Array,
  input: OptimizationInput,
  config: ConstraintConfig,
): ValidationCheck | null {
  const baseline = equalWeightPortfolio(input, config).weights;
  switch (optimizerKey) {
    case 'minimum_variance': {
      const v = portfolioVariance(weights, input.covariance);
      const base = portfolioVariance(baseline, input.covariance);
      return {
        id: 'objective',
        label: 'Variance ≤ equal-weight variance',
        passed: v <= base + TOL,
        detail: `${v.toExponential(3)} ≤ ${base.toExponential(3)}`,
      };
    }
    case 'mean_variance':
    case 'maximum_sharpe': {
      const s = sharpeRatio(weights, input.meanReturns, input.covariance, input.riskFreeRate);
      const base = sharpeRatio(baseline, input.meanReturns, input.covariance, input.riskFreeRate);
      return {
        id: 'objective',
        label: 'Sharpe ≥ equal-weight Sharpe',
        passed: s >= base - 1e-4,
        detail: `${s.toFixed(4)} ≥ ${base.toFixed(4)}`,
      };
    }
    case 'maximum_diversification': {
      const d = diversificationRatio(weights, input.volatilities, input.covariance);
      const base = diversificationRatio(baseline, input.volatilities, input.covariance);
      return {
        id: 'objective',
        label: 'Diversification ≥ equal-weight',
        passed: d >= base - 1e-4,
        detail: `${d.toFixed(4)} ≥ ${base.toFixed(4)}`,
      };
    }
    case 'risk_parity':
    case 'equal_risk_contribution': {
      const contributions = portfolioMetrics(weights, input).riskContributions;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const c of contributions) {
        min = Math.min(min, c.contribution);
        max = Math.max(max, c.contribution);
      }
      const dispersion = contributions.length > 0 ? max - min : 0;
      return {
        id: 'objective',
        label: 'Risk contributions ≈ equal',
        passed: dispersion < 0.05,
        detail: `dispersion ${dispersion.toFixed(4)} < 0.05`,
      };
    }
    default:
      return null;
  }
}

export function validateResult(
  optimizerKey: OptimizerKey,
  params: OptimizerParams,
  input: OptimizationInput,
  config: ConstraintConfig,
  result: OptimizationResult,
): ValidationReport {
  const weights = result.weights;
  const checks: ValidationCheck[] = [];

  let allFinite = true;
  for (let i = 0; i < weights.length; i += 1) if (!Number.isFinite(weights[i]!)) allFinite = false;
  checks.push({
    id: 'finite',
    label: 'All weights are finite',
    passed: allFinite,
    detail: allFinite ? `${weights.length} finite weights` : 'contains NaN/Infinity',
  });

  const constraintChecks = evaluateConstraints(weights, config, input);
  const feasible = constraintChecks.every((c) => c.passed);
  checks.push({
    id: 'feasible',
    label: 'Satisfies all constraints',
    passed: feasible,
    detail: feasible
      ? `${constraintChecks.length} constraints satisfied`
      : `${constraintChecks
          .filter((c) => !c.passed)
          .map((c) => c.id)
          .join(', ')} violated`,
  });

  const rerun = getExecutor(optimizerKey)(input, config, params);
  const deterministic = hashFloat64(rerun.weights) === hashFloat64(weights);
  checks.push({
    id: 'determinism',
    label: 'Deterministic on recompute',
    passed: deterministic,
    detail: deterministic ? 'byte-identical' : 'mismatch',
  });

  const objective = objectiveCheck(optimizerKey, weights, input, config);
  if (objective) checks.push(objective);

  return { passed: checks.every((check) => check.passed), checks };
}

/** The per-constraint evaluation (for reports). */
export function constraintReport(
  weights: Float64Array,
  config: ConstraintConfig,
  input: OptimizationInput,
): readonly ValidationCheck[] {
  return evaluateConstraints(weights, config, input).map((c) => ({
    id: c.id,
    label: c.label,
    passed: c.passed,
    detail: c.detail,
  }));
}
