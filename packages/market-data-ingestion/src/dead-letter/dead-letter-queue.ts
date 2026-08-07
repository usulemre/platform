/**
 * The **dead-letter queue** — the quarantine for market data the pipeline could not accept: malformed
 * events, quality violations, unknown symbols, and batches the store permanently rejected. Every
 * entry carries a stable reason and the originating stage, so nothing is *silently* dropped — it is
 * observably quarantined and can be inspected, replayed, or reconciled later. Bounded (SC-2): the
 * oldest entries are evicted past capacity and the eviction is counted.
 */
import type { Rejection } from '../validation/validation-result';

export type DeadLetterStage =
  | 'schema'
  | 'symbol'
  | 'quality'
  | 'sequence'
  | 'order_book'
  | 'buffer'
  | 'store';

export interface DeadLetterEntry {
  readonly id: string;
  readonly at: number;
  readonly stage: DeadLetterStage;
  readonly reason: Rejection;
  readonly providerId?: string;
  readonly streamKey?: string;
  /** The quarantined payload (raw event or record batch), retained for inspection/replay. */
  readonly payload: unknown;
}

export interface DeadLetterQueueConfig {
  readonly capacity: number;
}

export class DeadLetterQueue {
  private readonly capacity: number;
  private readonly entries: DeadLetterEntry[] = [];
  private seq = 0;
  private evicted = 0;

  constructor(config: Partial<DeadLetterQueueConfig> = {}) {
    this.capacity = config.capacity ?? 10_000;
    if (this.capacity < 1) throw new Error('Dead-letter capacity must be >= 1.');
  }

  /** Quarantine a payload with a reason. Returns the created entry. */
  add(input: {
    readonly at: number;
    readonly stage: DeadLetterStage;
    readonly reason: Rejection;
    readonly providerId?: string;
    readonly streamKey?: string;
    readonly payload: unknown;
  }): DeadLetterEntry {
    const entry: DeadLetterEntry = {
      id: `dlq-${(this.seq += 1)}`,
      at: input.at,
      stage: input.stage,
      reason: input.reason,
      ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
      ...(input.streamKey !== undefined ? { streamKey: input.streamKey } : {}),
      payload: input.payload,
    };
    this.entries.push(entry);
    while (this.entries.length > this.capacity) {
      this.entries.shift();
      this.evicted += 1;
    }
    return entry;
  }

  /** A snapshot of current quarantined entries. */
  list(): readonly DeadLetterEntry[] {
    return [...this.entries];
  }

  /** Remove and return all entries (e.g. for a replay/reconciliation job). */
  drain(): DeadLetterEntry[] {
    return this.entries.splice(0, this.entries.length);
  }

  get size(): number {
    return this.entries.length;
  }

  /** Total entries evicted due to capacity (observability). */
  get evictedCount(): number {
    return this.evicted;
  }
}
