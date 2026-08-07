/**
 * The **read path** — `MarketDataQueryRepository`, the only way consumers (Dataset / Research /
 * Feature / Backtesting) read canonical market data. They never touch the engine or any underlying
 * database directly; they issue canonical queries here. It supports time-range, instrument, market,
 * data-type, interval, latest-value, and historical-sequence queries, and — critically —
 * **deterministic order-book reconstruction** from a stored snapshot plus its ordered, contiguous
 * deltas. Partition pruning keeps queries from scanning unrelated partitions. Deterministic; latency
 * is measured via an injected clock.
 */
import type {
  Clock,
  MarketDataEventKind,
  NormalizedMarketDataRecord,
  NormalizedOrderBookDelta,
  NormalizedOrderBookSnapshot,
  OrderBookLevel,
} from '@platform/market-data-ingestion';
import { LocalOrderBook } from '@platform/market-data-ingestion';
import type { MarketDataType } from '@platform/market-data-sdk';
import type { StorageEngine, StoredEntry } from '../engine/storage-engine';
import type { StorageMetrics } from '../metrics/storage-metrics';
import { StoragePartitionManager, utcDate, type PartitionFilter } from '../partition';

/** A canonical market-data query. All axes are optional; omit to widen the result. */
export interface MarketDataQuery {
  readonly instrumentId?: string;
  readonly instrumentIds?: readonly string[];
  readonly marketDataType?: MarketDataType;
  readonly kind?: MarketDataEventKind;
  /** Candlestick interval filter. */
  readonly interval?: string;
  /** Inclusive primary-time lower bound (epoch ms). */
  readonly from?: number;
  /** Inclusive primary-time upper bound (epoch ms). */
  readonly to?: number;
  readonly order?: 'asc' | 'desc';
  readonly limit?: number;
}

/** The result of reconstructing an order book at a point in time. */
export interface ReconstructedOrderBook {
  readonly instrumentId: string;
  readonly lastUpdateId: number;
  readonly snapshotUpdateId: number;
  readonly appliedDeltas: number;
  /** True if a sequence gap stopped reconstruction before all deltas were applied. */
  readonly gapDetected: boolean;
  readonly bids: readonly OrderBookLevel[];
  readonly asks: readonly OrderBookLevel[];
}

export interface QueryRepositoryDeps {
  readonly engine: StorageEngine;
  readonly metrics?: StorageMetrics;
  readonly clock?: Clock;
  readonly partitionManager?: StoragePartitionManager;
}

export class MarketDataQueryRepository {
  private readonly partitions: StoragePartitionManager;

  constructor(private readonly deps: QueryRepositoryDeps) {
    this.partitions = deps.partitionManager ?? new StoragePartitionManager();
  }

  /** Run a canonical query. Results are time-ordered (ascending by default). */
  async query(criteria: MarketDataQuery): Promise<readonly NormalizedMarketDataRecord[]> {
    const start = this.deps.clock?.now();
    const entries = await this.read(criteria);
    let records = entries
      .map((entry) => entry.record)
      .filter((record) => matches(record, criteria));
    if (criteria.order === 'desc') records = records.reverse();
    if (criteria.limit !== undefined && criteria.limit >= 0) {
      records = records.slice(0, criteria.limit);
    }
    if (start !== undefined && this.deps.clock && this.deps.metrics) {
      this.deps.metrics.onQuery(this.deps.clock.now() - start);
    }
    return records;
  }

  /** The most recent record for an instrument (optionally of one kind). */
  async latest(
    instrumentId: string,
    kind?: MarketDataEventKind,
  ): Promise<NormalizedMarketDataRecord | null> {
    const records = await this.query({
      instrumentId,
      ...(kind ? { kind } : {}),
      order: 'desc',
      limit: 1,
    });
    return records[0] ?? null;
  }

  /** All records for an instrument+kind within an inclusive primary-time range (ascending). */
  async range(
    instrumentId: string,
    kind: MarketDataEventKind,
    from: number,
    to: number,
  ): Promise<readonly NormalizedMarketDataRecord[]> {
    return this.query({ instrumentId, kind, from, to, order: 'asc' });
  }

