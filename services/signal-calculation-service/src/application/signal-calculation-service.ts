/**
 * Signal-calculation application service — the orchestration surface of the canonical Signal
 * Calculation Engine. It exposes the signal catalog and dependency graph, executes REAL signal
 * generators over typed datasets (through the execution pipeline: executor → metadata → validation →
 * cache/registry), records execution history and status, compares signals, runs benchmarks and
 * reports performance metrics. Reaches datasets, the signal registry, caching, result storage,
 * workflows and configuration only through ports.
 *
 * The generation is real and deterministic (SDK); this layer holds no generation logic of its own,
 * no database and no direct infrastructure access. It computes signal values only — it never sizes,
 * allocates or executes.
 */
import {
  SIGNAL_CATALOG,
  type FeatureKey,
  type SignalDescriptor,
  type SignalKey,
} from '@platform/signal-calculation-sdk';
import { runBenchmark, type BenchmarkOptions } from '../domain/benchmark';
import { buildGraph, featureDependenciesOf } from '../domain/dependency-graph';
import { executableSignals, getExecutor } from '../domain/executors';
import { resolveParams, SignalExecutionPipeline } from '../domain/pipeline';
import type {
  BenchmarkResult,
  DependencyNode,
  ExecutionRecord,
  SignalComparison,
  SignalParams,
  SignalRequest,
  SignalResult,
} from '../domain/models';
import type {
  ConfigurationPort,
  MarketDataPort,
  SignalCache,
  SignalResultStore,
  SignalStorePort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface SignalCalculationServiceDeps {
  readonly marketData: MarketDataPort;
  readonly signalStore: SignalStorePort;
  readonly cache: SignalCache;
  readonly resultStore: SignalResultStore;
  readonly workflow: WorkflowPort;
  readonly config: ConfigurationPort;
  readonly timer: () => number;
  readonly clock: () => string;
  readonly nextId: () => string;
}

export interface SignalPerformanceRow {
  readonly signalKey: SignalKey;
  readonly runs: number;
  readonly cachedRuns: number;
  readonly meanDurationMs: number;
  readonly maxDurationMs: number;
  readonly meanBarsPerSecond: number;
}

export class SignalCalculationService {
  private readonly pipeline: SignalExecutionPipeline;
  private readonly history: ExecutionRecord[] = [];

  constructor(private readonly deps: SignalCalculationServiceDeps) {
    this.pipeline = new SignalExecutionPipeline({
      getSeries: (ref) => deps.marketData.getSeries(ref),
      cache: deps.cache,
      resultStore: deps.resultStore,
      timer: deps.timer,
      clock: deps.clock,
      nextId: deps.nextId,
    });
  }

  /** The catalog of signal generators (descriptors). */
  listSignals(): readonly SignalDescriptor[] {
    return SIGNAL_CATALOG;
  }

  /** The datasets available to compute against. */
  listDatasets(): Promise<
    readonly { readonly ref: string; readonly label: string; readonly bars: number }[]
  > {
    return this.deps.marketData.listDatasets();
  }

  /** The signal dependency graph (for the requested keys, or the full catalog). */
  dependencyGraph(keys?: readonly SignalKey[]): DependencyNode[] {
    return buildGraph(keys ?? executableSignals());
  }

  /** The feature calculations a signal consumes (cross-engine lineage → Feature Store). */
  featureDependencies(signalKey: SignalKey): readonly FeatureKey[] {
    return featureDependenciesOf(signalKey);
  }

  /** Execute a single signal generation and record it. */
  async executeSignal(
    request: SignalRequest,
  ): Promise<{ record: ExecutionRecord; result?: SignalResult }> {
    const outcome = await this.pipeline.executeOne(request);
    this.history.unshift(outcome.record);
    if (outcome.result && !outcome.record.cached) {
      await this.deps.signalStore.register(outcome.result.metadata);
      await this.deps.workflow.scheduleComputation(request.signalKey, request.datasetRef);
    }
    return outcome;
  }

  /** Execute a batch of signal generations in dependency order and record them. */
  async executeBatch(requests: readonly SignalRequest[]): Promise<readonly ExecutionRecord[]> {
    const outcome = await this.pipeline.run(requests);
    for (const record of outcome.records) this.history.unshift(record);
    for (const result of outcome.results) await this.deps.signalStore.register(result.metadata);
    return outcome.records;
  }

  /** The full execution history (newest first) — powers the execution timeline. */
  getExecutionHistory(): readonly ExecutionRecord[] {
    return this.history;
  }

  /** The most recent execution records (execution status view). */
  getExecutionStatus(limit = 10): readonly ExecutionRecord[] {
    return this.history.slice(0, limit);
  }

  /** Retrieve a stored result by manifest hash. */
  getResult(manifestHash: string): SignalResult | undefined {
    return this.deps.resultStore.getByManifest(manifestHash);
  }

  /** Compare two signals over a dataset: agreement, correlation and joint direction counts. */
  async compareSignals(
    datasetRef: string,
    signalA: SignalKey,
    signalB: SignalKey,
    paramsA?: SignalParams,
    paramsB?: SignalParams,
  ): Promise<SignalComparison> {
    const series = await this.deps.marketData.getSeries(datasetRef);
    const a = getExecutor(signalA)(series, resolveParams(signalA, paramsA));
    const b = getExecutor(signalB)(series, resolveParams(signalB, paramsB));
    const primaryA = a.outputs[a.primaryKey]!;
    const primaryB = b.outputs[b.primaryKey]!;

    let compared = 0;
    let agree = 0;
    let bothLong = 0;
    let bothShort = 0;
    let opposite = 0;
    let sumA = 0;
    let sumB = 0;
    let sumAA = 0;
    let sumBB = 0;
    let sumAB = 0;
    for (let i = 0; i < series.length; i += 1) {
      const va = primaryA[i]!;
      const vb = primaryB[i]!;
      if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
      compared += 1;
      if (va === vb) agree += 1;
      if (va > 0 && vb > 0) bothLong += 1;
      if (va < 0 && vb < 0) bothShort += 1;
      if (va * vb < 0) opposite += 1;
      sumA += va;
      sumB += vb;
      sumAA += va * va;
      sumBB += vb * vb;
      sumAB += va * vb;
    }

    let correlation = 0;
    if (compared > 0) {
      const cov = sumAB - (sumA * sumB) / compared;
      const varA = sumAA - (sumA * sumA) / compared;
      const varB = sumBB - (sumB * sumB) / compared;
      const denom = Math.sqrt(varA * varB);
      correlation = denom > 0 ? cov / denom : 0;
    }

    return {
      signalA,
      signalB,
      datasetRef,
      comparedBars: compared,
      agreementRatio: compared > 0 ? agree / compared : 0,
      correlation,
      bothLong,
      bothShort,
      opposite,
    };
  }

  /** Benchmark one signal over a dataset. */
  async benchmarkSignal(
    signalKey: SignalKey,
    datasetRef: string,
    params?: SignalParams,
    options?: BenchmarkOptions,
  ): Promise<BenchmarkResult> {
    const series = await this.deps.marketData.getSeries(datasetRef);
    return runBenchmark(signalKey, series, params, options);
  }

  /** Benchmark a suite of signals over a dataset. */
  async benchmarkSuite(
    datasetRef: string,
    keys?: readonly SignalKey[],
    options?: BenchmarkOptions,
  ): Promise<readonly BenchmarkResult[]> {
    const series = await this.deps.marketData.getSeries(datasetRef);
    const signals = keys ?? executableSignals();
    return signals.map((signalKey) => runBenchmark(signalKey, series, undefined, options));
  }

  /** Aggregate performance metrics per signal from the execution history. */
  getPerformanceMetrics(): SignalPerformanceRow[] {
    const bySignal = new Map<SignalKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = bySignal.get(record.signalKey) ?? [];
      list.push(record);
      bySignal.set(record.signalKey, list);
    }
    const rows: SignalPerformanceRow[] = [];
    for (const [signalKey, records] of bySignal) {
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
        signalKey,
        runs: records.length,
        cachedRuns: records.filter((record) => record.cached).length,
        meanDurationMs,
        maxDurationMs,
        meanBarsPerSecond: meanDurationMs > 0 ? (meanBars * 1000) / meanDurationMs : 0,
      });
    }
    return rows.sort((a, b) => a.signalKey.localeCompare(b.signalKey));
  }
}
