/**
 * Portfolio-optimization application service — the orchestration surface of the canonical Portfolio
 * Optimization Engine. It exposes the optimizer catalog and dependency graph, runs REAL
 * optimizations over universes (through the execution pipeline: estimate → optimize → metrics →
 * validation → cache/registry), records execution history and status, computes efficient frontiers,
 * compares optimizers, runs benchmarks and reports performance metrics. Reaches universes, the
 * registry, caching, result storage, workflows and configuration only through ports.
 *
 * The optimization is real and deterministic (SDK); this layer holds no algorithms of its own, no
 * database and no direct infrastructure access. It computes weights only — deploying capital, risk
 * sign-off and execution belong to downstream engines.
 */
import {
  OPTIMIZER_CATALOG,
  efficientFrontier as sdkEfficientFrontier,
  portfolioMetrics,
  resolveConstraints,
  type ConstraintConfig,
  type FrontierPoint,
  type OptimizerDescriptor,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { runBenchmark, type BenchmarkOptions } from '../domain/benchmark';
import { buildGraph } from '../domain/dependency-graph';
import { buildInput } from '../domain/input';
import { executableOptimizers, getExecutor } from '../domain/executors';
import { OptimizationExecutionPipeline, resolveParams } from '../domain/pipeline';
import { validateResult } from '../domain/validation';
import type {
  BenchmarkResult,
  ComparisonRow,
  DependencyNode,
  ExecutionRecord,
  OptimizationRequest,
  OptimizationResultRecord,
  OptimizerParams,
} from '../domain/models';
import type {
  ConfigurationPort,
  MarketDataPort,
  OptimizationCache,
  OptimizationResultStore,
  OptimizationStorePort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface PortfolioOptimizationServiceDeps {
  readonly marketData: MarketDataPort;
  readonly optimizationStore: OptimizationStorePort;
  readonly cache: OptimizationCache;
  readonly resultStore: OptimizationResultStore;
  readonly workflow: WorkflowPort;
  readonly config: ConfigurationPort;
  readonly timer: () => number;
  readonly clock: () => string;
  readonly nextId: () => string;
}

export interface OptimizerPerformanceRow {
  readonly optimizerKey: OptimizerKey;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: number;
  readonly maxDurationMs: number;
  readonly meanIterations: number;
}

export class PortfolioOptimizationService {
  private readonly pipeline: OptimizationExecutionPipeline;
  private readonly history: ExecutionRecord[] = [];

  constructor(private readonly deps: PortfolioOptimizationServiceDeps) {
    this.pipeline = new OptimizationExecutionPipeline({
      getUniverse: (ref) => deps.marketData.getUniverse(ref),
      cache: deps.cache,
      resultStore: deps.resultStore,
      timer: deps.timer,
      clock: deps.clock,
      nextId: deps.nextId,
    });
  }

  /** The catalog of optimization methods (descriptors). */
  listOptimizers(): readonly OptimizerDescriptor[] {
    return OPTIMIZER_CATALOG;
  }

  /** The universes available to optimize over. */
  listUniverses(): Promise<
    readonly {
      readonly ref: string;
      readonly label: string;
      readonly assets: number;
      readonly periods: number;
    }[]
  > {
    return this.deps.marketData.listUniverses();
  }

  /** The optimizer dependency graph (for the requested keys, or the full catalog). */
  dependencyGraph(keys?: readonly OptimizerKey[]): DependencyNode[] {
    return buildGraph(keys ?? executableOptimizers());
  }

  /** Run a single optimization and record it. */
  async optimize(
    request: OptimizationRequest,
  ): Promise<{ record: ExecutionRecord; result?: OptimizationResultRecord }> {
    const outcome = await this.pipeline.executeOne(request);
    this.history.unshift(outcome.record);
    if (outcome.result && !outcome.record.cached) {
      await this.deps.optimizationStore.register(outcome.result.metadata);
      await this.deps.workflow.scheduleOptimization(request.optimizerKey, request.universeRef);
    }
    return outcome;
  }

  /** Run a batch of optimizations in dependency order and record them. */
  async optimizeBatch(
    requests: readonly OptimizationRequest[],
  ): Promise<readonly ExecutionRecord[]> {
    const outcome = await this.pipeline.run(requests);
    for (const record of outcome.records) this.history.unshift(record);
    for (const result of outcome.results)
      await this.deps.optimizationStore.register(result.metadata);
    return outcome.records;
  }

  /** The full execution history (newest first). */
  getExecutionHistory(): readonly ExecutionRecord[] {
    return this.history;
  }

  /** The most recent execution records (execution status view). */
  getExecutionStatus(limit = 10): readonly ExecutionRecord[] {
    return this.history.slice(0, limit);
  }

  /** Retrieve a stored result by manifest hash. */
  getResult(manifestHash: string): OptimizationResultRecord | undefined {
    return this.deps.resultStore.getByManifest(manifestHash);
  }

  /** Compute the efficient frontier over a universe. */
  async efficientFrontier(
    universeRef: string,
    constraints?: Partial<ConstraintConfig>,
    points = 20,
  ): Promise<readonly FrontierPoint[]> {
    const universe = await this.deps.marketData.getUniverse(universeRef);
    const input = buildInput(universe);
    return sdkEfficientFrontier(input, resolveConstraints(constraints), points);
  }

  /** Compare several optimizers over the same universe and constraints. */
  async compareOptimizers(
    universeRef: string,
    keys: readonly OptimizerKey[],
    constraints?: Partial<ConstraintConfig>,
  ): Promise<readonly ComparisonRow[]> {
    const universe = await this.deps.marketData.getUniverse(universeRef);
    const input = buildInput(universe);
    const config = resolveConstraints(constraints);
    return keys.map((key) => {
      const params = resolveParams(key);
      const solution = getExecutor(key)(input, config, params);
      const metrics = portfolioMetrics(solution.weights, input);
      const validation = validateResult(key, params, input, config, solution);
      return {
        optimizerKey: key,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpe: metrics.sharpe,
        diversificationRatio: metrics.diversificationRatio,
        effectiveAssets: metrics.effectiveAssets,
        maxWeight: metrics.maxWeight,
        turnover: metrics.turnover,
        validationPassed: validation.passed,
      };
    });
  }

  /** Benchmark one optimizer over a universe. */
  async benchmarkOptimizer(
    optimizerKey: OptimizerKey,
    universeRef: string,
    params?: OptimizerParams,
    constraints?: Partial<ConstraintConfig>,
    options?: BenchmarkOptions,
  ): Promise<BenchmarkResult> {
    const universe = await this.deps.marketData.getUniverse(universeRef);
    return runBenchmark(
      optimizerKey,
      buildInput(universe),
      resolveConstraints(constraints),
      params,
      options,
    );
  }

  /** Benchmark a suite of optimizers over a universe. */
  async benchmarkSuite(
    universeRef: string,
    keys?: readonly OptimizerKey[],
    options?: BenchmarkOptions,
  ): Promise<readonly BenchmarkResult[]> {
    const universe = await this.deps.marketData.getUniverse(universeRef);
    const input = buildInput(universe);
    const config = resolveConstraints();
    const optimizers = keys ?? executableOptimizers();
    return optimizers.map((optimizerKey) =>
      runBenchmark(optimizerKey, input, config, undefined, options),
    );
  }

  /** Aggregate performance metrics per optimizer from the execution history. */
  getPerformanceMetrics(): OptimizerPerformanceRow[] {
    const byOptimizer = new Map<OptimizerKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = byOptimizer.get(record.optimizerKey) ?? [];
      list.push(record);
      byOptimizer.set(record.optimizerKey, list);
    }
    const rows: OptimizerPerformanceRow[] = [];
    for (const [optimizerKey, records] of byOptimizer) {
      const nonCached = records.filter((record) => !record.cached);
      const durations = nonCached.map((record) => record.durationMs);
      const meanDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const maxDurationMs = durations.length > 0 ? Math.max(...durations) : 0;
      const meanIterations =
        nonCached.length > 0
          ? nonCached.reduce((sum, r) => sum + r.iterations, 0) / nonCached.length
          : 0;
      rows.push({
        optimizerKey,
        runs: records.length,
        cachedRuns: records.filter((record) => record.cached).length,
        meanDurationMs,
        maxDurationMs,
        meanIterations,
      });
    }
    return rows.sort((a, b) => a.optimizerKey.localeCompare(b.optimizerKey));
  }
}
