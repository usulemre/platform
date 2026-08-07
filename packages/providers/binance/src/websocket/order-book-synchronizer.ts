/**
 * `OrderBookSynchronizer` — maintains a correct local order book from a diff-depth stream, following
 * Binance's officially-documented "manage a local order book correctly" procedure:
 *  1. buffer diff-depth events for a symbol,
 *  2. fetch a REST depth snapshot (through an injected {@link DepthSnapshotSource}),
 *  3. drop buffered events that are stale relative to the snapshot,
 *  4. verify the first applied event overlaps the snapshot's last-update-id,
 *  5. apply the remaining events, and thereafter apply live events while validating contiguity;
 *     a detected gap re-runs the procedure (bounded retries).
 * It owns no transport — deltas are fed in via {@link handleDelta} and snapshots are fetched through the
 * injected source (backed by the Common HTTP Client / REST client). Emits immutable snapshots and
 * gap notifications through injected callbacks. Deterministic given its inputs.
 */
import { num } from '../mappers/parse';
import { LocalOrderBook } from './order-book';
import { SequenceValidator } from './sequence';
import { BinanceSequenceGapError } from './errors';
import { IDENTITY_SYMBOL_RESOLVER, type SymbolResolver } from './event-mapper';
import type { BinanceMarket } from '../constants';
import type { OrderBookDelta, OrderBookLevel, OrderBookSnapshot } from './events';

/** A raw REST depth snapshot (satisfied structurally by `BinanceRestClient.orderBook`). */
export interface RawDepthSnapshot {
  readonly lastUpdateId: number;
  readonly bids: readonly [string, string][];
  readonly asks: readonly [string, string][];
}

/** The REST depth-snapshot source port. */
export interface DepthSnapshotSource {
  depth(venueSymbol: string, limit: number): Promise<RawDepthSnapshot>;
}

export interface OrderBookSyncCallbacks {
  onSnapshot?(snapshot: OrderBookSnapshot): void;
  onGap?(error: BinanceSequenceGapError): void;
  onResync?(venueSymbol: string): void;
}

export interface OrderBookSynchronizerDeps {
  readonly market: BinanceMarket;
  readonly source: DepthSnapshotSource;
  readonly resolver?: SymbolResolver;
  readonly limit?: number;
  readonly maxBuffer?: number;
  readonly maxResyncAttempts?: number;
  readonly callbacks?: OrderBookSyncCallbacks;
}

interface BookState {
  readonly book: LocalOrderBook;
  buffer: OrderBookDelta[];
  synced: boolean;
  syncing: boolean;
  /** Whether the first valid delta on top of the snapshot has been applied yet. */
  firstApplied: boolean;
}

function toLevels(rows: readonly [string, string][]): OrderBookLevel[] {
  return rows.map(([price, quantity]) => ({ price: num(price), quantity: num(quantity) }));
}

export class OrderBookSynchronizer {
  private readonly states = new Map<string, BookState>();
  private readonly sequence: SequenceValidator;
  private readonly resolver: SymbolResolver;
  private readonly limit: number;
  private readonly maxBuffer: number;
  private readonly maxResyncAttempts: number;

  constructor(private readonly deps: OrderBookSynchronizerDeps) {
    this.sequence = new SequenceValidator(deps.market);
    this.resolver = deps.resolver ?? IDENTITY_SYMBOL_RESOLVER;
    this.limit = deps.limit ?? 1000;
    this.maxBuffer = deps.maxBuffer ?? 5000;
    this.maxResyncAttempts = deps.maxResyncAttempts ?? 3;
  }

  /** Whether a symbol's book is currently synchronized. */
  isSynced(venueSymbol: string): boolean {
    return this.states.get(venueSymbol)?.synced ?? false;
  }

  /** Begin tracking a symbol (buffer mode); idempotent. */
  begin(venueSymbol: string): void {
    if (this.states.has(venueSymbol)) return;
    this.states.set(venueSymbol, {
      book: new LocalOrderBook(this.resolver.toCanonical(venueSymbol), venueSymbol),
      buffer: [],
      synced: false,
      syncing: false,
      firstApplied: false,
    });
  }

  /** Stop tracking a symbol and release its state. */
  stop(venueSymbol: string): void {
    this.states.delete(venueSymbol);
    this.sequence.reset(venueSymbol);
  }

  /** Feed a live diff-depth delta. Buffered until synced; applied (with gap check) once synced. */
  handleDelta(delta: OrderBookDelta): void {
    const state = this.states.get(delta.venueSymbol);
    if (!state) return;
    if (!state.synced) {
      if (state.buffer.length < this.maxBuffer) state.buffer.push(delta);
      return;
    }
    this.applyLive(state, delta);
  }

