/**
 * The feature benchmark runner — measures the real throughput of a feature calculation over a
 * dataset. Uses a high-resolution monotonic timer, a warm-up pass to prime JIT, and a fixed
 * iteration count. Reports mean latency, ops/second and bars/second. Deterministic in *what* it
 * computes (the calculation is deterministic); timing naturally varies run to run.
 */
import { performance } from 'node:perf_hooks';
import { type FeatureKey, type OhlcvSeries } from '@platform/feature-calculation-sdk';
import { getExecutor } from './executors';
import { resolveParams } from './pipeline';
import type { BenchmarkResult, FeatureParams } from './models';

export interface BenchmarkOptions {
  readonly iterations?: number;
  readonly warmup?: number;
}

/** Benchmark one feature over a series. */
export function runBenchmark(
  featureKey: FeatureKey,
  series: OhlcvSeries,
  params?: FeatureParams,
  options: BenchmarkOptions = {},
): BenchmarkResult {
  const iterations = Math.max(1, options.iterations ?? 50);
  const warmup = Math.max(0, options.warmup ?? 5);
  const effective = resolveParams(featureKey, params);
  const executor = getExecutor(featureKey);

  for (let i = 0; i < warmup; i += 1) executor(series, effective);

  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) executor(series, effective);
  const totalMs = performance.now() - start;

  const meanMs = totalMs / iterations;
  return {
    featureKey,
    params: effective,
    bars: series.length,
    iterations,
    totalMs,
    meanMs,
    opsPerSecond: meanMs > 0 ? 1000 / meanMs : Number.POSITIVE_INFINITY,
    barsPerSecond: meanMs > 0 ? (series.length * 1000) / meanMs : Number.POSITIVE_INFINITY,
  };
}
