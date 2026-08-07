/**
 * The storage **quarantine** — where records that cannot be persisted (schema-incompatible, invalid,
 * or belonging to a batch the engine permanently rejected) are held with a stable reason. It exists so
 * nothing is silently dropped: every un-persistable record is observably retained for inspection,
 * replay, or reconciliation. Bounded (SC-2): the oldest entries are evicted past capacity and the
 * eviction is counted. It is intentionally distinct from the ingestion dead-letter queue because a
 * storage rejection carries a storage error code, not an ingestion one.
 */
import type { NormalizedMarketDataRecord } from '@platform/market-data-ingestion';
import type { StorageRejection } from './validation/storage-validator';

export type QuarantineStage = 'validation' | 'engine';

export interface QuarantineEntry {
  readonly id: string;
  readonly at: number;
  readonly stage: QuarantineStage;
  readonly reason: StorageRejection;
  readonly record: NormalizedMarketDataRecord;
}

export class StorageDeadLetterQueue {
  private readonly capacity: number;
  private readonly entries: QuarantineEntry[] = [];
  private seq = 0;
  private evicted = 0;

  constructor(capacity = 10_000) {
    if (capacity < 1) throw new Error('Quarantine capacity must be >= 1.');
    this.capacity = capacity;
  }

  add(input: {
    readonly at: number;
    readonly stage: QuarantineStage;
    readonly reason: StorageRejection;
    readonly record: NormalizedMarketDataRecord;
  }): QuarantineEntry {
    const entry: QuarantineEntry = {
      id: `sdlq-${(this.seq += 1)}`,
      at: input.at,
      stage: input.stage,
      reason: input.reason,
      record: input.record,
    };
    this.entries.push(entry);
    while (this.entries.length > this.capacity) {
      this.entries.shift();
      this.evicted += 1;
    }
    return entry;
  }

  list(): readonly QuarantineEntry[] {
    return [...this.entries];
  }

  drain(): QuarantineEntry[] {
    return this.entries.splice(0, this.entries.length);
  }

  get size(): number {
    return this.entries.length;
  }

  get evictedCount(): number {
    return this.evicted;
  }
}
