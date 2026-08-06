/**
 * The Signal Calculation repository adapter for the UI. It runs the **REAL** SDK generators over
 * deterministic synthetic datasets — no signal is mocked — and performs the same value-range,
 * determinism and point-in-time causality validation as the engine, plus timing, comparison,
 * per-bar debugging and history. It depends only on `@platform/signal-calculation-sdk` (and the
 * feature SDK it re-exports); never the service tier.
 */
import {
  SIGNAL_CATALOG,
  finiteCount as sdkFiniteCount,
  isValidSignalValue,
  signalDistribution,
  warmupLength,
  type OhlcvSeries,
  type SignalDescriptor,
  type SignalKey,
} from '@platform/signal-calculation-sdk';
import { DATASETS, getSeries } from './synthetic';
import {
  featuresOf,
  resolveParams,
  runSignal,
  signalComponents,
  SIGNAL_DEPENDENCIES,
} from './runner';
import type {
  BenchmarkRow,
  ComparisonResult,
  DebugResult,
  DebugRow,
  DependencyNode,
  ExecutionRecord,
  PerformanceRow,
  RunCheck,
  SignalCalculationRepository,
  SignalRunRequest,
  SignalRunResult,
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

export class MockSignalCalculationRepository implements SignalCalculationRepository {
  private readonly history: ExecutionRecord[] = [];

  async listSignals(): Promise<readonly SignalDescriptor[]> {
    return SIGNAL_CATALOG;
  }

  async listDatasets(): Promise<readonly { ref: string; label: string; bars: number }[]> {
    return DATASETS.map((dataset) => ({
      ref: dataset.ref,
      label: dataset.label,
      bars: dataset.bars,
    }));
  }

  async runSignal(request: SignalRunRequest): Promise<SignalRunResult> {
    const params = resolveParams(request.signalKey, request.params);
    const series = getSeries(request.datasetRef);
    const descriptor = SIGNAL_CATALOG.find((entry) => entry.key === request.signalKey);
    const valueKind = descriptor?.valueKind ?? 'direction';

    const t0 = now();
    const primary = runSignal(request.signalKey, series, params);
    const durationMs = now() - t0;

    const finite = sdkFiniteCount(primary);
    const warmup = warmupLength(primary);
    const distribution = signalDistribution(primary);

    // Determinism: recompute and compare content digests.
    const rerun = runSignal(request.signalKey, series, params);
    const deterministic = hashFloat64(rerun) === hashFloat64(primary);

    // Value range: every finite value valid for the declared value kind.
    let invalid = 0;
    for (let i = 0; i < primary.length; i += 1) {
      const v = primary[i]!;
      if (Number.isFinite(v) && !isValidSignalValue(v, valueKind)) invalid += 1;
    }

    // Point-in-time causality: a prefix computation must equal the full computation's prefix.
    const end = Math.max(1, Math.floor(series.length * 0.6));
    let causal = true;
    if (end < series.length) {
      const prefixOut = runSignal(request.signalKey, prefix(series, end), params);
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
        id: 'range',
        label: `Valid ${valueKind} values`,
        passed: invalid === 0,
        detail:
          invalid === 0
            ? `all values are valid ${valueKind} values`
            : `${invalid} out-of-range values`,
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
    const activeRatio = distribution.finite > 0 ? distribution.active / distribution.finite : 0;

    // Preview: the last 15 finite points.
    const preview: { index: number; time: number; value: number }[] = [];
    for (let i = series.length - 1; i >= 0 && preview.length < 15; i -= 1) {
      if (Number.isFinite(primary[i]!))
        preview.unshift({ index: i, time: series.time[i]!, value: primary[i]! });
    }

    this.history.unshift({
      id: `sig-exec-${(executionCounter += 1)}`,
      signalKey: request.signalKey,
      datasetRef: request.datasetRef,
      status: 'COMPLETED',
      durationMs,
      activeRatio,
      cached: false,
      validationPassed,
      at: new Date().toISOString(),
    });
    if (this.history.length > 100) this.history.length = 100;

    return {
      signalKey: request.signalKey,
      params,
      datasetRef: request.datasetRef,
      valueKind,
      length: primary.length,
      warmup,
      finiteCount: finite,
      finiteRatio: series.length > 0 ? finite / series.length : 0,
      long: distribution.long,
      short: distribution.short,
      flat: distribution.flat,
      activeRatio,
      durationMs,
      manifestHash: hashFloat64(primary),
      validationPassed,
      checks,
      outputKeys: descriptor?.outputs ?? ['signal'],
      preview,
      dependsOn: (SIGNAL_DEPENDENCIES[request.signalKey] ?? []) as SignalKey[],
      features: featuresOf(request.signalKey),
    };
  }

  async debugSignal(request: SignalRunRequest, rows = 20): Promise<DebugResult> {
    const params = resolveParams(request.signalKey, request.params);
    const series = getSeries(request.datasetRef);
    const primary = runSignal(request.signalKey, series, params);
    const components = signalComponents(request.signalKey, series, params);
    const componentNames = Object.keys(components);

    const out: DebugRow[] = [];
    for (let i = series.length - 1; i >= 0 && out.length < rows; i -= 1) {
      if (!Number.isFinite(primary[i]!)) continue;
      out.unshift({
        index: i,
        time: series.time[i]!,
        components: componentNames.map((name) => ({ name, value: components[name]![i]! })),
        signal: primary[i]!,
      });
    }
    return {
      signalKey: request.signalKey,
      datasetRef: request.datasetRef,
      componentNames,
      rows: out,
    };
  }

  async compareSignals(
    datasetRef: string,
    signalA: SignalKey,
    signalB: SignalKey,
  ): Promise<ComparisonResult> {
    const series = getSeries(datasetRef);
    const a = runSignal(signalA, series, resolveParams(signalA));
    const b = runSignal(signalB, series, resolveParams(signalB));
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
      const va = a[i]!;
      const vb = b[i]!;
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

  async getExecutionHistory(): Promise<readonly ExecutionRecord[]> {
    return this.history;
  }

  async runBenchmarkSuite(datasetRef: string): Promise<readonly BenchmarkRow[]> {
    const series = getSeries(datasetRef);
    const iterations = 20;
    const warmup = 3;
    return SIGNAL_CATALOG.map((descriptor) => {
      const params = resolveParams(descriptor.key);
      for (let i = 0; i < warmup; i += 1) runSignal(descriptor.key, series, params);
      const start = now();
      for (let i = 0; i < iterations; i += 1) runSignal(descriptor.key, series, params);
      const totalMs = now() - start;
      const meanMs = totalMs / iterations;
      return {
        signalKey: descriptor.key,
        bars: series.length,
        meanMs,
        opsPerSecond: meanMs > 0 ? 1000 / meanMs : Number.POSITIVE_INFINITY,
        barsPerSecond: meanMs > 0 ? (series.length * 1000) / meanMs : Number.POSITIVE_INFINITY,
      };
    });
  }

  async getPerformanceMetrics(): Promise<readonly PerformanceRow[]> {
    const bySignal = new Map<SignalKey, ExecutionRecord[]>();
    for (const record of this.history) {
      if (record.status !== 'COMPLETED') continue;
      const list = bySignal.get(record.signalKey) ?? [];
      list.push(record);
      bySignal.set(record.signalKey, list);
    }
    const rows: PerformanceRow[] = [];
    for (const [signalKey, records] of bySignal) {
      const durations = records.map((record) => record.durationMs);
      const meanDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      const dataset = DATASETS.find((entry) => entry.ref === records[0]!.datasetRef);
      const bars = dataset?.bars ?? 0;
      rows.push({
        signalKey,
        runs: records.length,
        cachedRuns: records.filter((record) => record.cached).length,
        meanDurationMs,
        barsPerSecond: meanDurationMs > 0 ? (bars * 1000) / meanDurationMs : 0,
      });
    }
    return rows.sort((a, b) => a.signalKey.localeCompare(b.signalKey));
  }

  async dependencyGraph(): Promise<readonly DependencyNode[]> {
    const levelCache = new Map<SignalKey, number>();
    const levelOf = (key: SignalKey): number => {
      const cached = levelCache.get(key);
      if (cached !== undefined) return cached;
      const deps = SIGNAL_DEPENDENCIES[key] ?? [];
      const level = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(levelOf));
      levelCache.set(key, level);
      return level;
    };
    return SIGNAL_CATALOG.map((descriptor) => ({
      signalKey: descriptor.key,
      level: levelOf(descriptor.key),
      dependsOn: (SIGNAL_DEPENDENCIES[descriptor.key] ?? []) as SignalKey[],
      features: descriptor.features,
    }));
  }
}
