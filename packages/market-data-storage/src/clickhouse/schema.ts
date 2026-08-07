/**
 * **Canonical ClickHouse schema.** One analytical table holds every canonical market-data record. The
 * envelope fields (instrument, type, kind, timestamps, sequence, provenance, identity) are real
 * columns so ClickHouse can prune partitions, filter, and order efficiently; the exact canonical
 * record is preserved verbatim in the `record` JSON column so reads round-trip losslessly (including
 * order-book level arrays, which is what makes deterministic reconstruction possible).
 *
 * The schema is derived from the platform's canonical domain model — NOT from any provider's response
 * shape. It uses ClickHouse-native time-series design:
 *  - `ENGINE = ReplacingMergeTree(ver)` — eventual, identity-keyed deduplication (see idempotency).
 *  - `PARTITION BY (instrument_id, market_data_type, partition_date)` — mirrors the platform partition
 *    contract exactly, so the partition manager's `(instrument, type, UTC date)` semantics and
 *    whole-partition retention (`DROP PARTITION`) map 1:1.
 *  - `ORDER BY (instrument_id, market_data_type, primary_time, identity)` — optimizes the real query
 *    patterns (instrument[+type]+time-range, latest, historical ordering) and makes `identity` the
 *    deduplication granularity.
 */

/** The canonical event table's columns, in DDL order. */
export const EVENT_COLUMNS = [
  'instrument_id',
  'market_data_type',
  'kind',
  'partition_date',
  'primary_time',
  'event_time',
  'exchange_time',
  'receive_time',
  'processing_time',
  'sequence',
  'provider_id',
  'provider_symbol',
  'ingest_sequence',
  'identity',
  'stored_at',
  'ver',
  'record',
] as const;

/** DDL for the canonical event table (idempotent). */
export function eventTableDdl(table: string): string {
  return `CREATE TABLE IF NOT EXISTS ${table}
(
  instrument_id     LowCardinality(String),
  market_data_type  LowCardinality(String),
  kind              LowCardinality(String),
  partition_date    String,
  primary_time      Int64,
  event_time        Nullable(Int64),
  exchange_time     Nullable(Int64),
  receive_time      Int64,
  processing_time   Int64,
  sequence          Nullable(Int64),
  provider_id       LowCardinality(String),
  provider_symbol   String,
  ingest_sequence   Int64,
  identity          String,
  stored_at         Int64,
  ver               UInt64,
  record            String
)
ENGINE = ReplacingMergeTree(ver)
PARTITION BY (instrument_id, market_data_type, partition_date)
ORDER BY (instrument_id, market_data_type, primary_time, identity)
SETTINGS index_granularity = 8192`;
}

/** DDL for the migration registry table (idempotent). */
export function migrationsTableDdl(table: string): string {
  return `CREATE TABLE IF NOT EXISTS ${table}
(
  version    UInt32,
  name       String,
  applied_at Int64
)
ENGINE = ReplacingMergeTree(applied_at)
ORDER BY version`;
}
