/**
 * `StateReconciler` — reconciles the maintained account state against the authoritative REST snapshot.
 * `reconcile` replaces the maintained balances/positions with the snapshot (the snapshot is the source
 * of truth — the system prefers explicit snapshot recovery over silently trusting incremental drift).
 * `verify` compares a snapshot against the maintained state and reports mismatches (used by the
 * periodic consistency check). Deterministic; no IO.
 */
import {
  balanceTotal,
  type AccountBalance,
  type AccountPosition,
  type AccountState,
} from './canonical';
import type { BinanceBalanceSynchronizer } from './balance-synchronizer';
import type { BinancePositionSynchronizer } from './position-synchronizer';

export interface ConsistencyReport {
  readonly consistent: boolean;
  readonly balanceMismatches: readonly string[];
  readonly positionMismatches: readonly string[];
}

export class StateReconciler {
  constructor(private readonly tolerance = 1e-8) {}

  /** Replace the maintained state with the authoritative snapshot. */
  reconcile(
    balances: BinanceBalanceSynchronizer,
    positions: BinancePositionSynchronizer,
    snapshot: AccountState,
  ): void {
    balances.load(snapshot.balances);
    positions.load(snapshot.positions);
  }

  private balanceMap(balances: readonly AccountBalance[]): Map<string, AccountBalance> {
    return new Map(balances.map((b) => [b.asset, b] as const));
  }

  private positionKey(position: AccountPosition): string {
    return `${position.venueSymbol}:${position.positionSide}`;
  }

  /** Compare a snapshot against the maintained state; report every divergence beyond tolerance. */
  verify(
    snapshot: AccountState,
    maintained: {
      readonly balances: readonly AccountBalance[];
      readonly positions: readonly AccountPosition[];
    },
  ): ConsistencyReport {
    const balanceMismatches: string[] = [];
    const snapshotBalances = this.balanceMap(snapshot.balances);
    const maintainedBalances = this.balanceMap(maintained.balances);
    for (const asset of new Set([...snapshotBalances.keys(), ...maintainedBalances.keys()])) {
      const snap = snapshotBalances.get(asset);
      const kept = maintainedBalances.get(asset);
      if (!snap || !kept) {
        balanceMismatches.push(`${asset}: present in only one of snapshot/maintained.`);
        continue;
      }
      if (Math.abs(balanceTotal(snap) - balanceTotal(kept)) > this.tolerance)
        balanceMismatches.push(
          `${asset}: total differs (${balanceTotal(snap)} vs ${balanceTotal(kept)}).`,
        );
    }

    const positionMismatches: string[] = [];
    const snapshotPositions = new Map(
      snapshot.positions.map((p) => [this.positionKey(p), p] as const),
    );
    const maintainedPositions = new Map(
      maintained.positions.map((p) => [this.positionKey(p), p] as const),
    );
    for (const id of new Set([...snapshotPositions.keys(), ...maintainedPositions.keys()])) {
      const snap = snapshotPositions.get(id);
      const kept = maintainedPositions.get(id);
      if (!snap || !kept) {
        positionMismatches.push(`${id}: present in only one of snapshot/maintained.`);
        continue;
      }
      if (Math.abs(snap.positionAmount - kept.positionAmount) > this.tolerance)
        positionMismatches.push(
          `${id}: amount differs (${snap.positionAmount} vs ${kept.positionAmount}).`,
        );
    }

    return {
      consistent: balanceMismatches.length === 0 && positionMismatches.length === 0,
      balanceMismatches,
      positionMismatches,
    };
  }
}
