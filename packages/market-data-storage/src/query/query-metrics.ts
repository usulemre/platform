/**
 * `QueryMetrics` — deterministic counters/gauges for the read path, the query-side counterpart to the
 * write-side `StorageMetrics`. Pure accumulators: latencies are supplied by callers (measured with the
 * injected clock upstream), so the metrics are reproducible. They make the Query Engine observable per
 * the platform requirement — query volume and latency, failures and timeouts, rows returned and page
 * sizes, and how often pagination, latest-value, and order-book paths are exercised — plus a count of
 * slow queries above a configurable threshold.
 */
import type { QueryErrorCode } from './query-errors';

export interface QueryMetricsSnapshot {
  readonly queriesRun: number;
  readonly queryFailures: number;
  readonly queryTimeouts: number;
  readonly storageErrors: number;
  readonly rowsReturned: number;
  readonly paginationQueries: number;
  readonly latestQueries: number;
  readonly orderBookQueries: number;
  readonly sequenceQueries: number;
  readonly slowQueries: number;
  readonly avgQueryLatencyMs: number;
  readonly maxQueryLatencyMs: number;
  readonly avgRowsReturned: number;
  readonly failuresByCode: Readonly<Record<string, number>>;
  readonly lastQueryAt: number | undefined;
}

export interface QueryMetricsOptions {
  /** Latency (ms) at or above which a query is counted as slow. */
  readonly slowQueryThresholdMs?: number;
}

const DEFAULT_SLOW_QUERY_MS = 250;

export class QueryMetrics {
  private queriesRun = 0;
  private queryFailures = 0;
  private queryTimeouts = 0;
  private storageErrors = 0;
  private rowsReturned = 0;
  private paginationQueries = 0;
  private latestQueries = 0;
  private orderBookQueries = 0;
  private sequenceQueries = 0;
  private slowQueries = 0;
  private latencySum = 0;
  private maxLatency = 0;
  private lastQueryAt: number | undefined;
  private readonly failuresByCode = new Map<QueryErrorCode, number>();
  private readonly slowThresholdMs: number;

  constructor(options: QueryMetricsOptions = {}) {
    this.slowThresholdMs = options.slowQueryThresholdMs ?? DEFAULT_SLOW_QUERY_MS;
  }

  /** Record a completed query: how many rows it returned, its latency, and when it finished. */
  onQuery(rows: number, latencyMs: number, at: number): void {
    this.queriesRun += 1;
    this.rowsReturned += rows;
    this.latencySum += latencyMs;
    if (latencyMs > this.maxLatency) this.maxLatency = latencyMs;
    if (latencyMs >= this.slowThresholdMs) this.slowQueries += 1;
    this.lastQueryAt = at;
  }

  onPagination(): void {
    this.paginationQueries += 1;
  }

  onLatest(): void {
    this.latestQueries += 1;
  }

  onOrderBook(): void {
    this.orderBookQueries += 1;
  }

  onSequence(): void {
    this.sequenceQueries += 1;
  }

  /** Record a failed query, classified by canonical code. Timeouts and storage faults are split out. */
  onFailure(code: QueryErrorCode): void {
    this.queryFailures += 1;
    this.failuresByCode.set(code, (this.failuresByCode.get(code) ?? 0) + 1);
    if (code === 'QUERY_TIMEOUT' || code === 'QUERY_CANCELLED') this.queryTimeouts += 1;
    if (code === 'STORAGE_UNAVAILABLE') this.storageErrors += 1;
  }

  snapshot(): QueryMetricsSnapshot {
    return {
      queriesRun: this.queriesRun,
      queryFailures: this.queryFailures,
      queryTimeouts: this.queryTimeouts,
      storageErrors: this.storageErrors,
      rowsReturned: this.rowsReturned,
      paginationQueries: this.paginationQueries,
      latestQueries: this.latestQueries,
      orderBookQueries: this.orderBookQueries,
      sequenceQueries: this.sequenceQueries,
      slowQueries: this.slowQueries,
      avgQueryLatencyMs: this.queriesRun === 0 ? 0 : this.latencySum / this.queriesRun,
      maxQueryLatencyMs: this.maxLatency,
      avgRowsReturned: this.queriesRun === 0 ? 0 : this.rowsReturned / this.queriesRun,
      failuresByCode: Object.fromEntries(this.failuresByCode),
      lastQueryAt: this.lastQueryAt,
    };
  }
}
