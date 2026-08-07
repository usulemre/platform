/**
 * `MarketDataQueryEngine` — the **canonical read/query abstraction** for historical and persisted
 * market data. Consumers (Dataset / Research / Feature / Factor / Backtesting / Execution Simulator /
 * the future Python Quant Runtime) read canonical market data *only* through this engine; they never
 * touch ClickHouse, SQL, the storage engine, or a database handle. The engine is provider-independent
 * and storage-independent: it operates on canonical records and delegates every read to the storage
 * abstraction ({@link MarketDataQueryRepository} over a pluggable `StorageEngine`), so ClickHouse-
 * specific query generation stays inside the storage layer and never leaks through this contract.
 *
 * **What it adds over the repository.** Query validation before any storage access; deterministic
 * keyset (cursor) pagination for large datasets; canonical `MarketDataPage` result envelopes with
 * pagination state and opaque `nextCursor`; sequence-range filtering; efficient latest-value queries;
 * deterministic, sequence-preserving order-book snapshot/delta retrieval plus reuse of the existing
 * reconstruction logic; canonical error mapping (no raw ClickHouse errors); query metrics; and health
 * derived from the actual underlying storage.
 *
 * **Time-range semantics.** Inclusive `[from, to]` over the canonical primary timestamp — the storage
 * convention, unchanged (see {@link TimeRange}).
 *
 * **Determinism.** Results are ordered by the canonical total order `(primaryTime, ingestSequence)`;
 * `ingestSequence` is globally unique, so identical inputs always yield identical ordering and cursors.
 */
import type {
  Clock,
  MarketDataEventKind,
  NormalizedMarketDataRecord,
  NormalizedOrderBookDelta,
  NormalizedOrderBookSnapshot,
} from '@platform/market-data-ingestion';
import { byTimeThenSequence, type StoredEntry } from '../engine/storage-engine';
import {
  MarketDataQueryRepository,
  type MarketDataQuery,
  type ReconstructedOrderBook,
} from './query-repository';
import { positionOf, decodeCursor, encodeCursor, isAfterCursor } from './query-cursor';
import { QueryError, QueryValidationError, mapToQueryError } from './query-errors';
import {
  evaluateQueryEngineHealth,
  type QueryEngineHealth,
  type StorageAvailabilityProbe,
} from './query-health';
import { QueryMetrics, type QueryMetricsSnapshot } from './query-metrics';
import type { MarketDataPage, MarketDataQuerySpec, QueryOrder, SequenceRange } from './query-spec';
import { QueryValidator, type ResolvedQuery } from './query-validator';

/** Per-page defaults. A query without an explicit `limit` is bounded to `defaultLimit`. */
const DEFAULT_LIMIT = 1_000;
const MAX_LIMIT = 10_000;

/** Options for order-book snapshot/delta retrieval. */
export interface OrderBookQueryOptions {
  readonly timeRange?: { readonly from?: number; readonly to?: number };
  /** Inclusive `[from, to]` bound over the canonical update-id sequence. */
  readonly sequenceRange?: SequenceRange;
  /** Sequence ordering (default `'asc'`). */
  readonly order?: QueryOrder;
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

export interface MarketDataQueryEngineOptions {
  readonly repository: MarketDataQueryRepository;
  readonly clock: Clock;
  /** Per-page limit when a query omits one (default 1000). */
  readonly defaultLimit?: number;
  /** The largest limit a single query/page may request (default 10000). */
  readonly maxLimit?: number;
  /** Latency (ms) at or above which a query is counted as slow. */
  readonly slowQueryThresholdMs?: number;
  /** Underlying-storage liveness probe for health (absent for an in-memory backend). */
  readonly availabilityProbe?: StorageAvailabilityProbe;
  /** Inject a shared metrics collector; a private one is created otherwise. */
  readonly metrics?: QueryMetrics;
}

export class MarketDataQueryEngine {
  private readonly repo: MarketDataQueryRepository;
  private readonly clock: Clock;
  private readonly validator: QueryValidator;
  private readonly collector: QueryMetrics;
  private readonly probe?: StorageAvailabilityProbe;
  private readonly defaultLimit: number;

