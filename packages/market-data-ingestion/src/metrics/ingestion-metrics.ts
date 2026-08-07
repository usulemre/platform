/**
 * `IngestionMetrics` — deterministic counters and gauges for the whole pipeline. Pure accumulators:
 * timestamps and latencies are supplied by callers (injected clock upstream), so metrics are
 * reproducible. They make the pipeline observable per the platform requirement — queue depth,
 * throughput, and (critically) how many events were dropped, rejected, quarantined, deduplicated, or
 * triggered a resync. A snapshot is an immutable view.
 */
import type { IngestionErrorCode } from '../errors';

export interface IngestionMetricsSnapshot {
  readonly received: number;
  readonly normalized: number;
  readonly stored: number;
  readonly rejected: number;
  readonly quarantined: number;
  readonly duplicates: number;
  readonly outOfOrder: number;
  readonly gaps: number;
  readonly resyncs: number;
  readonly droppedOverflow: number;
  readonly storeFailures: number;
  readonly batchesWritten: number;
  /** Current buffer depth (gauge, set by the gateway). */
  readonly bufferDepth: number;
  /** Number of streams currently in a degraded (order-book desync) state (gauge). */
  readonly degradedStreams: number;
  readonly rejectionsByCode: Readonly<Record<string, number>>;
  /** Mean end-to-end processing latency (ms) over stored records. */
  readonly avgProcessingLatencyMs: number;
  readonly lastEventAt: number | undefined;
}

export class IngestionMetrics {
  private received = 0;
  private normalized = 0;
  private stored = 0;
  private rejected = 0;
  private quarantined = 0;
  private duplicates = 0;
  private outOfOrder = 0;
  private gaps = 0;
  private resyncs = 0;
  private droppedOverflow = 0;
  private storeFailures = 0;
  private batchesWritten = 0;
  private bufferDepth = 0;
  private degradedStreams = 0;
  private latencySum = 0;
  private latencyCount = 0;
  private lastEventAt: number | undefined;
  private readonly rejectionsByCode = new Map<IngestionErrorCode, number>();

  onReceived(at: number): void {
    this.received += 1;
    this.lastEventAt = at;
  }

  onNormalized(): void {
    this.normalized += 1;
  }

  onStored(count: number, latencyMsTotal: number): void {
    this.stored += count;
    this.batchesWritten += 1;
    this.latencySum += latencyMsTotal;
    this.latencyCount += count;
  }

  onRejected(code: IngestionErrorCode): void {
    this.rejected += 1;
    this.rejectionsByCode.set(code, (this.rejectionsByCode.get(code) ?? 0) + 1);
  }

  onQuarantined(): void {
    this.quarantined += 1;
  }

  onDuplicate(): void {
    this.duplicates += 1;
  }

  onOutOfOrder(): void {
    this.outOfOrder += 1;
  }

  onGap(): void {
    this.gaps += 1;
  }

  onResync(): void {
    this.resyncs += 1;
  }

  onDroppedOverflow(): void {
    this.droppedOverflow += 1;
  }

  onStoreFailure(): void {
    this.storeFailures += 1;
  }

  setBufferDepth(depth: number): void {
    this.bufferDepth = depth;
  }

  setDegradedStreams(count: number): void {
    this.degradedStreams = count;
  }

  snapshot(): IngestionMetricsSnapshot {
    return {
      received: this.received,
      normalized: this.normalized,
      stored: this.stored,
      rejected: this.rejected,
      quarantined: this.quarantined,
      duplicates: this.duplicates,
      outOfOrder: this.outOfOrder,
      gaps: this.gaps,
      resyncs: this.resyncs,
      droppedOverflow: this.droppedOverflow,
      storeFailures: this.storeFailures,
      batchesWritten: this.batchesWritten,
      bufferDepth: this.bufferDepth,
      degradedStreams: this.degradedStreams,
      rejectionsByCode: Object.fromEntries(this.rejectionsByCode),
      avgProcessingLatencyMs: this.latencyCount === 0 ? 0 : this.latencySum / this.latencyCount,
      lastEventAt: this.lastEventAt,
    };
  }
}
