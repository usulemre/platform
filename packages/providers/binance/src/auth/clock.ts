/**
 * `ClockSynchronizer` and `ServerTimeSynchronizer` — the timestamp authority for authenticated
 * requests. Binance rejects signed requests whose timestamp drifts outside `recvWindow`, so signing
 * must use a server-aligned clock. Both classes wrap the reused {@link BinanceServerTimeSync} (which
 * tracks `offset = serverTime - localClock` via a round-trip midpoint): `ServerTimeSynchronizer`
 * orchestrates fetching the server time from an injected source; `ClockSynchronizer` is the pure
 * drift/timestamp authority read by the signer. The local clock is INJECTED — never wall-clock
 * ambiently — so behaviour is deterministic.
 */
import { BinanceServerTimeSync, type ServerTimeFetcher } from '../time-sync';

/** The pure clock-drift / timestamp authority. */
export class ClockSynchronizer {
  constructor(private readonly sync: BinanceServerTimeSync) {}

  /** The current server-aligned timestamp (epoch ms) to stamp on signed requests. */
  timestamp(): number {
    return this.sync.now();
  }

  /** The measured clock offset (server − local), in ms. */
  get driftMs(): number {
    return this.sync.offset;
  }

  /** Whether the last synchronization is still fresh. */
  isFresh(): boolean {
    return this.sync.isFresh();
  }

  /** Whether the measured drift exceeds a threshold (advisory). */
  isDrifting(thresholdMs: number): boolean {
    return Math.abs(this.sync.offset) > thresholdMs;
  }
}

export interface ServerTimeSynchronizerDeps {
  readonly clock: () => number;
  readonly source: ServerTimeFetcher;
  /** Validity window (ms) before the offset is re-fetched. */
  readonly ttlMs: number;
}

/** Orchestrates server-time synchronization against a fetch source. */
export class ServerTimeSynchronizer {
  private readonly sync: BinanceServerTimeSync;
  private readonly source: ServerTimeFetcher;
  readonly clock: ClockSynchronizer;

  constructor(deps: ServerTimeSynchronizerDeps) {
    this.sync = new BinanceServerTimeSync({ clock: deps.clock, ttlMs: deps.ttlMs });
    this.source = deps.source;
    this.clock = new ClockSynchronizer(this.sync);
  }

  /** Force a re-sync from the venue; returns the measured offset (ms). */
  async synchronize(): Promise<number> {
    return this.sync.sync(this.source);
  }

  /** Re-sync only if the offset has gone stale. */
  async ensureFresh(): Promise<void> {
    await this.sync.ensureFresh(this.source);
  }

  /** The current server-aligned timestamp. */
  now(): number {
    return this.sync.now();
  }

  /** The current clock offset (server − local), in ms. */
  get offsetMs(): number {
    return this.sync.offset;
  }
}