  constructor(options: MarketDataQueryEngineOptions) {
    this.repo = options.repository;
    this.clock = options.clock;
    this.defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
    const maxLimit = options.maxLimit ?? MAX_LIMIT;
    this.validator = new QueryValidator({ maxLimit });
    this.collector =
      options.metrics ??
      new QueryMetrics(
        options.slowQueryThresholdMs !== undefined
          ? { slowQueryThresholdMs: options.slowQueryThresholdMs }
          : {},
      );
    if (options.availabilityProbe) this.probe = options.availabilityProbe;
  }

  // ---- Queries -------------------------------------------------------------

  /**
   * Run a bounded query and return canonical records (the first page). Honors instrument / type /
   * kind / interval filters, the inclusive time range, the sequence range, ordering, and an optional
   * cursor. Without an explicit `limit` the result is bounded to the engine's `defaultLimit`; use
   * {@link paginate} to walk a large dataset. Records are canonical domain records — never storage rows.
   */
  async query<R extends NormalizedMarketDataRecord = NormalizedMarketDataRecord>(
    spec: MarketDataQuerySpec,
  ): Promise<readonly R[]> {
    return this.guarded(spec, async () => {
      const page = await this.computePage(spec);
      return { value: page.records as readonly R[], rows: page.records.length };
    });
  }

  /**
   * Run a query and return a {@link MarketDataPage} — records plus pagination state and an opaque
   * `nextCursor`. Feed `nextCursor` back as `spec.cursor` to fetch the next page deterministically,
   * with no overlap or gaps. Pagination is keyset-based (never `OFFSET`), so resuming stays O(1)
   * however deep the paging goes.
   */
  async paginate<R extends NormalizedMarketDataRecord = NormalizedMarketDataRecord>(
    spec: MarketDataQuerySpec,
  ): Promise<MarketDataPage<R>> {
    return this.guarded(spec, async () => {
      const page = await this.computePage(spec);
      this.collector.onPagination();
      return { value: page as MarketDataPage<R>, rows: page.pageSize };
    });
  }

  /**
   * The single most recent record for an instrument (optionally of one kind), read efficiently from
   * the newest partition — never by scanning the full history. Returns `null` when there is none.
   */
  async latest<R extends NormalizedMarketDataRecord = NormalizedMarketDataRecord>(
    instrumentId: string,
    kind?: MarketDataEventKind,
  ): Promise<R | null> {
    return this.guarded(undefined, async () => {
      this.requireInstrument(instrumentId);
      this.collector.onLatest();
      const entry = await this.repo.latestEntry(instrumentId, kind);
      return { value: (entry?.record ?? null) as R | null, rows: entry ? 1 : 0 };
    });
  }

  // ---- Order book ----------------------------------------------------------

  /**
   * Stored order-book snapshots for an instrument, ordered by their canonical `lastUpdateId` sequence
   * (ascending by default). Optional inclusive time and update-id sequence ranges narrow the result.
   * Sequence information is preserved verbatim — nothing is silently reordered or dropped.
   */
  async orderBookSnapshots(
    instrumentId: string,
    opts: OrderBookQueryOptions = {},
  ): Promise<readonly NormalizedOrderBookSnapshot[]> {
    return this.guarded(this.signalOf(opts), async () => {
      this.requireInstrument(instrumentId);
      this.collector.onOrderBook();
      const entries = await this.readOrderBook(instrumentId, 'orderBookSnapshot', opts);
      let snapshots = entries.map((e) => e.record as NormalizedOrderBookSnapshot);
      const seqRange = opts.sequenceRange;
      if (seqRange) {
        snapshots = snapshots.filter((s) => inSequence(s.lastUpdateId, seqRange));
      }
      snapshots = [...snapshots].sort((a, b) => a.lastUpdateId - b.lastUpdateId);
      if (opts.order === 'desc') snapshots.reverse();
      if (opts.limit !== undefined) snapshots = snapshots.slice(0, opts.limit);
      return { value: snapshots, rows: snapshots.length };
    });
  }

