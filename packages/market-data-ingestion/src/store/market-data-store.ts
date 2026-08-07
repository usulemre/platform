/**
 * The **canonical market-data store** port and an in-memory reference implementation. This is the
 * ingestion pipeline's downstream boundary: normalized, validated, provenance-bearing records are
 * appended here, and the Dataset / Research / Feature / Backtesting layers read canonical market data
 * from it — never from a provider API (the acceptance criterion). The port is intentionally minimal
 * (append a batch); persistence technology lives behind it and is replaceable (SE-3).
 */
import type { MarketDataType } from '@platform/market-data-sdk';
import type { NormalizedMarketDataRecord } from '../events/envelope';

/** The write port the batch processor depends on. Appends are append-only (CP-2 immutability). */
export interface CanonicalMarketDataStore {
  /** Durably append a batch of canonical records. Rejects (throws) if the batch cannot be stored. */
  append(records: readonly NormalizedMarketDataRecord[]): Promise<void>;
}

/**
 * A deterministic in-memory store. Records are appended in arrival order and queryable by instrument
 * and market-data type for tests and integration. Not for production persistence — a real store binds
 * the same port to durable, bitemporal storage.
 */
export class InMemoryMarketDataStore implements CanonicalMarketDataStore {
  private readonly records: NormalizedMarketDataRecord[] = [];

  async append(records: readonly NormalizedMarketDataRecord[]): Promise<void> {
    for (const record of records) this.records.push(record);
  }

  /** All appended records, in arrival order. */
  all(): readonly NormalizedMarketDataRecord[] {
    return this.records;
  }

  /** Records for one canonical instrument. */
  byInstrument(instrumentId: string): readonly NormalizedMarketDataRecord[] {
    return this.records.filter((r) => r.instrumentId === instrumentId);
  }

  /** Records of one canonical market-data type. */
  byType(type: MarketDataType): readonly NormalizedMarketDataRecord[] {
    return this.records.filter((r) => r.marketDataType === type);
  }

  get size(): number {
    return this.records.length;
  }
}
