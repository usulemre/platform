/**
 * The optimization execution pipeline. Executes a set of optimization requests over their universes
 * in dependency order (via the scheduler), memoizing through the cache, estimating the input,
 * running the optimizer, computing metrics, generating reproducibility metadata, running the
 * validation pipeline and recording every execution. This is the engine's orchestration of the REAL
 * optimizers — the optimization itself lives in the SDK executors.
 *
 * Deterministic given injected `clock`/`id` (no ambient time or randomness). Pure with respect to
 * its inputs except for writes to the injected cache/result store.
 */
import {
  describeOptimizer,
  portfolioMetrics,
  resolveConstraints,
  type ConstraintConfig,
  type OptimizerKey,
} from '@platform/portfolio-optimization-sdk';
import { buildInput, type Universe } from './input';
import { scheduleLevels } from './dependency-graph';
import { getExecutor } from './executors';
import { cacheKey } from './hashing';
import { generateMetadata } from './metadata';
import { validateResult } from './validation';
import type {
  Allocation,
  ExecutionRecord,
  OptimizationRequest,
  OptimizationResultRecord,
  OptimizerParams,
} from './models';
import type { OptimizationCache, OptimizationResultStore } from '../infrastructure/ports';

export interface PipelineDeps {
  readonly getUniverse: (universeRef: string) => Promise<Universe>;
  readonly cache: OptimizationCache;
  readonly resultStore: OptimizationResultStore;
  /** Injected monotonic timer (ms) for durations. */
  readonly timer: () => number;
  /** Injected ISO clock for record timestamps. */
  readonly clock: () => string;
  /** Injected id generator for execution records. */
  readonly nextId: () => string;
}

export interface PipelineOutcome {
  readonly records: readonly ExecutionRecord[];
  readonly results: readonly OptimizationResultRecord[];
}

/** Resolve the effective parameters for an optimizer (catalog defaults merged with the request). */
export function resolveParams(
  optimizerKey: OptimizerKey,
  params?: OptimizerParams,
): OptimizerParams {
  const resolved: Record<string, number> = {};
  for (const definition of describeOptimizer(optimizerKey)?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** A stable fingerprint of a constraint configuration (for the cache key). */
export function fingerprintConstraints(config: ConstraintConfig): string {
  return [
    config.longOnly ? 'L' : 'LS',
    config.minWeight,
    config.maxWeight,
    config.maxAssetExposure,
    config.maxLeverage,
    config.cashReserve,
    config.maxTurnover,
    config.maxSectorExposure,
  ].join('|');
}

function buildAllocations(
  assets: readonly string[],
  weights: Float64Array,
  metrics: ReturnType<typeof portfolioMetrics>,
  sectors?: readonly string[],
): Allocation[] {
  const out: Allocation[] = [];
  for (let i = 0; i < assets.length; i += 1) {
    out.push({
      asset: assets[i]!,
      weight: weights[i]!,
      riskContribution: metrics.riskContributions[i]?.contribution ?? 0,
      sector: sectors?.[i],
    });
  }
  return out;
}

/** Order requests so dependencies (that are also requested) run first, preserving request pairing. */
function scheduleRequests(requests: readonly OptimizationRequest[]): OptimizationRequest[] {
  const order = scheduleLevels(requests.map((request) => request.optimizerKey)).flat();
  const rank = new Map<OptimizerKey, number>();
  order.forEach((key, index) => rank.set(key, index));
  return [...requests].sort(
    (a, b) => (rank.get(a.optimizerKey) ?? 0) - (rank.get(b.optimizerKey) ?? 0),
  );
}

export class OptimizationExecutionPipeline {
  constructor(private readonly deps: PipelineDeps) {}

  /** Execute a single optimization request, returning its record and (on success) result. */
  async executeOne(
    request: OptimizationRequest,
  ): Promise<{ record: ExecutionRecord; result?: OptimizationResultRecord }> {
    const config = resolveConstraints(request.constraints);
    const params = resolveParams(request.optimizerKey, request.params);
    const key = cacheKey(
      request.optimizerKey,
      params,
      request.universeRef,
      fingerprintConstraints(config),
    );
    const startedAt = this.deps.clock();
    const id = this.deps.nextId();

    if (this.deps.cache.has(key)) {
      const cached = this.deps.cache.get(key)!;
      const record: ExecutionRecord = {
        id,
        optimizerKey: request.optimizerKey,
        params,
        universeRef: request.universeRef,
        status: 'COMPLETED',
        durationMs: 0,
        assetCount: cached.metadata.assetCount,
        expectedReturn: cached.metrics.expectedReturn,
        volatility: cached.metrics.volatility,
        sharpe: cached.metrics.sharpe,
        iterations: cached.metadata.iterations,
        converged: cached.metadata.converged,
        cached: true,
        validationPassed: cached.validation.passed,
        manifestHash: cached.metadata.manifestHash,
        startedAt,
        endedAt: this.deps.clock(),
      };
      return { record, result: cached };
    }

    try {
      const universe = await this.deps.getUniverse(request.universeRef);
      const input = buildInput(universe);
      const executor = getExecutor(request.optimizerKey);
      const t0 = this.deps.timer();
      const solution = executor(input, config, params);
      const durationMs = this.deps.timer() - t0;
      const metrics = portfolioMetrics(solution.weights, input);
      const metadata = generateMetadata(
        request.optimizerKey,
        params,
        request.universeRef,
        input,
        solution,
      );
      const validation = validateResult(request.optimizerKey, params, input, config, solution);
      const result: OptimizationResultRecord = {
        metadata,
        validation,
        allocations: buildAllocations(input.assets, solution.weights, metrics, input.sectors),
        cashWeight: solution.cashWeight,
        metrics,
        constraints: config,
      };
      this.deps.cache.set(key, result);
      this.deps.resultStore.save(result);
      const record: ExecutionRecord = {
        id,
        optimizerKey: request.optimizerKey,
        params,
        universeRef: request.universeRef,
        status: 'COMPLETED',
        durationMs,
        assetCount: input.n,
        expectedReturn: metrics.expectedReturn,
        volatility: metrics.volatility,
        sharpe: metrics.sharpe,
        iterations: solution.iterations,
        converged: solution.converged,
        cached: false,
        validationPassed: validation.passed,
        manifestHash: metadata.manifestHash,
        startedAt,
        endedAt: this.deps.clock(),
      };
      return { record, result };
    } catch (error) {
      const record: ExecutionRecord = {
        id,
        optimizerKey: request.optimizerKey,
        params,
        universeRef: request.universeRef,
        status: 'FAILED',
        durationMs: 0,
        assetCount: 0,
        expectedReturn: 0,
        volatility: 0,
        sharpe: 0,
        iterations: 0,
        converged: false,
        cached: false,
        validationPassed: false,
        error: error instanceof Error ? error.message : String(error),
        startedAt,
        endedAt: this.deps.clock(),
      };
      return { record };
    }
  }

  /** Execute a batch of requests in dependency order. */
  async run(requests: readonly OptimizationRequest[]): Promise<PipelineOutcome> {
    const ordered = scheduleRequests(requests);
    const records: ExecutionRecord[] = [];
    const results: OptimizationResultRecord[] = [];
    for (const request of ordered) {
      const { record, result } = await this.executeOne(request);
      records.push(record);
      if (result) results.push(result);
    }
    return { records, results };
  }
}
