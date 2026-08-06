/**
 * Feature-calculation application service — the orchestration surface of the canonical Feature
 * Calculation Engine. It exposes the calculation catalog and dependency graph, executes REAL
 * feature calculations over typed datasets (through the execution pipeline: executor → metadata →
 * validation → cache/registry), records execution history and status, runs benchmarks and reports
 * performance metrics. Reaches datasets, the feature store, caching, result storage, workflows and
 * configuration only through ports.
 *
 * The calculations are real and deterministic (SDK); this layer holds no formulas of its own, no
 * database and no direct infrastructure access.
 */
import {
  FEATURE_CATALOG,
  type FeatureDescriptor,
  type FeatureKey,
} from '@platform/feature-calculation-sdk';
import { runBenchmark, type BenchmarkOptions } from '../domain/benchmark';
import { buildGraph } from '../domain/dependency-graph';
import { executableFeatures } from '../domain/executors';
import { FeatureExecutionPipeline } from '../domain/pipeline';
import type {
  BenchmarkResult,
  DependencyNode,
  ExecutionRecord,
  FeatureRequest,
  FeatureResult,
} from '../domain/models';
import type {
  ConfigurationPort,
  FeatureCache,
  FeatureResultStore,
  FeatureStorePort,
  MarketDataPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface FeatureCalculationServiceDeps {
  readonly marketData: MarketDataPort;
  readonly featureStore: FeatureStorePort;
  readonly cache: FeatureCache;
  readonly resultStore: FeatureResultStore;
  readonly workflow: WorkflowPort;
  readonly config: ConfigurationPort;
  readonly timer: () => number;
  readonly clock: () => string;
  readonly nextId: () => string;
}

export interface FeaturePerformanceRow {
  readonly featureKey: FeatureKey;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: number;
  readonly maxDurationMs: number;
  readonly meanBarsPerSecond: number;
}

export class FeatureCalculationService {
  private readonly pipeline: FeatureExecutionPipeline;
  private readonly history: ExecutionRecord[] = [];

  constructor(private readonly deps: FeatureCalculationServiceDeps) {
    this.pipeline = new FeatureExecutionPipeline({
      getSeries: (ref) => deps.marketData.getSeries(ref),
      cache: deps.cache,
      resultStore: deps.resultStore,
      timer: deps.timer,
      clock: deps.clock,
      nextId: deps.nextId,
    });
  }

  /** The catalog of feature calculations (descriptors). */
  listCalculations(): readonly FeatureDescriptor[] {
    return FEATURE_CATALOG;
  }

  /** The datasets available to compute against. */
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  > {
    return this.deps.marketData.listDatasets();
  }

  /** The feature dependency graph (for the requested keys, or the full catalog). */
  dependencyGraph(keys?: readonly FeatureKey[]): DependencyNode[] {
    return buildGraph(keys ?? executableFeatures());
  }

  /** Execute a single feature calculation and record it. */
  async executeFeature(
    request: FeatureRequest,
  ): Promise<{ record: ExecutionRecord; result?: FeatureResult }> {
    const outcome = await this.pipeline.executeOne(request);
    this.history.unshift(outcome.record);
    if (outcome.result && !outcome.record.cached) {
      await this.deps.featureStore.register(outcome.result.metadata);
      await this.deps.workflow.scheduleComputation(request.featureKey, request.datasetRef);
    }
    return outcome;
  }

  /** Execute a batch of feature calculations in dependency order and record them. */
  async executeBatch(requests: readonly FeatureRequest[]): Promise<readonly ExecutionRecord[]> {
    const outcome = await this.pipeline.run(requests);
    for (const record of outcome.records) this.history.unshift(record);
    for (const result of outcome.results) await this.deps.featureStore.register(result.metadata);
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
  getResult(manifestHash: string): FeatureResult | undefined {
    return this.deps.resultStore.getByManifest(manifestHash);
  }

  /** Benchmark one feature over a dataset. */
  async benchmarkFeature(
    featureKey: FeatureKey,
    datasetRef: string,
    params?: Readonly<Record<string, number>>,
    options?: BenchmarkOptions,
  ): Promise<BenchmarkResult> {
    const series = await this.deps.marketData.getSeries(datasetRef);
    return runBenchmark(featureKey, series, params, options);
  }

  /** Benchmark a suite of features over a dataset. */
  async benchmarkSuite(
    datasetRef: string,
    keys?: readonly FeatureKey[],
    options?: BenchmarkOptions,
  ): Promise<readonly BenchmarkResult[]> {
    const series = await this.deps.marketData.getSeries(datasetRef);
    const features = keys ?? executableFeatures();
    return features.map((featureKey) => runBenchmark(featureKey, series, undefined, options));
  }

  /** Aggregate performance metrics per feature from the execution history. */
  getPerformanceMetrics(): FeaturePerformanceRow[] {
    const byFeature = new Map<FeatureKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = byFeature.get(record.featureKey) ?? [];
      list.push(record);
      byFeature.set(record.featureKey, list);
    }
    const rows: FeaturePerformanceRow[] = [];
    for (const [featureKey, records] of byFeature) {
      const nonCached = records.filter((record) => !record.cached);
      const durations = nonCached.map((record) => record.durationMs);
      const meanDurationMs =
        durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const maxDurationMs = durations.length > 0 ? Math.max(...durations) : 0;
      const meanBars =
        nonCached.length > 0
          ? nonCached.reduce((sum, r) => sum + r.length, 0) / nonCached.length
          : 0;
      rows.push({
        featureKey,
        runs: records.length,
        cachedRuns: records.filter((record) => record.cached).length,
        meanDurationMs,
        maxDurationMs,
        meanBarsPerSecond: meanDurationMs > 0 ? (meanBars * 1000) / meanDurationMs : 0,
      });
    }
    return rows.sort((a, b) => a.featureKey.localeCompare(b.featureKey));
  }
}
