/**
 * The **ingestion state manager** — per-stream operational state for observability and health. It
 * records, for each logical stream, how many events were ingested/rejected, the last activity time,
 * and whether the stream is currently degraded (an order-book desync awaiting recovery). It holds no
 * market data itself; it is the pipeline's memory of *how each stream is doing*, which the health
 * monitor reads. Deterministic; timestamps are supplied by the caller.
 */
export type StreamStatus = 'ACTIVE' | 'DEGRADED' | 'RECOVERING';

export interface StreamState {
  readonly streamKey: string;
  status: StreamStatus;
  ingested: number;
  rejected: number;
  duplicates: number;
  gaps: number;
  resyncs: number;
  lastEventAt: number | undefined;
  lastRejectionCode: string | undefined;
}

export type StreamStateSnapshot = Readonly<StreamState>;

export class IngestionStateManager {
  private readonly streams = new Map<string, StreamState>();

  private ensure(streamKey: string): StreamState {
    let state = this.streams.get(streamKey);
    if (!state) {
      state = {
        streamKey,
        status: 'ACTIVE',
        ingested: 0,
        rejected: 0,
        duplicates: 0,
        gaps: 0,
        resyncs: 0,
        lastEventAt: undefined,
        lastRejectionCode: undefined,
      };
      this.streams.set(streamKey, state);
    }
    return state;
  }

  recordIngested(streamKey: string, at: number): void {
    const state = this.ensure(streamKey);
    state.ingested += 1;
    state.lastEventAt = at;
  }

  recordRejected(streamKey: string, code: string, at: number): void {
    const state = this.ensure(streamKey);
    state.rejected += 1;
    state.lastRejectionCode = code;
    state.lastEventAt = at;
  }

  recordDuplicate(streamKey: string): void {
    this.ensure(streamKey).duplicates += 1;
  }

  markDegraded(streamKey: string): void {
    this.ensure(streamKey).status = 'DEGRADED';
    this.ensure(streamKey).gaps += 1;
  }

  markRecovering(streamKey: string): void {
    this.ensure(streamKey).status = 'RECOVERING';
  }

  markSynchronized(streamKey: string): void {
    const state = this.ensure(streamKey);
    if (state.status !== 'ACTIVE') state.resyncs += 1;
    state.status = 'ACTIVE';
  }

  /** State of one stream, or `undefined` if never seen. */
  get(streamKey: string): StreamStateSnapshot | undefined {
    const state = this.streams.get(streamKey);
    return state ? { ...state } : undefined;
  }

  /** All stream states (immutable copies). */
  all(): readonly StreamStateSnapshot[] {
    return [...this.streams.values()].map((state) => ({ ...state }));
  }

  /** Number of streams currently degraded. */
  degradedCount(): number {
    let count = 0;
    for (const state of this.streams.values()) if (state.status !== 'ACTIVE') count += 1;
    return count;
  }
}
