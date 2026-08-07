/**
 * The **write path** — `MarketDataWriter` (durable, idempotent bulk writer) and
 * `MarketDataBatchWriter` (a buffered accumulator in front of it).
 *
 * `MarketDataWriter.writeBatch` is the canonical persistence entry point:
 *   validate → derive identity/partition → group by partition → engine.write (with retry) → report.
 * It is idempotent (duplicate identities are skipped/upserted by the engine, never corrupting data),
 * handles **partial batch failure** (a partition whose write keeps failing is quarantined while the
 * others still persist), and reports every outcome. Invalid records are rejected before persistence
 * and quarantined with a reason — corrupt data is never silently stored. Deterministic: latency and
 * `storedAt` come from an injected clock.
 */
import type { Clock, NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import type { StorageDeadLetterQueue } from '../dead-letter';
import type { EngineWriteReport, StorageEngine, StoredEntry } from '../engine/storage-engine';
import { idempotencyPolicy, primaryTimestamp, recordIdentity } from '../identity';
import type { StorageMetrics } from '../metrics/storage-metrics';
import { StoragePartitionManager } from '../partition';
import { StorageValidator } from '../validation/storage-validator';

export interface MarketDataWriterConfig {
  /** Total attempts (1 = no retry) before a partition's write is quarantined. */
  readonly maxAttempts: number;
}

const DEFAULT_CONFIG: MarketDataWriterConfig = { maxAttempts: 3 };

export interface MarketDataWriterDeps {
  readonly engine: StorageEngine;
  readonly metrics: StorageMetrics;
  readonly deadLetter: StorageDeadLetterQueue;
  readonly clock: Clock;
  readonly validator?: StorageValidator;
  readonly partitionManager?: StoragePartitionManager;
  readonly config?: Partial<MarketDataWriterConfig>;
}

export interface WriteResult {
  readonly attempted: number;
  readonly persisted: number;
  readonly duplicates: number;
  readonly upserts: number;
  /** Records rejected by validation (quarantined before persistence). */
  readonly rejected: number;
  /** Records the engine permanently failed to persist (quarantined after retries). */
  readonly failed: number;
}

export class MarketDataWriter {
  private readonly config: MarketDataWriterConfig;
  private readonly validator: StorageValidator;
  private readonly partitions: StoragePartitionManager;

  constructor(private readonly deps: MarketDataWriterDeps) {
    this.config = { ...DEFAULT_CONFIG, ...deps.config };
    this.validator = deps.validator ?? new StorageValidator();
    this.partitions = deps.partitionManager ?? new StoragePartitionManager();
  }

  /** Persist a single record. */
  async write(record: NormalizedMarketDataRecord): Promise<WriteResult> {
    return this.writeBatch([record]);
  }

  /** Validate, partition, and durably persist a batch — idempotently and with partial-failure safety. */
  async writeBatch(records: readonly NormalizedMarketDataRecord[]): Promise<WriteResult> {
    const start = this.deps.clock.now();
    this.deps.metrics.onWriteAttempt(records.length);

    let rejected = 0;
    const byPartition = new Map<string, StoredEntry[]>();
    for (const record of records) {
      const validity = this.validator.validate(record);
      if (!validity.valid) {
        this.deps.deadLetter.add({
          at: this.deps.clock.now(),
          stage: 'validation',
          reason: validity.rejection,
          record,
        });
        this.deps.metrics.onRejected(validity.rejection.code);
        this.deps.metrics.onQuarantined();
        rejected += 1;
        continue;
      }
      const entry: StoredEntry = {
        identity: recordIdentity(record),
        partition: this.partitions.partitionOf(record),
        primaryTime: primaryTimestamp(record.timestamps),
        upsert: idempotencyPolicy(record.kind) === 'upsert',
        record,
        storedAt: this.deps.clock.now(),
      };
      const group = byPartition.get(entry.partition);
      if (group) group.push(entry);
      else byPartition.set(entry.partition, [entry]);
    }

    let persisted = 0;
    let duplicates = 0;
    let upserts = 0;
    let failed = 0;

    for (const [, entries] of byPartition) {
      const report = await this.writePartitionWithRetry(entries);
      if (report) {
        persisted += report.persisted;
        duplicates += report.duplicates;
        upserts += report.upserts;
      } else {
        failed += entries.length;
      }
    }

    this.deps.metrics.onPersisted(persisted, this.deps.clock.now());
    this.deps.metrics.onDuplicates(duplicates);
    this.deps.metrics.onUpserts(upserts);
    this.deps.metrics.onBatch(this.deps.clock.now() - start);

    return { attempted: records.length, persisted, duplicates, upserts, rejected, failed };
  }

  /** Write one partition's entries, retrying transient engine failures. Returns null if it gives up. */
  private async writePartitionWithRetry(
    entries: readonly StoredEntry[],
  ): Promise<EngineWriteReport | null> {
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
      try {
        return await this.deps.engine.write(entries);
      } catch {
        this.deps.metrics.onEngineError();
        if (attempt < this.config.maxAttempts) this.deps.metrics.onRetry();
      }
    }
    // Exhausted retries — quarantine the whole partition group so nothing is lost.
    for (const entry of entries) {
      this.deps.deadLetter.add({
        at: this.deps.clock.now(),
        stage: 'engine',
        reason: {
          code: 'WRITE_FAILED',
          message: `Engine rejected write after ${this.config.maxAttempts} attempts.`,
          detail: { partition: entry.partition, attempts: this.config.maxAttempts },
        },
        record: entry.record,
      });
      this.deps.metrics.onQuarantined();
    }
    return null;
  }
}

export interface MarketDataBatchWriterConfig {
  readonly maxBatchSize: number;
  readonly capacity: number;
  readonly highWatermark: number;
}

const DEFAULT_BATCH_CONFIG: MarketDataBatchWriterConfig = {
  maxBatchSize: 500,
  capacity: 10_000,
  highWatermark: 0.8,
};

/**
 * A buffered accumulator in front of the writer. Callers `add` records; the buffer auto-flushes when
 * it reaches `maxBatchSize`, and `flush` drains the rest. The buffer is bounded and reports
 * backpressure (`isUnderPressure`) so an upstream producer can slow down — the storage side of the
 * pipeline's backpressure contract.
 */
export class MarketDataBatchWriter {
  private readonly config: MarketDataBatchWriterConfig;
  private buffer: NormalizedMarketDataRecord[] = [];

  constructor(
    private readonly writer: MarketDataWriter,
    private readonly metrics: StorageMetrics,
    config: Partial<MarketDataBatchWriterConfig> = {},
  ) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }

  /** Buffer a record; auto-flushes a full batch. Returns the flush result when one occurred. */
  async add(record: NormalizedMarketDataRecord): Promise<WriteResult | null> {
    this.buffer.push(record);
    this.metrics.setQueueDepth(this.buffer.length);
    if (this.buffer.length >= this.config.maxBatchSize) return this.flush();
    return null;
  }

  /** Persist everything buffered. */
  async flush(): Promise<WriteResult | null> {
    if (this.buffer.length === 0) return null;
    const batch = this.buffer;
    this.buffer = [];
    this.metrics.setQueueDepth(0);
    return this.writer.writeBatch(batch);
  }

  get depth(): number {
    return this.buffer.length;
  }

  get isFull(): boolean {
    return this.buffer.length >= this.config.capacity;
  }

  isUnderPressure(): boolean {
    return this.buffer.length >= this.config.capacity * this.config.highWatermark;
  }
}
