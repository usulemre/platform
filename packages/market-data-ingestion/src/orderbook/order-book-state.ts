/**
 * `LocalOrderBook` — a canonical, maintained order-book state. Bids and asks are kept as
 * price→quantity maps; applying a level with quantity 0 removes that price (the standard diff-depth
 * convention). A snapshot view returns the top-N levels sorted best-first (bids descending, asks
 * ascending). Deterministic; no IO. This holds *state only* — sequence/gap decisions live in the
 * {@link OrderBookSynchronizer}.
 */
import type { OrderBookLevel } from '../events/canonical-events';

export class LocalOrderBook {
  private readonly bids = new Map<number, number>();
  private readonly asks = new Map<number, number>();
  private lastUpdateId = 0;

  /** Replace the entire book from a snapshot. */
  reset(
    bids: readonly OrderBookLevel[],
    asks: readonly OrderBookLevel[],
    lastUpdateId: number,
  ): void {
    this.bids.clear();
    this.asks.clear();
    for (const level of bids) if (level.quantity > 0) this.bids.set(level.price, level.quantity);
    for (const level of asks) if (level.quantity > 0) this.asks.set(level.price, level.quantity);
    this.lastUpdateId = lastUpdateId;
  }

  /** Apply one side of a diff (0 quantity deletes the level). */
  private applySide(side: Map<number, number>, levels: readonly OrderBookLevel[]): void {
    for (const level of levels) {
      if (level.quantity === 0) side.delete(level.price);
      else side.set(level.price, level.quantity);
    }
  }

  /** Apply a diff-depth delta and advance the tracked update id. */
  applyDelta(
    bids: readonly OrderBookLevel[],
    asks: readonly OrderBookLevel[],
    finalUpdateId: number,
  ): void {
    this.applySide(this.bids, bids);
    this.applySide(this.asks, asks);
    this.lastUpdateId = finalUpdateId;
  }

  get updateId(): number {
    return this.lastUpdateId;
  }

  /** The best (highest) bid price, or `undefined` when empty. */
  bestBid(): number | undefined {
    let best: number | undefined;
    for (const price of this.bids.keys()) if (best === undefined || price > best) best = price;
    return best;
  }

  /** The best (lowest) ask price, or `undefined` when empty. */
  bestAsk(): number | undefined {
    let best: number | undefined;
    for (const price of this.asks.keys()) if (best === undefined || price < best) best = price;
    return best;
  }

  /** Whether the book is crossed (best bid ≥ best ask) — an inconsistent state. */
  isCrossed(): boolean {
    const bid = this.bestBid();
    const ask = this.bestAsk();
    return bid !== undefined && ask !== undefined && bid >= ask;
  }

  /** A sorted top-N snapshot of the book. */
  snapshot(depth = Number.POSITIVE_INFINITY): {
    readonly bids: readonly OrderBookLevel[];
    readonly asks: readonly OrderBookLevel[];
    readonly lastUpdateId: number;
  } {
    const bids = [...this.bids.entries()]
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => b.price - a.price)
      .slice(0, depth);
    const asks = [...this.asks.entries()]
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => a.price - b.price)
      .slice(0, depth);
    return { bids, asks, lastUpdateId: this.lastUpdateId };
  }
}
