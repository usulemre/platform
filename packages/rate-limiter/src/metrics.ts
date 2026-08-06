/**
 * `RateLimitMetrics` — a deterministic, in-memory counter set for a rate limiter: admitted requests
 * (immediately vs after waiting), rejections by reason, total and peak queue depth, and total wait
 * time. Snapshots are plain, immutable data for the Monitoring Module. No IO.
 */
import type { RateLimitReason } from './errors';

export interface RateLimitMetricsSnapshot {
  readonly acquired: number;
  readonly admittedImmediately: number;
  readonly admittedAfterWait: number;
  readonly rejected: number;
  readonly rejectedByReason: readonly {
    readonly reason: RateLimitReason;
    readonly count: number;
  }[];
  readonly totalWaitMs: number;
  readonly peakQueueDepth: number;
  readonly averageWaitMs: number;
}

export class RateLimitMetrics {
  private acquired = 0;
  private admittedImmediately = 0;
  private admittedAfterWait = 0;
  private rejected = 0;
  private totalWaitMs = 0;
  private peakQueueDepth = 0;
  private readonly reasonCounts = new Map<RateLimitReason, number>();

  onAcquired(waitedMs: number): void {
    this.acquired += 1;
    if (waitedMs > 0) {
      this.admittedAfterWait += 1;
      this.totalWaitMs += waitedMs;
    } else {
      this.admittedImmediately += 1;
    }
  }
  onRejected(reason: RateLimitReason): void {
    this.rejected += 1;
    this.reasonCounts.set(reason, (this.reasonCounts.get(reason) ?? 0) + 1);
  }
  onQueueDepth(depth: number): void {
    if (depth > this.peakQueueDepth) this.peakQueueDepth = depth;
  }

  snapshot(): RateLimitMetricsSnapshot {
    return {
      acquired: this.acquired,
      admittedImmediately: this.admittedImmediately,
      admittedAfterWait: this.admittedAfterWait,
      rejected: this.rejected,
      rejectedByReason: [...this.reasonCounts.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      totalWaitMs: this.totalWaitMs,
      peakQueueDepth: this.peakQueueDepth,
      averageWaitMs: this.admittedAfterWait > 0 ? this.totalWaitMs / this.admittedAfterWait : 0,
    };
  }

  reset(): void {
    this.acquired = 0;
    this.admittedImmediately = 0;
    this.admittedAfterWait = 0;
    this.rejected = 0;
    this.totalWaitMs = 0;
    this.peakQueueDepth = 0;
    this.reasonCounts.clear();
  }
}
