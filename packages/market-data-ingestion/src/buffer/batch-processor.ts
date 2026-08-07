/**
 * The **batch processor** — drains the ingestion buffer and writes canonical records to the store in
 * batches, with bounded retry and dead-letter fallback. A transient store failure is retried up to
 * `maxAttempts`; a batch that still fails is quarantined in the dead-letter queue with a
 * `STORE_FAILURE` reason (never dropped). Draining is caller-driven (`drainOnce`/`drainAll`) so the
 * pipeline stays deterministic — there are no ambient timers; a host scheduler can call `drainAll` on
 * a cadence in production.
 */
import type { Clock } from '../clock';
import type { DeadLetterQueue } from '../dead-letter/dead-letter-queue';
import type { NormalizedMarketDataRecord } from '../events/envelope';
import type { IngestionMetrics } from '../metrics/ingestion-metrics';
import type { CanonicalMarketDataStore } from '../store/market-data-store';
import type { IngestionBuffer } from './ingestion-buffer';

export interface BatchProcessorConfig {
  readonly maxBatchSize: number;
  /** Total attempts (1 = no retry) before a batch is dead-lettered. */
  readonly maxAttempts: number;
}

const DEFAULT_CONFIG: BatchProcessorConfig = { maxBatchSize: 500, maxAttempts: 3 };

export interface BatchProcessorDeps {
  readonly buffer: IngestionBuffer<NormalizedMarketDataRecord>;
  readonly store: CanonicalMarketDataStore;
  readonly deadLetter: DeadLetterQueue;
  readonly metrics: IngestionMetrics;
  readonly clock: Clock;
  readonly config?: Partial<BatchProcessorConfig>;
}

export interface BatchOutcome {
  readonly size: number;
  readonly written: boolean;
  readonly attempts: number;
  readonly deadLettered: boolean;
}

export class BatchProcessor {
  private readonly config: BatchProcessorConfig;

  constructor(private readonly deps: BatchProcessorDeps) {
    this.config = { ...DEFAULT_CONFIG, ...deps.config };
  }

  /** Process a single batch from the buffer. Returns `null` when the buffer is empty. */
  async drainOnce(): Promise<BatchOutcome | null> {
    const batch = this.deps.buffer.dequeue(this.config.maxBatchSize);
    this.deps.metrics.setBufferDepth(this.deps.buffer.depth);
    if (batch.length === 0) return null;
    return this.writeWithRetry(batch);
  }

  /** Process batches until the buffer is empty. Returns every batch outcome. */
  async drainAll(): Promise<BatchOutcome[]> {
    const outcomes: BatchOutcome[] = [];
    for (;;) {
      const outcome = await this.drainOnce();
      if (!outcome) break;
      outcomes.push(outcome);
    }
    return outcomes;
  }

  private async writeWithRetry(
    batch: readonly NormalizedMarketDataRecord[],
  ): Promise<BatchOutcome> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
      try {
        const start = this.deps.clock.now();
        await this.deps.store.append(batch);
        const elapsed = this.deps.clock.now() - start;
        // Attribute total end-to-end latency: intake → store, summed across the batch.
        let latencyTotal = elapsed;
        for (const record of batch) {
          latencyTotal += this.deps.clock.now() - record.timestamps.receiveTime;
        }
        this.deps.metrics.onStored(batch.length, latencyTotal);
        return { size: batch.length, written: true, attempts: attempt, deadLettered: false };
      } catch (error) {
        lastError = error;
        this.deps.metrics.onStoreFailure();
      }
    }
    // Exhausted retries — quarantine the batch.
    this.deps.deadLetter.add({
      at: this.deps.clock.now(),
      stage: 'store',
      reason: {
        code: 'STORE_FAILURE',
        message:
          lastError instanceof Error
            ? `Store rejected batch after ${this.config.maxAttempts} attempts: ${lastError.message}`
            : `Store rejected batch after ${this.config.maxAttempts} attempts.`,
        detail: { batchSize: batch.length, attempts: this.config.maxAttempts },
      },
      payload: batch,
    });
    this.deps.metrics.onQuarantined();
    return {
      size: batch.length,
      written: false,
      attempts: this.config.maxAttempts,
      deadLettered: true,
    };
  }
}
