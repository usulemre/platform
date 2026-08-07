/**
 * The **storage engine** — the pluggable persistence seam. Everything above it (writer, repositories,
 * retention) speaks only this port, so the concrete technology (an in-memory reference here; a
 * time-series DB / columnar store / object store in production) is replaceable without touching a
 * consumer (SE-3). The engine's contract is: idempotent, partitioned writes keyed by a per-record
 * identity; partition-scoped reads; partition enumeration; and whole-partition drops (for retention).
 *
 * `InMemoryStorageEngine` is a deterministic reference implementation: a map of partitions, each a
 * map of identity → entry. Duplicate identities are skipped or upserted per the entry's policy, so a
 * duplicate write never corrupts stored data. Reads return entries sorted by primary time (stable on
 * ingest sequence), which is what the time-series query layer needs.
 */
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';

/** One persisted record with its storage metadata. */
export interface StoredEntry {
  readonly identity: string;
  readonly partition: string;
  readonly primaryTime: number;
  readonly upsert: boolean;
  readonly record: NormalizedMarketDataRecord;
  readonly storedAt: number;
}

/** The outcome of an engine write. */
export interface EngineWriteReport {
  readonly persisted: number;
  readonly duplicates: number;
  readonly upserts: number;
}

/** The persistence port. Implementations may be async and may throw on infrastructure failure. */
export interface StorageEngine {
  /** Idempotently write a batch of entries (all in the same partition is NOT required). */
  write(entries: readonly StoredEntry[]): Promise<EngineWriteReport>;
  /** Read entries from the given partitions (or all partitions when the list is empty), time-sorted. */
  read(partitions: readonly string[]): Promise<readonly StoredEntry[]>;
  /** All partition handles currently held. */
  listPartitions(): readonly string[];
  /** Drop a whole partition; returns the number of entries removed. */
  dropPartition(partition: string): Promise<number>;
  /** Total number of stored entries (diagnostics/metrics). */
  count(): number;
}

export class InMemoryStorageEngine implements StorageEngine {
  private readonly partitions = new Map<string, Map<string, StoredEntry>>();

  async write(entries: readonly StoredEntry[]): Promise<EngineWriteReport> {
    let persisted = 0;
    let duplicates = 0;
    let upserts = 0;
    for (const entry of entries) {
      let partition = this.partitions.get(entry.partition);
      if (!partition) {
        partition = new Map<string, StoredEntry>();
        this.partitions.set(entry.partition, partition);
      }
      const existing = partition.get(entry.identity);
      if (existing) {
        if (entry.upsert) {
          partition.set(entry.identity, entry);
          upserts += 1;
        } else {
          duplicates += 1;
        }
        continue;
      }
      partition.set(entry.identity, entry);
      persisted += 1;
    }
    return { persisted, duplicates, upserts };
  }

  async read(partitions: readonly string[]): Promise<readonly StoredEntry[]> {
    const handles = partitions.length > 0 ? partitions : [...this.partitions.keys()];
    const out: StoredEntry[] = [];
    for (const handle of handles) {
      const partition = this.partitions.get(handle);
      if (partition) out.push(...partition.values());
    }
    out.sort(byTimeThenSequence);
    return out;
  }

  listPartitions(): readonly string[] {
    return [...this.partitions.keys()];
  }

  async dropPartition(partition: string): Promise<number> {
    const held = this.partitions.get(partition);
    if (!held) return 0;
    const size = held.size;
    this.partitions.delete(partition);
    return size;
  }

  count(): number {
    let total = 0;
    for (const partition of this.partitions.values()) total += partition.size;
    return total;
  }
}

/** Stable ordering: primary time ascending, ties broken by the immutable ingest sequence. */
export function byTimeThenSequence(a: StoredEntry, b: StoredEntry): number {
  if (a.primaryTime !== b.primaryTime) return a.primaryTime - b.primaryTime;
  return a.record.provenance.ingestSequence - b.record.provenance.ingestSequence;
}
