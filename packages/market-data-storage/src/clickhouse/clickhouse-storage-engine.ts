/**
 * `ClickHouseStorageEngine` — the production, persistent implementation of the canonical
 * {@link StorageEngine} port, backed by a real ClickHouse server. Writes are batched inserts; reads
 * translate the partition-scoped port calls into ClickHouse SQL (with `FINAL` for identity
 * deduplication). Data lives in ClickHouse and survives process restart; a fresh engine instance
 * re-hydrates its partition catalog via {@link initialize}.
 *
 * **Idempotency (eventual).** ClickHouse's `ReplacingMergeTree` deduplicates rows sharing the ORDER BY
 * key (which includes `identity`) at *merge* time, not at insert time — it is not a transactional
 * unique constraint. Reads therefore use `FINAL` to collapse duplicates on read, so duplicate
 * ingestion never yields duplicate or corrupted canonical data. Consequently the {@link write} report
 * counts every accepted row as `persisted` (skip-policy) or `upserts` (upsert-policy) and reports
 * `duplicates: 0` — the engine cannot know at insert time whether a row already existed. This differs
 * from the in-memory reference engine, which deduplicates immediately and reports exact counts.
 *
 * `listPartitions()` and `count()` are synchronous per the port; the engine keeps an in-memory
 * partition catalog and row-count that are hydrated by {@link initialize} and kept current on write /
 * drop. The catalog is metadata only — the market data itself lives in ClickHouse.
 */
import type { Clock } from '@platform/market-data-ingestion';
import type { EngineWriteReport, StorageEngine, StoredEntry } from '../engine/storage-engine';
import { idempotencyPolicy } from '../identity';
import type { ClickHouseClient } from './client';
import { ClickHouseMetrics } from './metrics';
import {
  buildCountQuery,
  buildDistinctPartitionsQuery,
  buildDropPartitionStatement,
  buildPartitionCountQuery,
  buildReadQuery,
} from './query-builder';
import { fromRow, toRow, type EventRow } from './serialization';

export interface ClickHouseStorageEngineOptions {
  readonly table: string;
  readonly maxBatchSize: number;
  readonly clock: Clock;
  readonly metrics?: ClickHouseMetrics;
}

export class ClickHouseStorageEngine implements StorageEngine {
  private readonly table: string;
  private readonly maxBatchSize: number;
  private readonly clock: Clock;
  readonly metrics: ClickHouseMetrics;
  private readonly catalog = new Set<string>();
  private cachedCount = 0;

  constructor(
    private readonly client: ClickHouseClient,
    options: ClickHouseStorageEngineOptions,
  ) {
    this.table = options.table;
    this.maxBatchSize = Math.max(1, options.maxBatchSize);
    this.clock = options.clock;
    this.metrics = options.metrics ?? new ClickHouseMetrics();
  }

  /** Hydrate the partition catalog and row count from ClickHouse (call after connect / on restart). */
  async initialize(): Promise<void> {
    const partitions = await this.client.query<{
      instrument_id: string;
      market_data_type: string;
      partition_date: string;
    }>(buildDistinctPartitionsQuery(this.table));
    this.catalog.clear();
    for (const p of partitions) {
      this.catalog.add(`${p.instrument_id}|${p.market_data_type}|${p.partition_date}`);
    }
    const counted = await this.client.query<{ c: string | number }>(buildCountQuery(this.table));
    this.cachedCount = counted.length > 0 ? Number(counted[0]?.c ?? 0) : 0;
  }

  async write(entries: readonly StoredEntry[]): Promise<EngineWriteReport> {
    if (entries.length === 0) return { persisted: 0, duplicates: 0, upserts: 0 };

    const rows = entries.map(toRow);
    for (let i = 0; i < rows.length; i += this.maxBatchSize) {
      const chunk = rows.slice(i, i + this.maxBatchSize);
      const start = this.clock.now();
      try {
        await this.client.insert(this.table, chunk);
      } catch (error) {
        this.metrics.onInsertFailure();
        if ((error as { retryable?: boolean }).retryable) this.metrics.onConnectionFailure();
        throw error;
      }
      this.metrics.onInsert(chunk.length, this.clock.now() - start, this.clock.now());
    }

    // Success — update the in-memory catalog/count. Dedup is eventual, so counts reflect intent.
    let persisted = 0;
    let upserts = 0;
    for (const entry of entries) {
      this.catalog.add(entry.partition);
      if (idempotencyPolicy(entry.record.kind) === 'upsert') upserts += 1;
      else persisted += 1;
    }
    this.cachedCount += entries.length;
    return { persisted, duplicates: 0, upserts };
  }

  async read(partitions: readonly string[]): Promise<readonly StoredEntry[]> {
    const { sql, params } = buildReadQuery(this.table, partitions);
    const start = this.clock.now();
    let rows: EventRow[];
    try {
      rows = await this.client.query<EventRow>(sql, params);
    } catch (error) {
      this.metrics.onQueryFailure();
      if ((error as { retryable?: boolean }).retryable) this.metrics.onConnectionFailure();
      throw error;
    }
    this.metrics.onQuery(rows.length, this.clock.now() - start);
    return rows.map(fromRow);
  }

  listPartitions(): readonly string[] {
    return [...this.catalog];
  }

  async dropPartition(partition: string): Promise<number> {
    const statement = buildDropPartitionStatement(this.table, partition);
    if (!statement) return 0;
    const countQuery = buildPartitionCountQuery(this.table, partition);
    const counted = await this.client.query<{ c: string | number }>(
      countQuery.sql,
      countQuery.params,
    );
    const removed = counted.length > 0 ? Number(counted[0]?.c ?? 0) : 0;
    await this.client.command(statement);
    this.catalog.delete(partition);
    this.cachedCount = Math.max(0, this.cachedCount - removed);
    return removed;
  }

  count(): number {
    return this.cachedCount;
  }

  /** Verify live connectivity to ClickHouse (used by health checks). */
  async ping(): Promise<boolean> {
    return this.client.ping();
  }

  /** Release the underlying connections. */
  async close(): Promise<void> {
    await this.client.close();
  }
}
