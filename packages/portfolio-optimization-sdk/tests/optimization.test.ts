import { describe, it, expect } from 'vitest';
import {
  cashAllocationPortfolio,
  cholesky,
  covarianceMatrix,
  defaultConstraints,
  diversificationRatio,
  efficientFrontier,
  equalRiskContributionPortfolio,
  equalWeightPortfolio,
  evaluateConstraints,
  frontierMaxSharpe,
  inverseVolatilityPortfolio,
  invSPD,
  largestEigenvalue,
  matrix,
  maximumDiversificationPortfolio,
  maximumSharpePortfolio,
  meanVariancePortfolio,
  minimumVariancePortfolio,
  portfolioMetrics,
  portfolioVariance,
  positionSizingPortfolio,
  projectToConstraints,
  rebalancePortfolio,
  resolveConstraints,
  riskContributions,
  returnsMatrix,
  solveSPD,
  targetVolatilityPortfolio,
  volatilities,
  type ConstraintConfig,
  type OptimizationInput,
} from '../src/index';

/** Build a diagonal-covariance optimization input for hand-checkable tests. */
function diagInput(
  variances: number[],
  opts: {
    means?: number[];
    signals?: number[];
    previous?: number[];
    sectors?: string[];
    riskFreeRate?: number;
  } = {},
): OptimizationInput {
  const n = variances.length;
  const data = new Float64Array(n * n);
  for (let i = 0; i < n; i += 1) data[i * n + i] = variances[i]!;
  const covariance = { rows: n, cols: n, data };
  return {
    assets: Array.from({ length: n }, (_, i) => `A${i}`),
    n,
    meanReturns: Float64Array.from(opts.means ?? new Array(n).fill(0)),
    covariance,
    volatilities: Float64Array.from(variances.map((v) => Math.sqrt(v))),
    signals: Float64Array.from(opts.signals ?? new Array(n).fill(0)),
    previousWeights: opts.previous ? Float64Array.from(opts.previous) : undefined,
    sectors: opts.sectors,
    riskFreeRate: opts.riskFreeRate ?? 0,
  };
}

function sum(w: Float64Array): number {
  let s = 0;
  for (let i = 0; i < w.length; i += 1) s += w[i]!;
  return s;
}

const DEFAULT = defaultConstraints();

describe('linear algebra', () => {
  it('Cholesky solves an SPD system', () => {
    const A = matrix([
      [4, 0],
      [0, 9],
    ]);
    const x = solveSPD(A, Float64Array.from([4, 9]));
    expect(x[0]!).toBeCloseTo(1, 9);
    expect(x[1]!).toBeCloseTo(1, 9);
    expect(cholesky(A)).not.toBeNull();
  });

  it('inverts an SPD matrix and estimates the largest eigenvalue', () => {
    const inv = invSPD(
      matrix([
        [4, 0],
        [0, 9],
      ]),
    );
    expect(inv.data[0]!).toBeCloseTo(0.25, 9);
    expect(inv.data[3]!).toBeCloseTo(1 / 9, 9);
    expect(
      largestEigenvalue(
        matrix([
          [2, 0],
          [0, 5],
        ]),
      ),
    ).toBeCloseTo(5, 6);
  });

  it('regularizes a singular matrix instead of failing', () => {
    const singular = matrix([
      [1, 1],
      [1, 1],
    ]);
    expect(() => solveSPD(singular, Float64Array.from([1, 1]))).not.toThrow();
  });
});

