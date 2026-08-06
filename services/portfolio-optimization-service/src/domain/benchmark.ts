/**
 * The optimization benchmark runner — measures the real throughput of an optimizer over a universe.
 * Uses a high-resolution monotonic timer, a warm-up pass to prime the JIT, and a fixed iteration
 * count. Reports mean latency and ops/second. Deterministic in *what* it computes; timing varies.
 */
import { performance } from 'node:perf_hooks';
import {
  describeOptimizer,
  type ConstraintConfig,
  type OptimizationInput,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { getExecutor } from './executors';
import type { BenchmarkResult, OptimizerParams } from './models';

export interface BenchmarkOptions {
  readonly iterations?: number;
  readonly warmup?: number;
}

/** Resolve effective parameters (catalog defaults merged with the request). */
function resolveParams(optimizerKey: OptimizerKey, params?: OptimizerParams): OptimizerParams {
  const resolved: Record<string, number> = {};
  for (const definition of describeOptimizer(optimizerKey)?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** Benchmark one optimizer over an input. */
export function runBenchmark(
  optimizerKey: OptimizerKey,
  input: OptimizationInput,
  config: ConstraintConfig,
  params?: OptimizerParams,
  options: BenchmarkOptions = {},
): BenchmarkResult {
  const iterations = Math.max(1, options.iterations ?? 25);
  const warmup = Math.max(0, options.warmup ?? 3);
  const effective = resolveParams(optimizerKey, params);
  const executor = getExecutor(optimizerKey);

  for (let i = 0; i < warmup; i += 1) executor(input, config, effective);

  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) executor(input, config, effective);
  const totalMs = performance.now() - start;

  const meanMs = totalMs / iterations;
  return {
    optimizerKey,
    params: effective,
    assets: input.n,
    iterations,
    totalMs,
    meanMs,
    opsPerSecond: meanMs > 0 ? 1000 / meanMs : Number.POSITIVE_INFINITY,
  };
}