  /** The current book snapshot for a symbol (undefined until first synchronized). */
  book(venueSymbol: string, limit?: number): OrderBookSnapshot | undefined {
    const state = this.states.get(venueSymbol);
    return state?.synced ? state.book.snapshot(limit) : undefined;
  }

  /** Run (or re-run) the synchronization procedure for a symbol. */
  async synchronize(venueSymbol: string): Promise<void> {
    const state = this.states.get(venueSymbol);
    if (!state || state.syncing) return;
    state.syncing = true;
    try {
      for (let attempt = 1; attempt <= this.maxResyncAttempts; attempt += 1) {
        const raw = await this.deps.source.depth(venueSymbol, this.limit);
        state.book.load({
          lastUpdateId: raw.lastUpdateId,
          bids: toLevels(raw.bids),
          asks: toLevels(raw.asks),
        });
        this.sequence.set(venueSymbol, raw.lastUpdateId);
        state.firstApplied = false;
        const result = this.processBuffer(state, raw.lastUpdateId);
        if (result.ok) {
          state.firstApplied = result.appliedFirst;
          state.synced = true;
          state.buffer = [];
          this.emitSnapshot(state);
          return;
        }
        // Snapshot was older than the buffered events (or a gap remained): retry with a fresh one.
        state.buffer = state.buffer.filter((d) => !this.sequence.isStale(d, raw.lastUpdateId));
      }
      this.deps.callbacks?.onGap?.(
        new BinanceSequenceGapError(venueSymbol, this.sequence.get(venueSymbol) ?? 0, -1),
      );
    } finally {
      state.syncing = false;
    }
  }

  /**
   * Apply buffered events on top of a fresh snapshot. Returns whether the buffer applied cleanly and
   * whether the first valid delta was applied (an empty buffer is clean but leaves `appliedFirst`
   * false so the first live delta is range-validated against the snapshot).
   */
  private processBuffer(
    state: BookState,
    snapshotLastUpdateId: number,
  ): { ok: boolean; appliedFirst: boolean } {
    const pending = state.buffer.filter((d) => !this.sequence.isStale(d, snapshotLastUpdateId));
    if (pending.length === 0) return { ok: true, appliedFirst: false };
    const first = pending[0]!;
    if (!this.sequence.isFirstValid(first, snapshotLastUpdateId))
      return { ok: false, appliedFirst: false };
    state.book.applyDelta(first);
    this.sequence.set(state.book.venueSymbol, first.finalUpdateId);
    for (let i = 1; i < pending.length; i += 1) {
      const delta = pending[i]!;
      const result = this.sequence.validateNext(delta);
      if (!result.contiguous) return { ok: false, appliedFirst: true };
      state.book.applyDelta(delta);
    }
    return { ok: true, appliedFirst: true };
  }

  /** Apply a live delta once synced, re-synchronizing on a detected gap. */
  private applyLive(state: BookState, delta: OrderBookDelta): void {
    if (!state.firstApplied) {
      const snapshotId = this.sequence.get(delta.venueSymbol) ?? 0;
      if (this.sequence.isStale(delta, snapshotId)) return; // pre-snapshot event; drop.
      if (this.sequence.isFirstValid(delta, snapshotId)) {
        state.book.applyDelta(delta);
        this.sequence.set(delta.venueSymbol, delta.finalUpdateId);
        state.firstApplied = true;
        this.emitSnapshot(state, delta.eventTime);
        return;
      }
      this.triggerResync(state, delta, snapshotId + 1, delta.firstUpdateId);
      return;
    }
    const result = this.sequence.validateNext(delta);
    if (!result.contiguous) {
      this.triggerResync(state, delta, result.expected, result.received);
      return;
    }
    state.book.applyDelta(delta);
    this.emitSnapshot(state, delta.eventTime);
  }

  private triggerResync(
    state: BookState,
    delta: OrderBookDelta,
    expected: number,
    received: number,
  ): void {
    state.synced = false;
    state.firstApplied = false;
    state.buffer = [delta];
    this.deps.callbacks?.onGap?.(
      new BinanceSequenceGapError(delta.venueSymbol, expected, received),
    );
    this.deps.callbacks?.onResync?.(delta.venueSymbol);
    void this.synchronize(delta.venueSymbol);
  }

  private emitSnapshot(state: BookState, eventTime?: number): void {
    this.deps.callbacks?.onSnapshot?.(state.book.snapshot(undefined, eventTime));
  }
}
