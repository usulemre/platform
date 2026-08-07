/**
 * `BinanceBalanceSynchronizer` — maintains the canonical balance set for one account: it is loaded
 * wholesale from a REST snapshot and then updated incrementally by user-data events (an
 * `outboundAccountPosition`/`ACCOUNT_UPDATE` upserts changed balances; a `balanceUpdate` applies a
 * signed delta from a deposit/withdrawal/transfer). It maintains an internal price→balance map and
 * emits an immutable, asset-sorted view on demand (thread-safe by copy-out). It performs no ordering or
 * de-duplication itself — that is the {@link EventProcessor}'s responsibility.
 */
import { type AccountBalance } from './canonical';

export class BinanceBalanceSynchronizer {
  private readonly balances = new Map<string, AccountBalance>();

  /** Replace the whole balance set from a snapshot. */
  load(balances: readonly AccountBalance[]): void {
    this.balances.clear();
    for (const balance of balances) this.balances.set(balance.asset, balance);
  }

  /** Upsert a balance (from an account-update event), replacing free/locked for its asset. */
  upsert(balance: AccountBalance): void {
    this.balances.set(balance.asset, balance);
  }

  /** Upsert many balances (an account-update event's changed set). */
  applyAccountBalances(balances: readonly AccountBalance[]): void {
    for (const balance of balances) this.upsert(balance);
  }

  /**
   * Apply a signed balance delta (a Spot `balanceUpdate`) to an asset's free/total, creating the asset
   * if unseen. Locked is preserved (a transfer/deposit affects available funds).
   */
  applyDelta(asset: string, delta: number): void {
    const key = asset.toUpperCase();
    const existing = this.balances.get(key);
    const free = (existing?.free ?? 0) + delta;
    this.balances.set(key, { asset: key, free, locked: existing?.locked ?? 0 });
  }

  /** A single asset's balance. */
  get(asset: string): AccountBalance | undefined {
    return this.balances.get(asset.toUpperCase());
  }

  /** All balances, sorted by asset (immutable copy). */
  all(): readonly AccountBalance[] {
    return [...this.balances.values()].sort((a, b) => a.asset.localeCompare(b.asset));
  }

  get size(): number {
    return this.balances.size;
  }

  reset(): void {
    this.balances.clear();
  }
}
