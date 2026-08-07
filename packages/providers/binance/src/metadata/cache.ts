/**
 * `ExchangeMetadataCache` — a TTL-bounded holder for the latest canonical {@link ExchangeMetadata}
 * snapshot. The clock is INJECTED so freshness is deterministic; snapshots are replaced wholesale
 * (immutable), never mutated in place, so a reader always sees a consistent snapshot.
 */
import type { ExchangeMetadata } from './types';

export interface ExchangeMetadataCacheDeps {
  readonly clock: () => number;
  readonly ttlMs: number;
}

export class ExchangeMetadataCache {
  private snapshot?: ExchangeMetadata;
  private storedAt = Number.NEGATIVE_INFINITY;
  private readonly clock: () => number;
  private readonly ttlMs: number;

  constructor(deps: ExchangeMetadataCacheDeps) {
    this.clock = deps.clock;
    this.ttlMs = deps.ttlMs;
  }

  /** Whether a non-stale snapshot is held. */
  isFresh(): boolean {
    return this.snapshot !== undefined && this.clock() - this.storedAt < this.ttlMs;
  }

  /** The current snapshot (may be stale; check {@link isFresh}). */
  get(): ExchangeMetadata | undefined {
    return this.snapshot;
  }

  /** Replace the cached snapshot and reset its freshness clock. */
  set(metadata: ExchangeMetadata): void {
    this.snapshot = metadata;
    this.storedAt = this.clock();
  }

  /** Age of the current snapshot in ms (Infinity when empty). */
  ageMs(): number {
    return this.snapshot ? this.clock() - this.storedAt : Number.POSITIVE_INFINITY;
  }

  /** Drop the cached snapshot. */
  clear(): void {
    this.snapshot = undefined;
    this.storedAt = Number.NEGATIVE_INFINITY;
  }
}
