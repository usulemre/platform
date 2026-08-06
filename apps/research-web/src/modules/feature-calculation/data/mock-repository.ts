/**
 * The Feature Calculation repository adapter for the UI. It runs the **REAL** SDK calculations
 * over deterministic synthetic datasets — no calculation is mocked — and performs the same
 * determinism and point-in-time causality validation as the engine, plus timing and history. It
 * depends only on `@platform/feature-calculation-sdk` (never the service tier).
 */
import {
  FEATURE_CATALOG,
  finiteCount as sdkFiniteCount,
  warmupLength,
  type FeatureDescriptor,
  type FeatureKey,
  type OhlcvSeries,
} from '@platform/feature-calculation-sdk';
import { DATASETS, getSeries } from './synthetic';
import { FEATURE_DEPENDENCIES, resolveParams, runFeature } from './runner';
import type {
  BenchmarkRow,
  CalculationRequest,
  CalculationRunResult,
  DependencyNode,
  ExecutionRecord,
  FeatureCalculationRepository,
  PerformanceRow,
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

function prefix(series: OhlcvSeries, end: number): OhlcvSeries {
  return {
    time: series.time.subarray(0, end),
    open: series.open.subarray(0, end),
    high: series.high.subarray(0, end),
    low: series.low.subarray(0, end),
    close: series.close.subarray(0, end),
    volume: series.volume.subarray(0, end),
    length: end,
  };
}

let executionCounter = 0;

export class MockFeatureCalculationRepository implements FeatureCalculationRepository {
  private readonly history: ExecutionRecord[] = [];

  async listCalculations(): Promise<readonly FeatureDescriptor[]> {
    return FEATURE_CATALOG;
  }

  async listDatasets(): Promise<readonly { ref: string; label: string; bars: number }[]> {
    return DATASETS.map((dataset) => ({
      ref: dataset.ref,
      label: dataset.label,
      bars: dataset.bars,
    }));
  }

  async runCalculation(request: CalculationRequest): Promise<CalculationRunResult> {
    const params = resolveParams(request.featureKey, request.params);
    const series = getSeries(request.datasetRef);

    const t0 = now();
    const primary = runFeature(request.featureKey, series, params);
    const durationMs = now() - t0;

    const finite = sdkFiniteCount(primary);
    const warmup = warmupLength(primary);

    // Determinism: recompute and compare content digests.
    const rerun = runFeature(request.featureKey, series, params);
    const deterministic = hashFloat64(rerun) === hashFloat64(primary);

    // Point-in-time causality: a prefix computation must equal the full computation's prefix.
    const end = Math.max(1, Math.floor(series.length * 0.6));
    let causal = true;
    if (end < series.length) {
      const prefixOut = runFeature(request.featureKey, prefix(series, end), params);
      for (let i = 0; i < end; i += 1) {
        const a = prefixOut[i]!;
        const b = primary[i]!;
        if (Number.isNaN(a) && Number.isNaN(b)) continue;
        if (a !== b) {
          causal = false;
          break;
        }
      }
    }

    const checks: RunCheck[] = [
      {
        id: 'length',
        label: 'Output length matches dataset',
        passed: primary.length === series.length,
        detail: `${primary.length} vs ${series.length}`,
      },
      {
        id: 'finite',
        label: 'Produces finite values',
        passed: finite > 0,
        detail: `${finite} finite of ${primary.length}`,
      },
      {
        id: 'determinism',
        label: 'Deterministic on recompute',
        passed: deterministic,
        detail: deterministic ? 'byte-identical' : 'mismatch',
      },
      {
        id: 'causality',
        label: 'Point-in-time (no look-ahead)',
        passed: causal,
        detail: causal ? `prefix[0..${end}) matches full` : 'future value affected a past output',
      },
    ];
    const validationPassed = checks.every((check) => check.passed);
    const manifestHash = hashFloat64(primary);
    const descriptor = FEATURE_CATALOG.find((entry) => entry.key === request.featureKey);

    // Preview: the last 15 finite points.
    const preview: { index: number; time: number; value: number }[] = [];
    for (let i = series.length - 1; i >= 0 && preview.length < 15; i -= 1) {
      if (Number.isFinite(primary[i]!))
        preview.unshift({ index: i, time: series.time[i]!, value: primary[i]! });
    }

    this.history.unshift({
      id: `exec-${(executionCounter += 1)}`,
      featureKey: request.featureKey,
      datasetRef: request.datasetRef,
      status: 'COMPLETED',
      durationMs,
      finiteRatio: series.length > 0 ? finite / series.length : 0,
      cached: false,
      validationPassed,
      at: new Date().toISOString(),
    });
    if (this.history.length > 100) this.history.length = 100;

    return {
      featureKey: request.featureKey,
      params,
      datasetRef: request.datasetRef,
      length: primary.length,
      warmup,
      finiteCount: finite,
      finiteRatio: series.length > 0 ? finite / series.length : 0,
      durationMs,
      manifestHash,
      validationPassed,
      checks,
      outputKeys: descriptor?.outputs ?? [request.featureKey],
      preview,
      dependsOn: (FEATURE_DEPENDENCIES[request.featureKey] ?? []) as FeatureKey[],
    };
  }

  async getExecutionHistory(): Promise<readonly ExecutionRecord[]> {
    return this.history;
  }

  async runBenchmarkSuite(datasetRef: string): Promise<readonly BenchmarkRow[]> {
    const series = getSeries(datasetRef);
    const iterations = 20;
    const warmup = 3;
    return FEATURE_CATALOG.map((descriptor) => {
      const params = resolveParams(descriptor.key);
      for (let i = 0; i < warmup; i += 1) runFeature(descriptor.key, series, params);
      const start = now();
      for (let i = 0; i < iterations; i += 1) runFeature(descriptor.key, series, params);
      const totalMs = now() - start;
      const meanMs = totalMs / iterations;
      return {
        featureKey: descriptor.key,
        bars: series.length,
        meanMs,
        opsPerSecond: meanMs > 0 ? 1000 / meanMs : Number.POSITIVE_INFINITY,
        barsPerSecond: meanMs > 0 ? (series.length * 1000) / meanMs : Number.POSITIVE_INFINITY,
      };
    });
  }

  async getPerformanceMetrics(): Promise<readonly PerformanceRow[]> {
    const byFeature = new Map<FeatureKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = byFeature.get(record.featureKey) ?? [];
      list.push(record);
      byFeature.set(record.featureKey, list);
    }
    const rows: PerformanceRow[] = [];
    for (const [featureKey, records] of byFeature) {
      const durations = records.map((record) => record.durationMs);
      const meanDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      const dataset = DATASETS.find((entry) => entry.ref === records[0]!.datasetRef);
      const bars = dataset?.bars ?? 0;
      rows.push({
        featureKey,
        runs: records.length,
        cachedRuns: records.filter((record) => record.cached).length,
        meanDurationMs,
        barsPerSecond: meanDurationMs > 0 ? (bars * 1000) / meanDurationMs : 0,
      });
    }
    return rows.sort((a, b) => a.featureKey.localeCompare(b.featureKey));
  }

  async dependencyGraph(): Promise<readonly DependencyNode[]> {
    const levelCache = new Map<FeatureKey, number>();
    const levelOf = (key: FeatureKey): number => {
      const cached = levelCache.get(key);
      if (cached !== undefined) return cached;
      const deps = FEATURE_DEPENDENCIES[key] ?? [];
      const level = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(levelOf));
      levelCache.set(key, level);
      return level;
    };
    return FEATURE_CATALOG.map((descriptor) => ({
      featureKey: descriptor.key,
      level: levelOf(descriptor.key),
      dependsOn: (FEATURE_DEPENDENCIES[descriptor.key] ?? []) as FeatureKey[],
    }));
  }
}