  /**
   * Stored order-book deltas for an instrument, ordered by their canonical `finalUpdateId` sequence
   * (ascending by default). A sequence range selects the deltas that *overlap* `[from, to]` (i.e.
   * `finalUpdateId >= from && firstUpdateId <= to`), so no delta needed to bridge the range is dropped.
   */
  async orderBookDeltas(
    instrumentId: string,
    opts: OrderBookQueryOptions = {},
  ): Promise<readonly NormalizedOrderBookDelta[]> {
    return this.guarded(this.signalOf(opts), async () => {
      this.requireInstrument(instrumentId);
      this.collector.onOrderBook();
      const entries = await this.readOrderBook(instrumentId, 'orderBookDelta', opts);
      let deltas = entries.map((e) => e.record as NormalizedOrderBookDelta);
      const seqRange = opts.sequenceRange;
      if (seqRange) {
        deltas = deltas.filter((d) => overlapsSequence(d, seqRange));
      }
      deltas = [...deltas].sort((a, b) => a.finalUpdateId - b.finalUpdateId);
      if (opts.order === 'desc') deltas.reverse();
      if (opts.limit !== undefined) deltas = deltas.slice(0, opts.limit);
      return { value: deltas, rows: deltas.length };
    });
  }

  /**
   * Deterministically reconstruct an instrument's order book at `atMs` (default: latest), reusing the
   * storage layer's existing snapshot-anchor + ordered-delta reconstruction — this engine does not
   * reimplement that algorithm. The result carries enough state (`snapshotUpdateId`, `lastUpdateId`,
   * `appliedDeltas`, `gapDetected`) for consumers to trust or reject the rebuilt book.
   */
  async reconstructOrderBook(
    instrumentId: string,
    atMs?: number,
  ): Promise<ReconstructedOrderBook | null> {
    return this.guarded(undefined, async () => {
      this.requireInstrument(instrumentId);
      this.collector.onOrderBook();
      const book = await this.repo.reconstructOrderBook(instrumentId, atMs);
      return { value: book, rows: book ? 1 : 0 };
    });
  }

  // ---- Observability & health ---------------------------------------------

  /** A live snapshot of query metrics (volume, latency, failures, pagination/latest/order-book usage). */
  metrics(): QueryMetricsSnapshot {
    return this.collector.snapshot();
  }

  /** Engine health derived from the actual underlying storage (see {@link evaluateQueryEngineHealth}). */
  async health(now: number = this.clock.now()): Promise<QueryEngineHealth> {
    return evaluateQueryEngineHealth(now, this.collector.snapshot(), this.probe);
  }

  // ---- Internals -----------------------------------------------------------

  /** Validate, read, sequence-filter, order, cursor, and page — the shared query pipeline. */
  private async computePage(
    spec: MarketDataQuerySpec,
  ): Promise<MarketDataPage<NormalizedMarketDataRecord>> {
    const resolved = this.validator.validate(spec);
    if (spec.sequenceRange) this.collector.onSequence();
    const entries = this.applySequenceRange(
      await this.readEntries(resolved, spec.kind, spec.interval),
      resolved,
    );
    return this.buildPage(entries, spec, resolved);
  }

  /** Read the ascending, pruned, criteria-matched entries for a resolved query (multi-type merge). */
  private async readEntries(
    resolved: ResolvedQuery,
    kind?: MarketDataEventKind,
    interval?: string,
  ): Promise<StoredEntry[]> {
    const base: MarketDataQuery = {
      ...(resolved.instrumentIds.length > 0 ? { instrumentIds: resolved.instrumentIds } : {}),
      ...(kind ? { kind } : {}),
      ...(interval ? { interval } : {}),
      ...(resolved.from !== undefined ? { from: resolved.from } : {}),
      ...(resolved.to !== undefined ? { to: resolved.to } : {}),
    };
    const types = resolved.marketDataTypes;
    if (types.length <= 1) {
      const only = types[0];
      const criteria: MarketDataQuery = only ? { ...base, marketDataType: only } : base;
      return [...(await this.repo.selectEntries(criteria))];
    }
    const merged: StoredEntry[] = [];
    for (const type of types) {
      merged.push(...(await this.repo.selectEntries({ ...base, marketDataType: type })));
    }
    // Re-establish the canonical total order across the per-type reads.
    return merged.sort(byTimeThenSequence);
  }

