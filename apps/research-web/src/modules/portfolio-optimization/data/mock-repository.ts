/**
 * The Portfolio Optimization repository adapter for the UI. It runs the **REAL** SDK optimizers over
 * deterministic synthetic universes — no optimization is mocked — and performs the same feasibility,
 * determinism and objective validation as the engine, plus efficient-frontier, comparison, timing
 * and history. It depends only on `@platform/portfolio-optimization-sdk`; never the service tier.
 */
import {
  OPTIMIZER_CATALOG,
  diversificationRatio,
  efficientFrontier,
  equalWeightPortfolio,
  evaluateConstraints,
  frontierMaxSharpe,
  portfolioMetrics,
  portfolioVariance,
  resolveConstraints,
  sharpeRatio,
  type OptimizationInput,
  type OptimizerDescriptor,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { UNIVERSES, getUniverse } from './synthetic';
import {
  OPTIMIZER_DEPENDENCIES,
  buildInput,
  resolveParams,
  runOptimizer,
  toConstraints,
  type ConstraintDto,
} from './runner';
import type {
  BenchmarkRow,
  ComparisonRowDto,
  DependencyNode,
  ExecutionRecord,
  FrontierPointDto,
  OptimizationResultDto,
  OptimizeRequest,
  PerformanceRow,
  PortfolioOptimizationRepository,
  RunCheck,
} from './repository';

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/** FNV-1a over the raw bytes of a Float64Array — a deterministic content digest. */
function hashFloat64(values: Float64Array): string {
  const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i]!;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/** A method-appropriate optimality check (mirrors the engine's validation). */
function objectiveCheck(
  optimizerKey: OptimizerKey,
  weights: Float64Array,
  input: OptimizationInput,
): RunCheck | null {
  const baseline = equalWeightPortfolio(input, resolveConstraints()).weights;
  switch (optimizerKey) {
    case 'minimum_variance': {
      const v = portfolioVariance(weights, input.covariance);
      const b = portfolioVariance(baseline, input.covariance);
      return {
        id: 'objective',
        label: 'Variance ≤ equal-weight',
        passed: v <= b + 1e-6,
        detail: `${v.toExponential(2)} ≤ ${b.toExponential(2)}`,
      };
    }
    case 'mean_variance':
    case 'maximum_sharpe': {
      const s = sharpeRatio(weights, input.meanReturns, input.covariance, input.riskFreeRate);
      const b = sharpeRatio(baseline, input.meanReturns, input.covariance, input.riskFreeRate);
      return {
        id: 'objective',
        label: 'Sharpe ≥ equal-weight',
        passed: s >= b - 1e-4,
        detail: `${s.toFixed(3)} ≥ ${b.toFixed(3)}`,
      };
    }
    case 'maximum_diversification': {
      const d = diversificationRatio(weights, input.volatilities, input.covariance);
      const b = diversificationRatio(baseline, input.volatilities, input.covariance);
      return {
        id: 'objective',
        label: 'Diversification ≥ equal-weight',
        passed: d >= b - 1e-4,
        detail: `${d.toFixed(3)} ≥ ${b.toFixed(3)}`,
      };
    }
    case 'risk_parity':
    case 'equal_risk_contribution': {
      const rc = portfolioMetrics(weights, input).riskContributions;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      for (const c of rc) {
        min = Math.min(min, c.contribution);
        max = Math.max(max, c.contribution);
      }
      const dispersion = rc.length > 0 ? max - min : 0;
      return {
        id: 'objective',
        label: 'Risk contributions ≈ equal',
        passed: dispersion < 0.05,
        detail: `dispersion ${dispersion.toFixed(4)}`,
      };
    }
    default:
      return null;
  }
}

let executionCounter = 0;

export class MockPortfolioOptimizationRepository implements PortfolioOptimizationRepository {
  private readonly history: ExecutionRecord[] = [];

  async listOptimizers(): Promise<readonly OptimizerDescriptor[]> {
    return OPTIMIZER_CATALOG;
  }

  async listUniverses(): Promise<
    readonly { ref: string; label: string; assets: number; periods: number }[]
  > {
    return UNIVERSES.map((universe) => ({
      ref: universe.ref,
      label: universe.label,
      assets: universe.assets.length,
      periods: universe.returns.rows,
    }));
  }

  async optimize(request: OptimizeRequest): Promise<OptimizationResultDto> {
    const universe = getUniverse(request.universeRef);
    const input = buildInput(universe);
    const config = resolveConstraints(toConstraints(request.constraints));
    const params = resolveParams(request.optimizerKey, request.params);

    const t0 = now();
    const solution = runOptimizer(request.optimizerKey, input, config, params);
    const durationMs = now() - t0;

    const metrics = portfolioMetrics(solution.weights, input);
    const rerun = runOptimizer(request.optimizerKey, input, config, params);
    const deterministic = hashFloat64(rerun.weights) === hashFloat64(solution.weights);
    const constraintChecks = evaluateConstraints(solution.weights, config, input).map((c) => ({
      id: c.id,
      label: c.label,
      passed: c.passed,
      detail: c.detail,
    }));
    const feasible = constraintChecks.every((c) => c.passed);

    let allFinite = true;
    for (let i = 0; i < solution.weights.length; i += 1)
      if (!Number.isFinite(solution.weights[i]!)) allFinite = false;

    const checks: RunCheck[] = [
      {
        id: 'finite',
        label: 'All weights finite',
        passed: allFinite,
        detail: `${solution.weights.length} weights`,
      },
      {
        id: 'feasible',
        label: 'Satisfies all constraints',
        passed: feasible,
        detail: feasible
          ? `${constraintChecks.length} constraints satisfied`
          : `${constraintChecks
              .filter((c) => !c.passed)
              .map((c) => c.id)
              .join(', ')} violated`,
      },
      {
        id: 'determinism',
        label: 'Deterministic on recompute',
        passed: deterministic,
        detail: deterministic ? 'byte-identical' : 'mismatch',
      },
    ];
    const objective = objectiveCheck(request.optimizerKey, solution.weights, input);
    if (objective) checks.push(objective);
    const validationPassed = checks.every((c) => c.passed);

    this.history.unshift({
      id: `opt-exec-${(executionCounter += 1)}`,
      optimizerKey: request.optimizerKey,
      universeRef: request.universeRef,
      status: 'COMPLETED',
      durationMs,
      volatility: metrics.volatility,
      sharpe: metrics.sharpe,
      iterations: solution.iterations,
      converged: solution.converged,
      cached: false,
      validationPassed,
      at: new Date().toISOString(),
    });
    if (this.history.length > 100) this.history.length = 100;

    return {
      optimizerKey: request.optimizerKey,
      universeRef: request.universeRef,
      params,
      assets: input.assets,
      allocations: input.assets.map((asset, i) => ({
        asset,
        weight: solution.weights[i]!,
        riskContribution: metrics.riskContributions[i]?.contribution ?? 0,
        sector: universe.sectors[i],
      })),
      cashWeight: solution.cashWeight,
      metrics: {
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpe: metrics.sharpe,
        diversificationRatio: metrics.diversificationRatio,
        effectiveAssets: metrics.effectiveAssets,
        concentration: metrics.concentration,
        maxWeight: metrics.maxWeight,
        grossLeverage: metrics.grossLeverage,
        netExposure: metrics.netExposure,
        turnover: metrics.turnover,
      },
      iterations: solution.iterations,
      converged: solution.converged,
      durationMs,
      manifestHash: hashFloat64(solution.weights),
      validationPassed,
      checks,
      constraintChecks,
    };
  }

  async efficientFrontier(
    universeRef: string,
    constraints: ConstraintDto,
    points = 20,
  ): Promise<readonly FrontierPointDto[]> {
    const input = buildInput(getUniverse(universeRef));
    const config = resolveConstraints(toConstraints(constraints));
    const frontier = efficientFrontier(input, config, points);
    const best = frontierMaxSharpe(frontier);
    return frontier.map((point) => ({
      riskAversion: point.riskAversion,
      volatility: point.volatility,
      expectedReturn: point.expectedReturn,
      sharpe: point.sharpe,
      isMaxSharpe: best !== undefined && point.riskAversion === best.riskAversion,
    }));
  }

  async compareOptimizers(
    universeRef: string,
    keys: readonly OptimizerKey[],
    constraints: ConstraintDto,
  ): Promise<readonly ComparisonRowDto[]> {
    const input = buildInput(getUniverse(universeRef));
    const config = resolveConstraints(toConstraints(constraints));
    return keys.map((key) => {
      const params = resolveParams(key);
      const solution = runOptimizer(key, input, config, params);
      const metrics = portfolioMetrics(solution.weights, input);
      const constraintChecks = evaluateConstraints(solution.weights, config, input);
      return {
        optimizerKey: key,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpe: metrics.sharpe,
        diversificationRatio: metrics.diversificationRatio,
        effectiveAssets: metrics.effectiveAssets,
        maxWeight: metrics.maxWeight,
        turnover: metrics.turnover,
        validationPassed: constraintChecks.every((c) => c.passed),
      };
    });
  }

  async getExecutionHistory(): Promise<readonly ExecutionRecord[]> {
    return this.history;
  }

  async runBenchmarkSuite(universeRef: string): Promise<readonly BenchmarkRow[]> {
    const input = buildInput(getUniverse(universeRef));
    const config = resolveConstraints();
    const iterations = 15;
    const warmup = 2;
    return OPTIMIZER_CATALOG.map((descriptor) => {
      const params = resolveParams(descriptor.key);
      for (let i = 0; i < warmup; i += 1) runOptimizer(descriptor.key, input, config, params);
      const start = now();
      for (let i = 0; i < iterations; i += 1) runOptimizer(descriptor.key, input, config, params);
      const meanMs = (now() - start) / iterations;
      return {
        optimizerKey: descriptor.key,
        assets: input.n,
        meanMs,
        opsPerSecond: meanMs > 0 ? 1000 / meanMs : Number.POSITIVE_INFINITY,
      };
    });
  }

  async getPerformanceMetrics(): Promise<readonly PerformanceRow[]> {
    const byOptimizer = new Map<OptimizerKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = byOptimizer.get(record.optimizerKey) ?? [];
      list.push(record);
      byOptimizer.set(record.optimizerKey, list);
    }
    const rows: PerformanceRow[] = [];
    for (const [optimizerKey, records] of byOptimizer) {
      const meanDurationMs = records.reduce((a, r) => a + r.durationMs, 0) / records.length;
      const meanIterations = records.reduce((a, r) => a + r.iterations, 0) / records.length;
      rows.push({ optimizerKey, runs: records.length, meanDurationMs, meanIterations });
    }
    return rows.sort((a, b) => a.optimizerKey.localeCompare(b.optimizerKey));
  }

  async dependencyGraph(): Promise<readonly DependencyNode[]> {
    const levelCache = new Map<OptimizerKey, number>();
    const levelOf = (key: OptimizerKey): number => {
      const cached = levelCache.get(key);
      if (cached !== undefined) return cached;
      const deps = OPTIMIZER_DEPENDENCIES[key] ?? [];
      const level = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(levelOf));
      levelCache.set(key, level);
      return level;
    };
    return OPTIMIZER_CATALOG.map((descriptor) => ({
      optimizerKey: descriptor.key,
      level: levelOf(descriptor.key),
      dependsOn: (OPTIMIZER_DEPENDENCIES[descriptor.key] ?? []) as OptimizerKey[],
    }));
  }
}
