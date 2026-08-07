/**
 * The **gap detector** — a pure contiguity check over monotonic sequence numbers. Given the last
 * accepted sequence and the next received sequence, it reports whether the two are contiguous and, if
 * not, the size and range of the missing span. Used both for streams that are expected to be strictly
 * contiguous (order-book diff-depth: `next = last + 1`) and, informationally, for streams that are
 * merely monotonic (a jump in trade ids means we missed trades). No IO, no state.
 */

export interface GapResult {
  readonly contiguous: boolean;
  /** The sequence that was expected next (`last + step`). */
  readonly expected: number;
  readonly received: number;
  /** Number of missing sequence numbers (0 when contiguous). */
  readonly missing: number;
}

/** Detect a gap between `lastSequence` and `received`, with a contiguity `step` (default 1). */
export function detectGap(lastSequence: number, received: number, step = 1): GapResult {
  const expected = lastSequence + step;
  if (received === expected) {
    return { contiguous: true, expected, received, missing: 0 };
  }
  const missing = received > expected ? received - expected : 0;
  return { contiguous: false, expected, received, missing };
}
