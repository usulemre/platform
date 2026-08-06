/**
 * The feature execution pipeline. Executes a set of feature requests over their datasets in
 * dependency order (via the scheduler), memoizing through the cache, generating reproducibility
 * metadata, running the validation pipeline and recording every execution. This is the engine's
 * orchestration of the REAL calculations — the calculation itself lives in the SDK executors.
 *
 * Deterministic given injected `clock`/`id` (no ambient time or randomness). Pure with respect to
 * its inputs except for writes to the injected cache/result store.
 */
import {
  describeFeature,
  type FeatureKey,
  type OhlcvSeries,
} from '@platform/feature-calculation-sdk';
import { scheduleLevels } from './dependency-graph';
import { getExecutor } from './executors';
import { cacheKey } from './hashing';
import { generateMetadata } from './metadata';
import { validateResult } from './validation';
import type { ExecutionRecord, FeatureParams, FeatureRequest, FeatureResult } from './models';
import type { FeatureCache, FeatureResultStore } from '../infrastructure/ports';

export interface PipelineDeps {
  readonly getSeries: (datasetRef: string) => Promise<OhlcvSeries>;
  readonly cache: FeatureCache;
  readonly resultStore: FeatureResultStore;
  /** Injected monotonic timer (ms) for durations. */
  readonly timer: () => number;
  /** Injected ISO clock for record timestamps. */
  readonly clock: () => string;
  /** Injected id generator for execution records. */
  readonly nextId: () => string;
}

export interface PipelineOutcome {
  readonly records: readonly ExecutionRecord[];
  readonly results: readonly FeatureResult[];
}

/** Resolve the effective parameters for a feature (catalog defaults merged with the request). */
export function resolveParams(featureKey: FeatureKey, params?: FeatureParams): FeatureParams {
  const descriptor = describeFeature(featureKey);
  const resolved: Record<string, number> = {};
  for (const definition of descriptor?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** Order requests so dependencies (that are also requested) run first, preserving request pairing. */
function scheduleRequests(requests: readonly FeatureRequest[]): FeatureRequest[] {
  const order = scheduleLevels(requests.map((request) => request.featureKey)).flat();
  const rank = new Map<FeatureKey, number>();
  order.forEach((key, index) => rank.set(key, index));
  return [...requests].sort(
    (a, b) => (rank.get(a.featureKey) ?? 0) - (rank.get(b.featureKey) ?? 0),
  );
}

export class FeatureExecutionPipeline {
  constructor(private readonly deps: PipelineDeps) {}

  /** Execute a single feature request, returning its record and (on success) result. */
  async executeOne(
    request: FeatureRequest,
  ): Promise<{ record: ExecutionRecord; result?: FeatureResult }> {
    const params = resolveParams(request.featureKey, request.params);
    const key = cacheKey(request.featureKey, params, request.datasetRef);
    const startedAt = this.deps.clock();
    const id = this.deps.nextId();

    if (this.deps.cache.has(key)) {
      const cached = this.deps.cache.get(key)!;
      const record: ExecutionRecord = {
        id,
        featureKey: request.featureKey,
        params,
        datasetRef: request.datasetRef,
        status: 'COMPLETED',
        durationMs: 0,
        length: cached.metadata.length,
        warmup: cached.metadata.warmup,
        finiteRatio: cached.metadata.finiteRatio,
        cached: true,
        validationPassed: cached.validation.passed,
        manifestHash: cached.metadata.manifestHash,
        startedAt,
        endedAt: this.deps.clock(),
      };
      return { record, result: cached };
    }

    try {
      const series = await this.deps.getSeries(request.datasetRef);
      const executor = getExecutor(request.featureKey);
      const t0 = this.deps.timer();
      const output = executor(series, params);
      const durationMs = this.deps.timer() - t0;
      const metadata = generateMetadata(
        request.featureKey,
        params,
        request.datasetRef,
        series,
        output,
      );
      const validation = validateResult(request.featureKey, params, series, output);
      const result: FeatureResult = { metadata, validation, output };
      this.deps.cache.set(key, result);
      this.deps.resultStore.save(result);
      const record: ExecutionRecord = {
        id,
        featureKey: request.featureKey,
        params,
        datasetRef: request.datasetRef,
        status: 'COMPLETED',
        durationMs,
        length: metadata.length,
        warmup: metadata.warmup,
        finiteRatio: metadata.finiteRatio,
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
        featureKey: request.featureKey,
        params,
        datasetRef: request.datasetRef,
        status: 'FAILED',
        durationMs: 0,
        length: 0,
        warmup: 0,
        finiteRatio: 0,
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
  async run(requests: readonly FeatureRequest[]): Promise<PipelineOutcome> {
    const ordered = scheduleRequests(requests);
    const records: ExecutionRecord[] = [];
    const results: FeatureResult[] = [];
    for (const request of ordered) {
      const { record, result } = await this.executeOne(request);
      records.push(record);
      if (result) results.push(result);
    }
    return { records, results };
  }
}
