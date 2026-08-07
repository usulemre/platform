/**
 * The **order-book synchronizer** — the safety-critical component. It maintains, per stream, a
 * {@link LocalOrderBook} and a synchronization state, and enforces the platform rule: *never silently
 * apply an invalid delta*. When a sequence gap is detected it stops applying deltas, marks the book
 * DEGRADED, and asks the caller for a fresh snapshot; deltas that arrive before re-synchronization are
 * buffered (bounded) and replayed against the new snapshot, dropping the ones the snapshot already
 * subsumes. Only after contiguity is restored does the book return to SYNCHRONIZED.
 *
 * Contiguity follows the two documented conventions, auto-detected per delta:
 *  - **Diff-only (Spot-style):** the next delta's `firstUpdateId` must equal `lastUpdateId + 1`.
 *  - **Previous-final (Futures-style):** the delta carries `previousFinalUpdateId` (`pu`) which must
 *    equal the current `lastUpdateId`.
 *
 * Deterministic; no IO. Snapshot *fetching* is the caller's responsibility (a provider-neutral port);
 * this component only decides *when* one is needed and applies the one it is given.
 */
import type { RawOrderBookDeltaEvent, RawOrderBookSnapshotEvent } from '../events/canonical-events';
import { LocalOrderBook } from './order-book-state';

export type OrderBookSyncState = 'SYNCING' | 'SYNCHRONIZED' | 'DEGRADED';

export interface OrderBookApplyResult {
  readonly state: OrderBookSyncState;
  /** Whether the delta was applied to the book. */
  readonly applied: boolean;
  /** Whether the delta was buffered pending (re)synchronization. */
  readonly buffered: boolean;
  /** Whether the caller must fetch and supply a fresh snapshot to recover. */
  readonly needsSnapshot: boolean;
  readonly reason?: string;
}

export interface OrderBookSyncConfig {
  /** Max deltas buffered while awaiting a snapshot before the oldest are dropped. */
  readonly maxBufferedDeltas: number;
}

const DEFAULT_CONFIG: OrderBookSyncConfig = { maxBufferedDeltas: 1000 };

interface StreamBook {
  readonly book: LocalOrderBook;
  state: OrderBookSyncState;
  buffer: RawOrderBookDeltaEvent[];
}

export class OrderBookSynchronizer {
  private readonly config: OrderBookSyncConfig;
  private readonly streams = new Map<string, StreamBook>();

  constructor(config: Partial<OrderBookSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private stream(streamKey: string): StreamBook {
    let entry = this.streams.get(streamKey);
    if (!entry) {
      entry = { book: new LocalOrderBook(), state: 'SYNCING', buffer: [] };
      this.streams.set(streamKey, entry);
    }
    return entry;
  }

  /** The current synchronization state of a stream (SYNCING if never seen). */
  stateOf(streamKey: string): OrderBookSyncState {
    return this.streams.get(streamKey)?.state ?? 'SYNCING';
  }

  /** The maintained book for a stream, or `undefined` if not yet initialized. */
  bookOf(streamKey: string): LocalOrderBook | undefined {
    return this.streams.get(streamKey)?.book;
  }

  /**
   * Apply a snapshot, then replay any buffered deltas that are still relevant. Restores the book to
   * SYNCHRONIZED (or DEGRADED again if a buffered delta reveals a fresh gap).
   */
  onSnapshot(streamKey: string, snapshot: RawOrderBookSnapshotEvent): OrderBookApplyResult {
    const entry = this.stream(streamKey);
    entry.book.reset(snapshot.bids, snapshot.asks, snapshot.lastUpdateId);
    entry.state = 'SYNCHRONIZED';
    const buffered = entry.buffer;
    entry.buffer = [];
    for (const delta of buffered) {
      // Drop deltas the snapshot already subsumes.
      if (delta.finalUpdateId <= snapshot.lastUpdateId) continue;
      const result = this.onDelta(streamKey, delta);
      if (result.needsSnapshot) {
        return {
          state: entry.state,
          applied: false,
          buffered: false,
          needsSnapshot: true,
          reason: 'Buffered delta revealed a gap after snapshot.',
        };
      }
    }
    return { state: entry.state, applied: true, buffered: false, needsSnapshot: false };
  }

  /**
   * Apply a live delta. Buffers while SYNCING, refuses (and requests a snapshot) on a gap while
   * SYNCHRONIZED, and ignores stale deltas that the current book already covers.
   */
  onDelta(streamKey: string, delta: RawOrderBookDeltaEvent): OrderBookApplyResult {
    const entry = this.stream(streamKey);

    if (entry.state !== 'SYNCHRONIZED') {
      this.pushBuffer(entry, delta);
      return {
        state: entry.state,
        applied: false,
        buffered: true,
        needsSnapshot: entry.state === 'DEGRADED',
        reason:
          entry.state === 'DEGRADED' ? 'Awaiting fresh snapshot.' : 'Awaiting initial snapshot.',
      };
    }

    const last = entry.book.updateId;

    // Stale: entirely before the current book — drop silently (already applied).
    if (delta.finalUpdateId <= last) {
      return {
        state: 'SYNCHRONIZED',
        applied: false,
        buffered: false,
        needsSnapshot: false,
        reason: 'Stale delta (already applied).',
      };
    }

    const contiguous =
      delta.previousFinalUpdateId !== undefined
        ? delta.previousFinalUpdateId === last
        : delta.firstUpdateId === last + 1;

    if (!contiguous) {
      // A gap: stop applying, degrade, and demand a snapshot. The delta is buffered for replay.
      entry.state = 'DEGRADED';
      this.pushBuffer(entry, delta);
      return {
        state: 'DEGRADED',
        applied: false,
        buffered: true,
        needsSnapshot: true,
        reason: `Sequence gap: expected ${last + 1}, received firstUpdateId ${delta.firstUpdateId}.`,
      };
    }

    entry.book.applyDelta(delta.bids, delta.asks, delta.finalUpdateId);
    return { state: 'SYNCHRONIZED', applied: true, buffered: false, needsSnapshot: false };
  }

  private pushBuffer(entry: StreamBook, delta: RawOrderBookDeltaEvent): void {
    entry.buffer.push(delta);
    while (entry.buffer.length > this.config.maxBufferedDeltas) entry.buffer.shift();
  }

  /** Forget a stream's book and buffer (e.g. on unsubscribe). */
  reset(streamKey: string): void {
    this.streams.delete(streamKey);
  }
}
