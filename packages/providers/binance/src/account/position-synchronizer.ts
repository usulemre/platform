/**
 * `BinancePositionSynchronizer` — maintains the canonical open-position set for one Futures account: it
 * is loaded wholesale from a REST `positionRisk` snapshot and updated incrementally by `ACCOUNT_UPDATE`
 * position lines. Positions are keyed by venue symbol + position side (hedge mode supports LONG/SHORT
 * per symbol); a flat position (zero amount) is removed. It emits an immutable, symbol-sorted view on
 * demand (thread-safe by copy-out). Spot accounts have no positions, so the set stays empty. Ordering /
 * de-duplication is handled upstream by the {@link EventProcessor}.
 */
import type { AccountPosition } from './canonical';

function key(venueSymbol: string, positionSide: string): string {
  return `${venueSymbol.toUpperCase()}:${positionSide.toUpperCase()}`;
}

export class BinancePositionSynchronizer {
  private readonly positions = new Map<string, AccountPosition>();

  /** Replace the whole position set from a snapshot (flat positions dropped). */
  load(positions: readonly AccountPosition[]): void {
    this.positions.clear();
    for (const position of positions)
      if (position.positionAmount !== 0)
        this.positions.set(key(position.venueSymbol, position.positionSide), position);
  }

  /** Upsert a position; a flat (zero-amount) position is removed. */
  upsert(position: AccountPosition): void {
    const id = key(position.venueSymbol, position.positionSide);
    if (position.positionAmount === 0) this.positions.delete(id);
    else this.positions.set(id, position);
  }

  applyPositions(positions: readonly AccountPosition[]): void {
    for (const position of positions) this.upsert(position);
  }

  get(venueSymbol: string, positionSide = 'BOTH'): AccountPosition | undefined {
    return this.positions.get(key(venueSymbol, positionSide));
  }

  all(): readonly AccountPosition[] {
    return [...this.positions.values()].sort((a, b) => a.venueSymbol.localeCompare(b.venueSymbol));
  }

  get size(): number {
    return this.positions.size;
  }

  reset(): void {
    this.positions.clear();
  }
}
