/**
 * The signal execution pipeline. Executes a set of signal requests over their datasets in
 * dependency order (via the scheduler), memoizing through the cache, generating reproducibility
 * metadata, running the validation pipeline and recording every execution. This is the engine's
 * orchestration of the REAL signal generators — the generation itself lives in the SDK executors.
 *
 * Deterministic given injected `clock`/`id` (no ambient time or randomness). Pure with respect to
 * its inputs except for writes to the injected cache/result store.
 */
import { describeSignal, type OhlcvSeries, type SignalKey } from '@platform/signal-calculation-sdk';
import { scheduleLevels } from './dependency-graph';
import { getExecutor } from './executors';
import { cacheKey } from './hashing';
import { generateMetadata } from './metadata';
import { validateResult } from './validation';
import type { ExecutionRecord, SignalParams, SignalRequest, SignalResult } from './models';
import type { SignalCache, SignalResultStore } from '../infrastructure/ports';

export interface PipelineDeps {
  readonly getSeries: (datasetRef: string) => Promise<OhlcvSeries>;
  readonly cache: SignalCache;
  readonly resultStore: SignalResultStore;
  /** Injected monotonic timer (ms) for durations. */
  readonly timer: () => number;
  /** Injected ISO clock for record timestamps. */
  readonly clock: () => string;
  /** Injected id generator for execution records. */
  readonly nextId: () => string;
}

export interface PipelineOutcome {
  readonly records: readonly ExecutionRecord[];
  readonly results: readonly SignalResult[];
}

/** Resolve the effective parameters for a signal (catalog defaults merged with the request). */
export function resolveParams(signalKey: SignalKey, params?: SignalParams): SignalParams {
  const descriptor = describeSignal(signalKey);
  const resolved: Record<string, number> = {};
  for (const definition of descriptor?.params ?? [])
    resolved[definition.name] = definition.defaultValue;
  if (params) for (const [name, value] of Object.entries(params)) resolved[name] = value;
  return resolved;
}

/** Order requests so dependencies (that are also requested) run first, preserving request pairing. */
function scheduleRequests(requests: readonly SignalRequest[]): SignalRequest[] {
  const order = scheduleLevels(requests.map((request) => request.signalKey)).flat();
  const rank = new Map<SignalKey, number>();
  order.forEach((key, index) => rank.set(key, index));
  return [...requests].sort((a, b) => (rank.get(a.signalKey) ?? 0) - (rank.get(b.signalKey) ?? 0));
}

export class SignalExecutionPipeline {
  constructor(private readonly deps: PipelineDeps) {}

  /** Execute a single signal request, returning its record and (on success) result. */
  async executeOne(
    request: SignalRequest,
  ): Promise<{ record: ExecutionRecord; result?: SignalResult }> {
    const params = resolveParams(request.signalKey, request.params);
    const key = cacheKey(request.signalKey, params, request.datasetRef);
    const startedAt = this.deps.clock();
    const id = this.deps.nextId();

    if (this.deps.cache.has(key)) {
      const cached = this.deps.cache.get(key)!;
      const record: ExecutionRecord = {
        id,
        signalKey: request.signalKey,
        params,
        datasetRef: request.datasetRef,
        status: 'COMPLETED',
        durationMs: 0,
        length: cached.metadata.length,
        warmup: cached.metadata.warmup,
        finiteRatio: cached.metadata.finiteRatio,
        activeRatio: cached.metadata.activeRatio,
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
      const executor = getExecutor(request.signalKey);
      const t0 = this.deps.timer();
      const output = executor(series, params);
      const durationMs = this.deps.timer() - t0;
      const metadata = generateMetadata(
        request.signalKey,
        params,
        request.datasetRef,
        series,
        output,
      );
      const validation = validateResult(request.signalKey, params, series, output);
      const result: SignalResult = { metadata, validation, output };
      this.deps.cache.set(key, result);
      this.deps.resultStore.save(result);
      const record: ExecutionRecord = {
        id,
        signalKey: request.signalKey,
        params,
        datasetRef: request.datasetRef,
        status: 'COMPLETED',
        durationMs,
        length: metadata.length,
        warmup: metadata.warmup,
        finiteRatio: metadata.finiteRatio,
        activeRatio: metadata.activeRatio,
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
        signalKey: request.signalKey,
        params,
        datasetRef: request.datasetRef,
        status: 'FAILED',
        durationMs: 0,
        length: 0,
        warmup: 0,
        finiteRatio: 0,
        activeRatio: 0,
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
  async run(requests: readonly SignalRequest[]): Promise<PipelineOutcome> {
    const ordered = scheduleRequests(requests);
    const records: ExecutionRecord[] = [];
    const results: SignalResult[] = [];
    for (const request of ordered) {
      const { record, result } = await this.executeOne(request);
      records.push(record);
      if (result) results.push(result);
    }
    return { records, results };
  }
}
