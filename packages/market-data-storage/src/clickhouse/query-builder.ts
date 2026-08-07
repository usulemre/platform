/**
 * **Canonical → ClickHouse SQL translation.** The public canonical interface never exposes ClickHouse
 * syntax; these builders translate the `StorageEngine` operations (partition-scoped reads, counts,
 * whole-partition drops, catalog hydration) into parameterized ClickHouse SQL. Reads use the `FINAL`
 * modifier so identity-keyed deduplication is applied at query time (see idempotency notes on the
 * engine) and results are ordered to match the engine's time-then-sequence contract. Partition
 * predicates are bound via `query_params` (injection-safe); the only literal interpolation is in
 * `DROP PARTITION`, which ClickHouse cannot bind, and there values are escaped via `chQuote`.
 */
import { parsePartitionKey } from '../partition';
import { chQuote } from './serialization';

const READ_COLUMNS =
  'instrument_id, market_data_type, partition_date, primary_time, stored_at, identity, record';

export interface BuiltQuery {
  readonly sql: string;
  readonly params: Record<string, unknown>;
}

/**
 * Read entries for the given partitions (or all when empty), time-then-sequence ordered. The
 * partition predicate is decomposed into three `Array(String)` bound parameters (instrument, type,
 * date) rather than an `Array(Tuple)` — the client binds string arrays natively, and any resulting
 * cross-product over-match is corrected by the query repository's exact-field filter downstream.
 */
export function buildReadQuery(table: string, partitions: readonly string[]): BuiltQuery {
  if (partitions.length === 0) {
    return {
      sql: `SELECT ${READ_COLUMNS} FROM ${table} FINAL ORDER BY primary_time, ingest_sequence`,
      params: {},
    };
  }
  const keys = partitions
    .map((p) => parsePartitionKey(p))
    .filter((k): k is NonNullable<typeof k> => k !== null);
  const insts = [...new Set(keys.map((k) => k.instrumentId))];
  const types = [...new Set(keys.map((k) => k.marketDataType))];
  const dates = [...new Set(keys.map((k) => k.date))];
  return {
    sql:
      `SELECT ${READ_COLUMNS} FROM ${table} FINAL ` +
      `WHERE instrument_id IN {insts: Array(String)} ` +
      `AND market_data_type IN {types: Array(String)} ` +
      `AND partition_date IN {dates: Array(String)} ` +
      `ORDER BY primary_time, ingest_sequence`,
    params: { insts, types, dates },
  };
}

/** Deduplicated total row count (for catalog hydration / diagnostics). */
export function buildCountQuery(table: string): string {
  return `SELECT count() AS c FROM (SELECT 1 FROM ${table} FINAL)`;
}

/** Deduplicated row count within a single partition. */
export function buildPartitionCountQuery(table: string, partition: string): BuiltQuery {
  const key = parsePartitionKey(partition);
  return {
    sql:
      `SELECT count() AS c FROM (SELECT 1 FROM ${table} FINAL ` +
      `WHERE instrument_id = {i:String} AND market_data_type = {t:String} ` +
      `AND partition_date = {d:String})`,
    params: { i: key?.instrumentId ?? '', t: key?.marketDataType ?? '', d: key?.date ?? '' },
  };
}

/** Distinct partitions present (for catalog hydration after restart). */
export function buildDistinctPartitionsQuery(table: string): string {
  return `SELECT DISTINCT instrument_id, market_data_type, partition_date FROM ${table}`;
}

/** `ALTER TABLE … DROP PARTITION` for a whole (instrument, type, date) partition. */
export function buildDropPartitionStatement(table: string, partition: string): string | null {
  const key = parsePartitionKey(partition);
  if (!key) return null;
  return (
    `ALTER TABLE ${table} DROP PARTITION ` +
    `(${chQuote(key.instrumentId)}, ${chQuote(key.marketDataType)}, ${chQuote(key.date)})`
  );
}
