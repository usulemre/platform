/**
 * `AccountSnapshotManager` — retrieves and caches the authoritative account snapshot (metadata +
 * balances + positions) from REST, via the {@link BinanceAccountService}. It is the source of truth
 * used for initialization, periodic consistency verification and recovery. The clock is injected so
 * freshness is deterministic; snapshots are immutable and replaced wholesale. It performs no
 * reconciliation itself — that is the reconciler's job.
 */
import type { BinanceAccountService } from './services';
import type { AccountSnapshot } from './canonical';

export interface AccountSnapshotManagerDeps {
  readonly service: BinanceAccountService;
  readonly clock: () => number;
  /** Freshness window (ms) for {@link isFresh}. */
  readonly ttlMs?: number;
}

export class AccountSnapshotManager {
  private snapshot?: AccountSnapshot;
  private readonly service: BinanceAccountService;
  private readonly clock: () => number;
  private readonly ttlMs: number;

  constructor(deps: AccountSnapshotManagerDeps) {
    this.service = deps.service;
    this.clock = deps.clock;
    this.ttlMs = deps.ttlMs ?? 60_000;
  }

  /** The most recent snapshot (undefined until first loaded). */
  current(): AccountSnapshot | undefined {
    return this.snapshot;
  }

  /** Whether the cached snapshot is within its freshness window. */
  isFresh(): boolean {
    return this.snapshot !== undefined && this.clock() - this.snapshot.loadedAt < this.ttlMs;
  }

  /** Age of the current snapshot in ms (Infinity when none). */
  ageMs(): number {
    return this.snapshot ? this.clock() - this.snapshot.loadedAt : Number.POSITIVE_INFINITY;
  }

  /** Force a fresh REST snapshot load. */
  async load(): Promise<AccountSnapshot> {
    const state = await this.service.getAccountState();
    const snapshot: AccountSnapshot = { state, loadedAt: this.clock() };
    this.snapshot = snapshot;
    return snapshot;
  }

  /** Load only when stale/absent. */
  async ensure(): Promise<AccountSnapshot> {
    return this.isFresh() && this.snapshot ? this.snapshot : this.load();
  }
}