describe('statistics', () => {
  it('estimates the sample covariance and volatilities', () => {
    const R = returnsMatrix([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const cov = covarianceMatrix(R);
    expect(cov.data[0]!).toBeCloseTo(4, 9);
    expect(cov.data[3]!).toBeCloseTo(4, 9);
    expect(cov.data[1]!).toBeCloseTo(4, 9); // perfectly correlated
    expect(Array.from(volatilities(cov))).toEqual([2, 2]);
  });
});

describe('naive & risk-based optimizers (diagonal covariance)', () => {
  it('equal weight allocates 1/n', () => {
    const w = equalWeightPortfolio(diagInput([1, 4, 16]), DEFAULT).weights;
    expect(Array.from(w)).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it('inverse volatility weights ∝ 1/σ', () => {
    const w = inverseVolatilityPortfolio(diagInput([1, 4, 16]), DEFAULT).weights; // σ = [1,2,4]
    expect(w[0]!).toBeCloseTo(4 / 7, 6);
    expect(w[1]!).toBeCloseTo(2 / 7, 6);
    expect(w[2]!).toBeCloseTo(1 / 7, 6);
  });

  it('minimum variance reduces variance below equal weight', () => {
    const input = diagInput([1, 4, 16]);
    const mv = minimumVariancePortfolio(input, DEFAULT);
    expect(sum(mv.weights)).toBeCloseTo(1, 4);
    expect(portfolioVariance(mv.weights, input.covariance)).toBeLessThan(
      portfolioVariance(equalWeightPortfolio(input, DEFAULT).weights, input.covariance),
    );
    // approaches the analytic w ∝ 1/σ² = [1, 0.25, 0.0625]
    expect(mv.weights[0]!).toBeCloseTo(0.7619, 2);
  });

  it('equal risk contribution equalizes risk (≈ inverse vol on a diagonal Σ)', () => {
    const input = diagInput([1, 4, 16]);
    const erc = equalRiskContributionPortfolio(input, DEFAULT);
    expect(erc.weights[0]!).toBeCloseTo(4 / 7, 3);
    const rc = riskContributions(erc.weights, input.covariance, input.assets);
    for (const contribution of rc) expect(contribution.contribution).toBeCloseTo(1 / 3, 3);
  });

  it('maximum diversification equals inverse vol on a diagonal Σ', () => {
    const w = maximumDiversificationPortfolio(diagInput([1, 4, 16]), DEFAULT).weights;
    expect(w[0]!).toBeCloseTo(4 / 7, 3);
  });
});

describe('return-based optimizers', () => {
  it('mean-variance tilts toward the higher-return asset at low risk aversion', () => {
    const input = diagInput([4, 4, 4], { means: [0.1, 0.0, 0.0] });
    const w = meanVariancePortfolio(input, DEFAULT, 0.5).weights;
    expect(sum(w)).toBeCloseTo(1, 4);
    expect(w[0]!).toBeGreaterThan(w[1]!);
    expect(w[0]!).toBeGreaterThan(w[2]!);
  });

  it('maximum sharpe favors the best risk-adjusted asset and beats equal weight', () => {
    const input = diagInput([4, 4, 4], { means: [0.1, 0.05, 0.0] });
    const ms = maximumSharpePortfolio(input, DEFAULT);
    expect(w0IsMax(ms.weights)).toBe(true);
    const equalSharpe = portfolioMetrics(
      equalWeightPortfolio(input, DEFAULT).weights,
      input,
    ).sharpe;
    expect(portfolioMetrics(ms.weights, input).sharpe).toBeGreaterThanOrEqual(equalSharpe - 1e-9);
  });
});

function w0IsMax(w: Float64Array): boolean {
  for (let i = 1; i < w.length; i += 1) if (w[0]! < w[i]!) return false;
  return true;
}

describe('allocation optimizers', () => {
  it('target volatility scales toward the target and holds cash', () => {
    const input = diagInput([16, 16, 16], { means: [0.05, 0.02, 0.01] });
    const result = targetVolatilityPortfolio(input, DEFAULT, 1);
    const vol = Math.sqrt(portfolioVariance(result.weights, input.covariance));
    expect(vol).toBeLessThanOrEqual(4 + 1e-6); // base vol ~4, target 1 → scaled down
    expect(result.cashWeight).toBeGreaterThan(0);
  });

  it('position sizing follows signal direction, vol-scaled (long-only clips shorts)', () => {
    const input = diagInput([1, 1, 1], { signals: [1, -1, 0] });
    const w = positionSizingPortfolio(input, DEFAULT).weights;
    expect(w[0]!).toBeGreaterThan(0);
    expect(w[1]!).toBe(0);
    expect(w[2]!).toBe(0);
  });

  it('position sizing goes short under a long/short mandate', () => {
    const input = diagInput([1, 1], { signals: [1, -1] });
    const config: ConstraintConfig = resolveConstraints({
      longOnly: false,
      minWeight: -1,
      maxLeverage: 2,
    });
    const w = positionSizingPortfolio(input, config).weights;
    expect(w[0]!).toBeGreaterThan(0);
    expect(w[1]!).toBeLessThan(0);
  });

  it('rebalancing respects the turnover cap', () => {
    const input = diagInput([1, 1, 1], { previous: [1, 0, 0] });
    const config = resolveConstraints({ maxTurnover: 0.5 });
    const result = rebalancePortfolio(input, config);
    let turnover = 0;
    for (let i = 0; i < 3; i += 1)
      turnover += Math.abs(result.weights[i]! - input.previousWeights![i]!);
    expect(turnover).toBeCloseTo(0.5, 4);
  });

  it('cash allocation reserves cash', () => {
    const input = diagInput([1, 4, 16]);
    const config = resolveConstraints({ cashReserve: 0.2 });
    const result = cashAllocationPortfolio(input, config);
    expect(sum(result.weights)).toBeCloseTo(0.8, 3);
    expect(result.cashWeight).toBeCloseTo(0.2, 3);
  });
});

describe('constraint engine', () => {
  it('projects onto a max-weight box while keeping the budget', () => {
    const input = diagInput([1, 4, 16]);
    const config = resolveConstraints({ maxWeight: 0.4 });
    const w = projectToConstraints(Float64Array.from([0.9, 0.05, 0.05]), config, input);
    expect(sum(w)).toBeCloseTo(1, 4);
    for (let i = 0; i < 3; i += 1) expect(w[i]!).toBeLessThanOrEqual(0.4 + 1e-6);
  });

  it('respects a gross-leverage cap for long/short portfolios', () => {
    const input = diagInput([1, 1], { signals: [1, -1] });
    const config = resolveConstraints({ longOnly: false, minWeight: -1, maxLeverage: 1.5 });
    const w = projectToConstraints(Float64Array.from([1.5, -1.5]), config, input);
    let gross = 0;
    for (let i = 0; i < 2; i += 1) gross += Math.abs(w[i]!);
    expect(gross).toBeLessThanOrEqual(1.5 + 1e-4);
  });

  it('evaluates constraints as satisfied for a projected portfolio', () => {
    const input = diagInput([1, 4, 16]);
    const config = resolveConstraints({ maxWeight: 0.5 });
    const w = minimumVariancePortfolio(input, config).weights;
    const checks = evaluateConstraints(w, config, input);
    expect(checks.every((check) => check.passed)).toBe(true);
  });
});

describe('efficient frontier & metrics', () => {
  it('builds a frontier sorted by volatility with a max-Sharpe point', () => {
    const input = diagInput([1, 4, 9], { means: [0.02, 0.04, 0.06] });
    const frontier = efficientFrontier(input, DEFAULT, 12);
    expect(frontier.length).toBe(12);
    for (let i = 1; i < frontier.length; i += 1)
      expect(frontier[i]!.volatility).toBeGreaterThanOrEqual(frontier[i - 1]!.volatility - 1e-9);
    expect(frontierMaxSharpe(frontier)).toBeDefined();
  });

  it('risk contributions and diversification ratio are well-defined', () => {
    const input = diagInput([1, 4, 16]);
    const w = equalWeightPortfolio(input, DEFAULT).weights;
    const rc = riskContributions(w, input.covariance, input.assets);
    let total = 0;
    for (const c of rc) total += c.contribution;
    expect(total).toBeCloseTo(1, 9);
    expect(diversificationRatio(w, input.volatilities, input.covariance)).toBeGreaterThan(1);
  });
});

describe('determinism', () => {
  it('produces identical weights on repeated runs', () => {
    const input = diagInput([1, 4, 16], { means: [0.03, 0.01, 0.02] });
    const a = meanVariancePortfolio(input, DEFAULT, 5).weights;
    const b = meanVariancePortfolio(input, DEFAULT, 5).weights;
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});
