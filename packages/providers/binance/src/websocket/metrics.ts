/**
 * `MarketDataMetrics` — deterministic counters for the market-data connection: total messages, a
 * per-stream breakdown, validation errors, detected sequence gaps, order-book resyncs and the last
 * message timestamp. Timestamps are supplied by the caller (injected clock upstream), so the metrics
 * are pure accumulators with an immutable snapshot view.
 */
export interface MarketDataMetricsSnapshot {
  readonly totalMessages: number;
  readonly byStream: Readonly<Record<string, number>>;
  readonly validationErrors: number;
  readonly gaps: number;
  readonly resyncs: number;
  readonly activeStreams: number;
  readonly lastMessageAt: number | undefined;
}

export class MarketDataMetrics {
  private total = 0;
  private readonly perStream = new Map<string, number>();
  private validationErrors = 0;
  private gaps = 0;
  private resyncs = 0;
  private lastMessageAt: number | undefined;

  onMessage(streamName: string, at: number): void {
    this.total += 1;
    this.perStream.set(streamName, (this.perStream.get(streamName) ?? 0) + 1);
    this.lastMessageAt = at;
  }

  onValidationError(): void {
    this.validationErrors += 1;
  }

  onGap(): void {
    this.gaps += 1;
  }

  onResync(): void {
    this.resyncs += 1;
  }

  snapshot(activeStreams: number): MarketDataMetricsSnapshot {
    return {
      totalMessages: this.total,
      byStream: Object.fromEntries(this.perStream),
      validationErrors: this.validationErrors,
      gaps: this.gaps,
      resyncs: this.resyncs,
      activeStreams,
      lastMessageAt: this.lastMessageAt,
    };
  }
}
