/**
 * **Partitioning** — the physical layout strategy for large market-data volumes. Records are
 * partitioned by `(instrument, data-type, UTC date)`, which lets time-range and instrument queries
 * prune to a small set of partitions instead of scanning everything, and lets retention drop whole
 * partitions by age. The scheme is provider-independent and additive: new instruments/types/days
 * create new partitions with no schema change (SC-1). The UTC date is a pure function of the record's
 * primary timestamp — no ambient clock is read.
 */
import type { MarketDataType } from '@platform/market-data-sdk';
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import { primaryTimestamp } from './identity';

/** The three-axis partition coordinate. */
export interface PartitionKey {
  readonly instrumentId: string;
  readonly marketDataType: MarketDataType;
  /** UTC calendar day, `YYYY-MM-DD`, derived from the record's primary timestamp. */
  readonly date: string;
}

/** The canonical string form of a partition key (the engine's partition handle). */
export function partitionKeyString(key: PartitionKey): string {
  return `${key.instrumentId}|${key.marketDataType}|${key.date}`;
}

/** Parse a partition-key string back into its structured form. */
export function parsePartitionKey(value: string): PartitionKey | null {
  const parts = value.split('|');
  if (parts.length !== 3) return null;
  const [instrumentId, marketDataType, date] = parts as [string, MarketDataType, string];
  return { instrumentId, marketDataType, date };
}

/** The maximum epoch-ms a JS `Date` can represent (±8.64e15). */
const MAX_DATE_MS = 8_640_000_000_000_000;

/** The UTC calendar day (`YYYY-MM-DD`) for an epoch-ms timestamp. Pure function of its input. */
export function utcDate(epochMs: number): string {
  // Clamp to the representable `Date` range so open-ended query bounds (0, MAX_SAFE_INTEGER) are
  // well-defined. `new Date(ms)` here is deterministic (a pure function of its argument, not ambient time).
  const clamped =
    epochMs > MAX_DATE_MS ? MAX_DATE_MS : epochMs < -MAX_DATE_MS ? -MAX_DATE_MS : epochMs;
  return new Date(clamped).toISOString().slice(0, 10);
}

/** Compute the partition a record belongs to. */
export function computePartition(record: NormalizedMarketDataRecord): PartitionKey {
  return {
    instrumentId: record.instrumentId,
    marketDataType: record.marketDataType,
    date: utcDate(primaryTimestamp(record.timestamps)),
  };
}

/** A filter used to prune the set of partitions a query must read. */
export interface PartitionFilter {
  readonly instrumentIds?: readonly string[];
  readonly marketDataType?: MarketDataType;
  /** Inclusive UTC-date lower bound (`YYYY-MM-DD`). */
  readonly fromDate?: string;
  /** Inclusive UTC-date upper bound (`YYYY-MM-DD`). */
  readonly toDate?: string;
}

/**
 * The **partition manager** — pure helpers for computing keys and pruning partitions for a query. It
 * holds no state of its own; the engine owns the partitions and this decides which of them a read
 * must touch (partition pruning).
 */
export class StoragePartitionManager {
  /** Compute the partition string for a record. */
  partitionOf(record: NormalizedMarketDataRecord): string {
    return partitionKeyString(computePartition(record));
  }

  /** From all engine partition strings, select those a filter could match. */
  select(all: readonly string[], filter: PartitionFilter): string[] {
    const instruments = filter.instrumentIds ? new Set(filter.instrumentIds) : undefined;
    return all.filter((value) => {
      const key = parsePartitionKey(value);
      if (!key) return false;
      if (instruments && !instruments.has(key.instrumentId)) return false;
      if (filter.marketDataType && key.marketDataType !== filter.marketDataType) return false;
      if (filter.fromDate && key.date < filter.fromDate) return false;
      if (filter.toDate && key.date > filter.toDate) return false;
      return true;
    });
  }
}
