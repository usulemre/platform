/**
 * **Canonical query & result models** for the Market Data Query Engine — the provider- and
 * storage-independent vocabulary consumers (Dataset / Research / Feature / Factor / Backtesting /
 * Python) use to read persisted market data. Nothing here mentions ClickHouse, SQL, or any provider;
 * a query is expressed purely over canonical axes (instrument, market-data type, kind, primary-time
 * range, sequence range) and canonical ordering, and a result is a page of canonical records plus its
 * pagination state.
 *
 * **Time-range semantics (repository convention, unchanged).** `TimeRange` is **inclusive on both
 * ends** — `[from, to]` — over each record's canonical *primary timestamp* (`eventTime ?? exchangeTime
 * ?? receiveTime`). This is the convention already enforced by the storage read path and the partition
 * manager; the Query Engine does not introduce a new one, so the same `[from, to]` semantics hold
 * consistently across Query Engine, Storage, Dataset, Research, and Backtesting. Omitting a bound
 * leaves that side open.
 */
import type { MarketDataEventKind } from '@platform/market-data-ingestion';
import type { MarketDataType } from '@platform/market-data-sdk';

/** Deterministic result ordering over the canonical `(primaryTime, ingestSequence)` key. */
export type QueryOrder = 'asc' | 'desc';

/** Inclusive `[from, to]` primary-time bound (epoch ms). Either side may be omitted (open-ended). */
export interface TimeRange {
  readonly from?: number;
  readonly to?: number;
}

/**
 * Inclusive `[from, to]` bound over a record's canonical stream sequence (`provenance.sequence`).
 * Records of kinds that carry no sequence (ticker / markPrice / avgPrice) are excluded when a sequence
 * range is set. Either side may be omitted (open-ended).
 */
export interface SequenceRange {
  readonly from?: number;
  readonly to?: number;
}

/**
 * A canonical market-data query. All axes are optional; omitting an axis widens the result. `limit`
 * and `cursor` drive pagination (see {@link MarketDataQueryEngine.paginate}); `signal` requests
 * cooperative cancellation. Consumers never submit SQL or provider expressions — only this typed shape.
 */
export interface MarketDataQuerySpec {
  /** Single instrument (sugar for a one-element `instrumentIds`). */
  readonly instrumentId?: string;
  /** Explicit instrument set. Merged with `instrumentId` when both are present. */
  readonly instrumentIds?: readonly string[];
  /** Single canonical market-data type. */
  readonly marketDataType?: MarketDataType;
  /** Explicit market-data-type set. Merged with `marketDataType` when both are present. */
  readonly marketDataTypes?: readonly MarketDataType[];
  /** Restrict to one canonical event kind (e.g. `'trade'`). */
  readonly kind?: MarketDataEventKind;
  /** Candlestick interval filter (only meaningful with `kind: 'candlestick'`). */
  readonly interval?: string;
  /** Inclusive `[from, to]` primary-time window. */
  readonly timeRange?: TimeRange;
  /** Inclusive `[from, to]` stream-sequence window. */
  readonly sequenceRange?: SequenceRange;
  /** Deterministic ordering (default `'asc'`). */
  readonly order?: QueryOrder;
  /** Maximum records to return. Bounded by the engine's configured maximum. */
  readonly limit?: number;
  /** Opaque keyset cursor from a prior page's `nextCursor`; resumes deterministically. */
  readonly cursor?: string;
  /** Cooperative cancellation. Aborting surfaces a canonical `QUERY_CANCELLED` error. */
  readonly signal?: AbortSignal;
}

/**
 * One page of a paginated query. `nextCursor` is non-null iff `hasMore`; feeding it back as
 * `spec.cursor` yields the next page with no overlap or gaps. The envelope never exposes storage rows
 * or database cursors — `records` are canonical domain records and `nextCursor` is an opaque,
 * validated keyset token.
 */
export interface MarketDataPage<R> {
  readonly records: readonly R[];
  /** The ordering the page was produced under (matches the request; default `'asc'`). */
  readonly order: QueryOrder;
  /** Number of records in this page (`records.length`). */
  readonly pageSize: number;
  /** The effective per-page limit applied. */
  readonly limit: number;
  /** Whether at least one more record exists beyond this page. */
  readonly hasMore: boolean;
  /** The opaque cursor to fetch the next page, or `null` when the result is exhausted. */
  readonly nextCursor: string | null;
  /** The cursor this page resumed from, or `null` for the first page. */
  readonly cursor: string | null;
}
