/**
 * `GapDetector` and `SequenceValidator` — the order-book sequence-integrity primitives, implementing
 * the officially-documented contiguity rules for diff-depth streams:
 *  - **Spot:** each new event's `U` (firstUpdateId) must equal the previous event's `u` (finalUpdateId)
 *    + 1.
 *  - **USDⓈ-M Futures:** each new event's `pu` (previousFinalUpdateId) must equal the previous event's
 *    `u`.
 * `GapDetector` is a pure check; `SequenceValidator` tracks the last final-update-id per symbol and
 * reports whether the next delta is contiguous (a gap means the local book must be re-synchronized).
 * Deterministic; no IO.
 */
import type { BinanceMarket } from '../constants';
import type { OrderBookDelta } from './events';

export interface GapResult {
  readonly contiguous: boolean;
  readonly expected: number;
  readonly received: number;
}

export class GapDetector {
  constructor(private readonly market: BinanceMarket) {}

  /** Whether `delta` contiguously follows a book whose last final-update-id is `previousFinalId`. */
  detect(previousFinalId: number, delta: OrderBookDelta): GapResult {
    if (this.market === 'FUTURES') {
      const received = delta.previousFinalUpdateId ?? Number.NaN;
      return { contiguous: received === previousFinalId, expected: previousFinalId, received };
    }
    const expected = previousFinalId + 1;
    return {
      contiguous: delta.firstUpdateId === expected,
      expected,
      received: delta.firstUpdateId,
    };
  }
}

export class SequenceValidator {
  private readonly lastFinalId = new Map<string, number>();
  private readonly detector: GapDetector;

  constructor(private readonly market: BinanceMarket) {
    this.detector = new GapDetector(market);
  }

  /** Seed the last final-update-id for a symbol (from a fresh REST snapshot). */
  set(venueSymbol: string, finalUpdateId: number): void {
    this.lastFinalId.set(venueSymbol, finalUpdateId);
  }

  /** The last recorded final-update-id, or undefined if the symbol is not tracked. */
  get(venueSymbol: string): number | undefined {
    return this.lastFinalId.get(venueSymbol);
  }

  reset(venueSymbol: string): void {
    this.lastFinalId.delete(venueSymbol);
  }

  /**
   * Validate the next live delta against the tracked sequence. On success the tracked id advances to
   * the delta's final id; on a gap the tracked id is left unchanged so the caller can re-synchronize.
   */
  validateNext(delta: OrderBookDelta): GapResult {
    const previous = this.lastFinalId.get(delta.venueSymbol);
    if (previous === undefined)
      return { contiguous: false, expected: Number.NaN, received: delta.firstUpdateId };
    const result = this.detector.detect(previous, delta);
    if (result.contiguous) this.lastFinalId.set(delta.venueSymbol, delta.finalUpdateId);
    return result;
  }

  /**
   * Whether a buffered delta is stale relative to a fresh snapshot (should be dropped). Spot drops
   * `u <= snapshotLastUpdateId`; Futures drops `u < snapshotLastUpdateId`.
   */
  isStale(delta: OrderBookDelta, snapshotLastUpdateId: number): boolean {
    return this.market === 'FUTURES'
      ? delta.finalUpdateId < snapshotLastUpdateId
      : delta.finalUpdateId <= snapshotLastUpdateId;
  }

  /**
   * Whether a delta is the valid first delta to apply on top of a fresh snapshot. Spot requires
   * `U <= L+1 <= u`; Futures requires `U <= L <= u` (L = snapshot last-update-id).
   */
  isFirstValid(delta: OrderBookDelta, snapshotLastUpdateId: number): boolean {
    const target = this.market === 'FUTURES' ? snapshotLastUpdateId : snapshotLastUpdateId + 1;
    return delta.firstUpdateId <= target && target <= delta.finalUpdateId;
  }
}