  /**
   * Deterministically reconstruct an order book at `atMs` (default: latest). Starts from the newest
   * snapshot at or before `atMs`, then applies its contiguous deltas in sequence order, stopping (and
   * flagging) at the first gap. This is why storing deltas alone is insufficient — a snapshot anchor is
   * required, and the storage layer preserves both.
   */
  async reconstructOrderBook(
    instrumentId: string,
    atMs: number = Number.POSITIVE_INFINITY,
  ): Promise<ReconstructedOrderBook | null> {
    const entries = await this.read({ instrumentId, marketDataType: 'ORDER_BOOKS' });
    const snapshots: NormalizedOrderBookSnapshot[] = [];
    const deltas: NormalizedOrderBookDelta[] = [];
    for (const entry of entries) {
      if (entry.primaryTime > atMs) continue;
      if (entry.record.kind === 'orderBookSnapshot') snapshots.push(entry.record);
      else if (entry.record.kind === 'orderBookDelta') deltas.push(entry.record);
    }
    if (snapshots.length === 0) return null;

    // Anchor on the snapshot with the highest lastUpdateId (the freshest recovery point).
    const anchor = snapshots.reduce((best, s) => (s.lastUpdateId > best.lastUpdateId ? s : best));
    const book = new LocalOrderBook();
    book.reset(anchor.bids, anchor.asks, anchor.lastUpdateId);

    const ordered = deltas
      .filter((d) => d.finalUpdateId > anchor.lastUpdateId)
      .sort((a, b) => a.finalUpdateId - b.finalUpdateId);

    let applied = 0;
    let gapDetected = false;
    for (const delta of ordered) {
      const last = book.updateId;
      const contiguous =
        delta.previousFinalUpdateId !== undefined
          ? delta.previousFinalUpdateId === last
          : delta.firstUpdateId === last + 1;
      if (!contiguous) {
        gapDetected = true;
        break;
      }
      book.applyDelta(delta.bids, delta.asks, delta.finalUpdateId);
      applied += 1;
    }

    const snap = book.snapshot();
    return {
      instrumentId,
      lastUpdateId: snap.lastUpdateId,
      snapshotUpdateId: anchor.lastUpdateId,
      appliedDeltas: applied,
      gapDetected,
      bids: snap.bids,
      asks: snap.asks,
    };
  }

  /** Read the (pruned) candidate entries for a query, time-sorted by the engine. */
  private async read(criteria: MarketDataQuery): Promise<readonly StoredEntry[]> {
    const filter = toPartitionFilter(criteria);
    const selected = this.partitions.select(this.deps.engine.listPartitions(), filter);
    return this.deps.engine.read(selected);
  }
}

function toPartitionFilter(criteria: MarketDataQuery): PartitionFilter {
  const instrumentIds =
    criteria.instrumentIds ?? (criteria.instrumentId ? [criteria.instrumentId] : undefined);
  const filter: {
    instrumentIds?: readonly string[];
    marketDataType?: MarketDataType;
    fromDate?: string;
    toDate?: string;
  } = {};
  if (instrumentIds) filter.instrumentIds = instrumentIds;
  if (criteria.marketDataType) filter.marketDataType = criteria.marketDataType;
  if (criteria.from !== undefined) filter.fromDate = utcDate(criteria.from);
  if (criteria.to !== undefined) filter.toDate = utcDate(criteria.to);
  return filter;
}

function matches(record: NormalizedMarketDataRecord, criteria: MarketDataQuery): boolean {
  if (criteria.instrumentId && record.instrumentId !== criteria.instrumentId) return false;
  if (criteria.instrumentIds && !criteria.instrumentIds.includes(record.instrumentId)) return false;
  if (criteria.marketDataType && record.marketDataType !== criteria.marketDataType) return false;
  if (criteria.kind && record.kind !== criteria.kind) return false;
  if (
    criteria.interval &&
    (record.kind !== 'candlestick' || record.interval !== criteria.interval)
  ) {
    return false;
  }
  const primary =
    record.timestamps.eventTime ?? record.timestamps.exchangeTime ?? record.timestamps.receiveTime;
  if (criteria.from !== undefined && primary < criteria.from) return false;
  if (criteria.to !== undefined && primary > criteria.to) return false;
  return true;
}
