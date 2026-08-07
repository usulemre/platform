/**
 * `LocalOrderBook` — an in-memory local order book for one symbol, maintained by applying diff-depth
 * updates on top of a REST snapshot. Bids and asks are kept as price→quantity maps; a level with
 * quantity `0` is removed (per the documented rule). It produces an **immutable**, price-sorted
 * {@link OrderBookSnapshot} on demand (bids descending, asks ascending). Mutation happens only through
 * `load`/`applyDelta`; the emitted snapshot never aliases internal state (thread-safe by copy-out).
 */
import type { OrderBookDelta, OrderBookLevel, OrderBookSnapshot } from './events';

export class LocalOrderBook {
  private bids = new Map<number, number>();
  private asks = new Map<number, number>();
  private lastUpdateId = 0;

  constructor(
    readonly symbol: string,
    readonly venueSymbol: string,
  ) {}

  /** The current final-update-id applied to the book. */
  get updateId(): number {
    return this.lastUpdateId;
  }

  /** Replace the book wholesale from a REST snapshot. */
  load(snapshot: {
    lastUpdateId: number;
    bids: readonly OrderBookLevel[];
    asks: readonly OrderBookLevel[];
  }): void {
    this.bids = new Map();
    this.asks = new Map();
    for (const level of snapshot.bids)
      if (level.quantity > 0) this.bids.set(level.price, level.quantity);
    for (const level of snapshot.asks)
      if (level.quantity > 0) this.asks.set(level.price, level.quantity);
    this.lastUpdateId = snapshot.lastUpdateId;
  }

  private applySide(side: Map<number, number>, updates: readonly OrderBookLevel[]): void {
    for (const { price, quantity } of updates) {
      if (quantity <= 0) side.delete(price);
      else side.set(price, quantity);
    }
  }

  /** Apply a diff-depth delta, advancing the book's update id. */
  applyDelta(delta: OrderBookDelta): void {
    this.applySide(this.bids, delta.bids);
    this.applySide(this.asks, delta.asks);
    this.lastUpdateId = delta.finalUpdateId;
  }

  private sorted(side: Map<number, number>, descending: boolean, limit?: number): OrderBookLevel[] {
    const levels = [...side.entries()].map(([price, quantity]) => ({ price, quantity }));
    levels.sort((a, b) => (descending ? b.price - a.price : a.price - b.price));
    return limit !== undefined ? levels.slice(0, limit) : levels;
  }

  /** Best bid/ask prices (undefined when a side is empty). */
  bestBid(): number | undefined {
    return this.bids.size === 0 ? undefined : Math.max(...this.bids.keys());
  }
  bestAsk(): number | undefined {
    return this.asks.size === 0 ? undefined : Math.min(...this.asks.keys());
  }

  /** An immutable, price-sorted snapshot of the current book (optionally depth-limited). */
  snapshot(limit?: number, eventTime?: number): OrderBookSnapshot {
    return {
      kind: 'orderBookSnapshot',
      symbol: this.symbol,
      venueSymbol: this.venueSymbol,
      lastUpdateId: this.lastUpdateId,
      bids: this.sorted(this.bids, true, limit),
      asks: this.sorted(this.asks, false, limit),
      eventTime,
    };
  }
}
