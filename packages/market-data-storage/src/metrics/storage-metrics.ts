/**
 * `StorageMetrics` — deterministic counters and gauges for the storage layer. Pure accumulators:
 * latencies are supplied by callers (injected clock upstream), so metrics are reproducible. They make
 * persistence observable per the platform requirement — write throughput/latency, batch sizes, queue
 * depth, and how many records were duplicated, upserted, rejected, quarantined, or hit an engine
 * error, plus retention drops and query latency.
 */
import type { StorageErrorCode } from '../errors';

export interface StorageMetricsSnapshot {
  readonly writesAttempted: number;
  readonly persisted: number;
  readonly duplicates: number;
  readonly upserts: number;
  readonly rejected: number;
  readonly quarantined: number;
  readonly engineErrors: number;
  readonly retries: number;
  readonly batchesWritten: number;
  readonly partitionsDropped: number;
  readonly entriesExpired: number;
  readonly queueDepth: number;
  readonly rejectionsByCode: Readonly<Record<string, number>>;
  readonly avgWriteLatencyMs: number;
  readonly avgQueryLatencyMs: number;
  readonly queriesRun: number;
  readonly lastWriteAt: number | undefined;
}

export class StorageMetrics {
  private writesAttempted = 0;
  private persisted = 0;
  private duplicates = 0;
  private upserts = 0;
  private rejected = 0;
  private quarantined = 0;
  private engineErrors = 0;
  private retries = 0;
  private batchesWritten = 0;
  private partitionsDropped = 0;
  private entriesExpired = 0;
  private queueDepth = 0;
  private writeLatencySum = 0;
  private writeBatches = 0;
  private queryLatencySum = 0;
  private queriesRun = 0;
  private lastWriteAt: number | undefined;
  private readonly rejectionsByCode = new Map<StorageErrorCode, number>();

  onWriteAttempt(count: number): void {
    this.writesAttempted += count;
  }

  onPersisted(count: number, at: number): void {
    this.persisted += count;
    if (count > 0) this.lastWriteAt = at;
  }

  onDuplicates(count: number): void {
    this.duplicates += count;
  }

  onUpserts(count: number): void {
    this.upserts += count;
  }

  onRejected(code: StorageErrorCode): void {
    this.rejected += 1;
    this.rejectionsByCode.set(code, (this.rejectionsByCode.get(code) ?? 0) + 1);
  }

  onQuarantined(): void {
    this.quarantined += 1;
  }

  onEngineError(): void {
    this.engineErrors += 1;
  }

  onRetry(): void {
    this.retries += 1;
  }

  onBatch(latencyMs: number): void {
    this.batchesWritten += 1;
    this.writeBatches += 1;
    this.writeLatencySum += latencyMs;
  }

  onPartitionDropped(entries: number): void {
    this.partitionsDropped += 1;
    this.entriesExpired += entries;
  }

  onQuery(latencyMs: number): void {
    this.queriesRun += 1;
    this.queryLatencySum += latencyMs;
  }

  setQueueDepth(depth: number): void {
    this.queueDepth = depth;
  }

  snapshot(): StorageMetricsSnapshot {
    return {
      writesAttempted: this.writesAttempted,
      persisted: this.persisted,
      duplicates: this.duplicates,
      upserts: this.upserts,
      rejected: this.rejected,
      quarantined: this.quarantined,
      engineErrors: this.engineErrors,
      retries: this.retries,
      batchesWritten: this.batchesWritten,
      partitionsDropped: this.partitionsDropped,
      entriesExpired: this.entriesExpired,
      queueDepth: this.queueDepth,
      rejectionsByCode: Object.fromEntries(this.rejectionsByCode),
      avgWriteLatencyMs: this.writeBatches === 0 ? 0 : this.writeLatencySum / this.writeBatches,
      avgQueryLatencyMs: this.queriesRun === 0 ? 0 : this.queryLatencySum / this.queriesRun,
      queriesRun: this.queriesRun,
      lastWriteAt: this.lastWriteAt,
    };
  }
}
