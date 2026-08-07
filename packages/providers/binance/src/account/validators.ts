/**
 * `BalanceValidator`, `PositionValidator` and `AccountValidator` — deterministic structural validation
 * of canonical account data (snapshots and the maintained state). They return the list of issues found
 * (empty ⇒ valid) so the synchronizer can decide whether to accept a snapshot, flag DEGRADED, or
 * trigger recovery. The system prefers rejecting suspicious data over silently accepting it. Pure; no
 * IO.
 */
import {
  balanceTotal,
  type AccountBalance,
  type AccountPosition,
  type AccountState,
} from './canonical';

export class BalanceValidator {
  /** Issues with a single balance (negative free/locked, missing asset). */
  validate(balance: AccountBalance): readonly string[] {
    const issues: string[] = [];
    if (!balance.asset) issues.push('balance has no asset.');
    if (balance.free < 0) issues.push(`${balance.asset}: negative free balance.`);
    if (balance.locked < 0) issues.push(`${balance.asset}: negative locked balance.`);
    return issues;
  }

  /** Issues across a balance set (duplicates, invalid entries). */
  validateSet(balances: readonly AccountBalance[]): readonly string[] {
    const issues: string[] = [];
    const seen = new Set<string>();
    for (const balance of balances) {
      if (seen.has(balance.asset)) issues.push(`duplicate balance asset ${balance.asset}.`);
      seen.add(balance.asset);
      issues.push(...this.validate(balance));
    }
    return issues;
  }
}

export class PositionValidator {
  validate(position: AccountPosition): readonly string[] {
    const issues: string[] = [];
    if (!position.venueSymbol) issues.push('position has no symbol.');
    if (position.entryPrice < 0) issues.push(`${position.venueSymbol}: negative entry price.`);
    return issues;
  }

  validateSet(positions: readonly AccountPosition[]): readonly string[] {
    return positions.flatMap((p) => this.validate(p));
  }
}

export class AccountValidator {
  private readonly balances = new BalanceValidator();
  private readonly positions = new PositionValidator();

  /** Non-fatal consistency: totals are non-negative for each balance. */
  validateState(state: AccountState): readonly string[] {
    const issues = [
      ...this.balances.validateSet(state.balances),
      ...this.positions.validateSet(state.positions),
    ];
    for (const balance of state.balances)
      if (balanceTotal(balance) < 0) issues.push(`${balance.asset}: negative total balance.`);
    return issues;
  }

  isValid(state: AccountState): boolean {
    return this.validateState(state).length === 0;
  }
}
