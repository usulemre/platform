/**
 * **Serialization** between the canonical `StoredEntry` and a ClickHouse row. The envelope fields are
 * projected to columns for filtering/ordering; the full canonical record is preserved verbatim as a
 * JSON string in `record`, so a read reconstructs the exact `StoredEntry` (order-book arrays and all)
 * — no lossy column mapping. ClickHouse returns 64-bit integers as JSON strings to avoid precision
 * loss, so reads coerce them back to numbers. No provider specifics appear anywhere here.
 */
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import { parsePartitionKey } from '../partition';
import type { StoredEntry } from '../engine/storage-engine';

/** A ClickHouse row for the canonical event table. */
export interface EventRow {
  readonly instrument_id: string;
  readonly market_data_type: string;
  readonly kind: string;
  readonly partition_date: string;
  readonly primary_time: number;
  readonly event_time: number | null;
  readonly exchange_time: number | null;
  readonly receive_time: number;
  readonly processing_time: number;
  readonly sequence: number | null;
  readonly provider_id: string;
  readonly provider_symbol: string;
  readonly ingest_sequence: number;
  readonly identity: string;
  readonly stored_at: number;
  readonly ver: number;
  readonly record: string;
}

/** Project a stored entry to a ClickHouse row. `ver = storedAt` so a later write wins on merge. */
export function toRow(entry: StoredEntry): EventRow {
  const record = entry.record;
  const ts = record.timestamps;
  const key = parsePartitionKey(entry.partition);
  return {
    instrument_id: record.instrumentId,
    market_data_type: record.marketDataType,
    kind: record.kind,
    partition_date: key?.date ?? '',
    primary_time: entry.primaryTime,
    event_time: ts.eventTime ?? null,
    exchange_time: ts.exchangeTime ?? null,
    receive_time: ts.receiveTime,
    processing_time: ts.processingTime,
    sequence: record.provenance.sequence ?? null,
    provider_id: record.provenance.providerId,
    provider_symbol: record.provenance.providerSymbol,
    ingest_sequence: record.provenance.ingestSequence,
    identity: entry.identity,
    stored_at: entry.storedAt,
    ver: entry.storedAt,
    record: JSON.stringify(record),
  };
}

/** Reconstruct a stored entry from a ClickHouse row (integers arrive as strings). */
export function fromRow(row: {
  instrument_id: string;
  market_data_type: string;
  partition_date: string;
  primary_time: string | number;
  stored_at: string | number;
  identity: string;
  record: string;
}): StoredEntry {
  return {
    identity: row.identity,
    partition: `${row.instrument_id}|${row.market_data_type}|${row.partition_date}`,
    primaryTime: Number(row.primary_time),
    // `upsert` is a write-time policy flag; it is irrelevant on read, so it is not persisted.
    upsert: false,
    record: JSON.parse(row.record) as NormalizedMarketDataRecord,
    storedAt: Number(row.stored_at),
  };
}

/** Escape a string as a ClickHouse single-quoted literal (for statements that cannot be bound). */
export function chQuote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}
