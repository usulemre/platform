/**
 * `ClickHouseMetrics` — deterministic counters for the ClickHouse engine's I/O: insert/query
 * throughput and latency, rows written/returned, retries, failures (including connection failures),
 * and slow queries. Pure accumulators; latencies are supplied by the engine from an injected clock.
 * Credentials never appear here — only counts and timings.
 */
export interface ClickHouseMetricsSnapshot {
  readonly inserts: number;
  readonly rowsInserted: number;
  readonly queries: number;
  readonly rowsReturned: number;
  readonly insertFailures: number;
  readonly queryFailures: number;
  readonly connectionFailures: number;
  readonly retries: number;
  readonly slowQueries: number;
  readonly avgInsertLatencyMs: number;
  readonly avgQueryLatencyMs: number;
  readonly lastInsertAt: number | undefined;
}

export class ClickHouseMetrics {
  private inserts = 0;
  private rowsInserted = 0;
  private queries = 0;
  private rowsReturned = 0;
  private insertFailures = 0;
  private queryFailures = 0;
  private connectionFailures = 0;
  private retries = 0;
  private slowQueries = 0;
  private insertLatencySum = 0;
  private queryLatencySum = 0;
  private lastInsertAt: number | undefined;

  constructor(private readonly slowQueryThresholdMs = 1_000) {}

  onInsert(rows: number, latencyMs: number, at: number): void {
    this.inserts += 1;
    this.rowsInserted += rows;
    this.insertLatencySum += latencyMs;
    this.lastInsertAt = at;
    if (latencyMs >= this.slowQueryThresholdMs) this.slowQueries += 1;
  }

  onQuery(rows: number, latencyMs: number): void {
    this.queries += 1;
    this.rowsReturned += rows;
    this.queryLatencySum += latencyMs;
    if (latencyMs >= this.slowQueryThresholdMs) this.slowQueries += 1;
  }

  onInsertFailure(): void {
    this.insertFailures += 1;
  }

  onQueryFailure(): void {
    this.queryFailures += 1;
  }

  onConnectionFailure(): void {
    this.connectionFailures += 1;
  }

  onRetry(): void {
    this.retries += 1;
  }

  snapshot(): ClickHouseMetricsSnapshot {
    return {
      inserts: this.inserts,
      rowsInserted: this.rowsInserted,
      queries: this.queries,
      rowsReturned: this.rowsReturned,
      insertFailures: this.insertFailures,
      queryFailures: this.queryFailures,
      connectionFailures: this.connectionFailures,
      retries: this.retries,
      slowQueries: this.slowQueries,
      avgInsertLatencyMs: this.inserts === 0 ? 0 : this.insertLatencySum / this.inserts,
      avgQueryLatencyMs: this.queries === 0 ? 0 : this.queryLatencySum / this.queries,
      lastInsertAt: this.lastInsertAt,
    };
  }
}