  /** Filter entries to those whose canonical stream sequence falls in the resolved sequence range. */
  private applySequenceRange(entries: StoredEntry[], resolved: ResolvedQuery): StoredEntry[] {
    if (resolved.seqFrom === undefined && resolved.seqTo === undefined) return entries;
    return entries.filter((entry) => {
      const seq = entry.record.provenance.sequence;
      if (seq === undefined) return false;
      if (resolved.seqFrom !== undefined && seq < resolved.seqFrom) return false;
      if (resolved.seqTo !== undefined && seq > resolved.seqTo) return false;
      return true;
    });
  }

  /** Apply order, keyset cursor, and limit to ascending entries, producing a page envelope. */
  private buildPage(
    ascending: StoredEntry[],
    spec: MarketDataQuerySpec,
    resolved: ResolvedQuery,
  ): MarketDataPage<NormalizedMarketDataRecord> {
    const order = resolved.order;
    const ordered = order === 'desc' ? [...ascending].reverse() : ascending;
    const after =
      spec.cursor !== undefined
        ? ordered.filter((e) => isAfterCursor(e, decodeCursor(spec.cursor as string, order)))
        : ordered;

    const limit = spec.limit ?? this.defaultLimit;
    const hasMore = after.length > limit;
    const pageEntries = after.slice(0, limit);
    const last = pageEntries[pageEntries.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(positionOf(last, order)) : null;

    return {
      records: pageEntries.map((e) => e.record),
      order,
      pageSize: pageEntries.length,
      limit,
      hasMore,
      nextCursor,
      cursor: spec.cursor ?? null,
    };
  }

  /** Read order-book entries of one kind for an instrument, pruned to the ORDER_BOOKS partitions. */
  private async readOrderBook(
    instrumentId: string,
    kind: 'orderBookSnapshot' | 'orderBookDelta',
    opts: OrderBookQueryOptions,
  ): Promise<StoredEntry[]> {
    const spec: MarketDataQuerySpec = {
      instrumentId,
      marketDataType: 'ORDER_BOOKS',
      kind,
      ...(opts.timeRange ? { timeRange: opts.timeRange } : {}),
      ...(opts.limit !== undefined ? { limit: opts.limit } : {}),
      ...(opts.order ? { order: opts.order } : {}),
    };
    const resolved = this.validator.validate(spec);
    return this.readEntries(resolved, kind);
  }

  private requireInstrument(instrumentId: string): void {
    if (typeof instrumentId !== 'string' || instrumentId.trim() === '') {
      throw new QueryValidationError('QUERY_INVALID', 'Instrument id must be a non-empty string.');
    }
  }

  private signalOf(opts: { signal?: AbortSignal }): { signal?: AbortSignal } | undefined {
    return opts.signal ? { signal: opts.signal } : undefined;
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) throw new QueryError('QUERY_CANCELLED', 'The query was cancelled.');
  }

  /**
   * Execute `work`, measuring latency, honoring cooperative cancellation, and mapping every failure to
   * a canonical {@link QueryError} — so raw storage/ClickHouse errors never escape the public contract.
   */
  private async guarded<T>(
    spec: { signal?: AbortSignal } | undefined,
    work: () => Promise<{ value: T; rows: number }>,
  ): Promise<T> {
    const start = this.clock.now();
    try {
      this.throwIfAborted(spec?.signal);
      const { value, rows } = await work();
      this.throwIfAborted(spec?.signal);
      this.collector.onQuery(rows, this.clock.now() - start, this.clock.now());
      return value;
    } catch (raw) {
      const error = mapToQueryError(raw);
      this.collector.onFailure(error.code);
      throw error;
    }
  }
}

/** Inclusive `[from, to]` membership over an update-id sequence value. */
function inSequence(value: number, range: SequenceRange): boolean {
  if (range.from !== undefined && value < range.from) return false;
  if (range.to !== undefined && value > range.to) return false;
  return true;
}

/** Whether a delta's `[firstUpdateId, finalUpdateId]` span overlaps the requested sequence range. */
function overlapsSequence(delta: NormalizedOrderBookDelta, range: SequenceRange): boolean {
  if (range.to !== undefined && delta.firstUpdateId > range.to) return false;
  if (range.from !== undefined && delta.finalUpdateId < range.from) return false;
  return true;
}
