import { bench, describe } from 'vitest';
import {
  covarianceMatrix,
  equalRiskContributionPortfolio,
  efficientFrontier,
  maximumSharpePortfolio,
  meanVariancePortfolio,
  minimumVariancePortfolio,
  momentumSignals,
  resolveConstraints,
  volatilities,
  type OptimizationInput,
} from '../src/index';

/** Deterministic synthetic returns matrix (mulberry32 PRNG — no Math.random) with a common factor. */
function syntheticInput(assets: number, periods: number, seed = 0x0f7a_1c2e): OptimizationInput {
  let state = seed >>> 0;
  const rand = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rows: number[][] = [];
  for (let p = 0; p < periods; p += 1) {
    const factor = (rand() - 0.5) * 0.02;
    const row: number[] = [];
    for (let a = 0; a < assets; a += 1)
      row.push(0.6 * factor + (rand() - 0.5) * 0.02 + 0.0002 * (a % 5));
    rows.push(row);
  }
  const R = { rows: periods, cols: assets, data: Float64Array.from(rows.flat()) };
  const covariance = covarianceMatrix(R);
  const mean = new Float64Array(assets);
  for (let a = 0; a < assets; a += 1) {
    let s = 0;
    for (let p = 0; p < periods; p += 1) s += rows[p]![a]!;
    mean[a] = s / periods;
  }
  return {
    assets: Array.from({ length: assets }, (_, i) => `A${i}`),
    n: assets,
    meanReturns: mean,
    covariance,
    volatilities: volatilities(covariance),
    signals: momentumSignals(R),
    riskFreeRate: 0,
  };
}

const CONFIG = resolveConstraints();
const input = syntheticInput(50, 750);

describe('portfolio optimization over 50 assets × 750 periods', () => {
  bench('minimumVariance', () => void minimumVariancePortfolio(input, CONFIG));
  bench('meanVariance', () => void meanVariancePortfolio(input, CONFIG, 3));
  bench('maximumSharpe', () => void maximumSharpePortfolio(input, CONFIG));
  bench('equalRiskContribution', () => void equalRiskContributionPortfolio(input, CONFIG));
  bench('efficientFrontier(20)', () => void efficientFrontier(input, CONFIG, 20));
});
