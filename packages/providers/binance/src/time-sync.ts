/**
 * `BinanceServerTimeSync` — keeps a signed-request timestamp aligned with Binance's server clock.
 * Binance rejects signed requests whose timestamp drifts outside `recvWindow`, so the provider tracks
 * `offset = serverTime - localClock` and stamps requests with `localClock + offset`. The local clock is
 * INJECTED (never `Date.now()` ambiently) so the component is deterministic and testable, and the
 * server-time fetch is passed in per call to avoid a construction-time cycle with the REST client.
 */
export interface BinanceServerTimeSyncDeps {
  readonly clock: () => number;
  readonly ttlMs: number;
}

/** Fetches the venue server time (epoch ms). */
export type ServerTimeFetcher = () => Promise<{ readonly serverTime: number }>;

export class BinanceServerTimeSync {
  private offsetMs = 0;
  private lastSyncAt = Number.NEGATIVE_INFINITY;
  private readonly clock: () => number;
  private readonly ttlMs: number;

  constructor(deps: BinanceServerTimeSyncDeps) {
    this.clock = deps.clock;
    this.ttlMs = deps.ttlMs;
  }

  /** The current server-aligned timestamp (epoch ms). */
  now(): number {
    return this.clock() + this.offsetMs;
  }

  /** The current clock offset (server − local), in ms. */
  get offset(): number {
    return this.offsetMs;
  }

  /** Whether the last sync is still within TTL. */
  isFresh(): boolean {
    return this.clock() - this.lastSyncAt < this.ttlMs;
  }

  /** Force a re-sync from the venue, updating the offset. Returns the measured offset. */
  async sync(fetch: ServerTimeFetcher): Promise<number> {
    const before = this.clock();
    const { serverTime } = await fetch();
    // Account for round-trip by using the local time midpoint of the request window.
    const after = this.clock();
    const localMid = before + Math.floor((after - before) / 2);
    this.offsetMs = serverTime - localMid;
    this.lastSyncAt = after;
    return this.offsetMs;
  }

  /** Re-sync only if the offset has gone stale. */
  async ensureFresh(fetch: ServerTimeFetcher): Promise<void> {
    if (!this.isFresh()) await this.sync(fetch);
  }
}
