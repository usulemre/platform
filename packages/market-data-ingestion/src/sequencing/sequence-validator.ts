/**
 * The **sequence validator** — tracks the last accepted sequence number per logical stream and
 * classifies each new event as the first, in-order, a duplicate, out-of-order, or in-order-with-a-gap.
 * For streams declared *contiguous* (order-book diff-depth), an in-order event whose sequence is not
 * exactly `last + 1` is flagged as a gap so the caller can trigger recovery. For merely monotonic
 * streams (trades, candles) a gap is reported informationally but does not block the event.
 * Deterministic; per-stream state only.
 */
import { detectGap } from './gap-detector';

export type SequenceStatus = 'first' | 'in_order' | 'duplicate' | 'out_of_order' | 'gap';

export interface SequenceCheck {
  readonly status: SequenceStatus;
  readonly streamKey: string;
  readonly received: number;
  readonly expected?: number;
  /** Number of missing sequence numbers when `status === 'gap'`. */
  readonly missing?: number;
}

export class SequenceValidator {
  private readonly last = new Map<string, number>();

  /** The last accepted sequence for a stream, or `undefined` if untracked. */
  peek(streamKey: string): number | undefined {
    return this.last.get(streamKey);
  }

  /** Seed/override the last sequence for a stream (e.g. after an order-book resync). */
  seed(streamKey: string, sequence: number): void {
    this.last.set(streamKey, sequence);
  }

  /** Forget a stream's sequence state (forces the next event to be treated as first). */
  reset(streamKey: string): void {
    this.last.delete(streamKey);
  }

  /**
   * Classify `sequence` for `streamKey`. When `contiguous` is true, in-order events must advance by
   * exactly `step` or they are reported as a gap. The tracked sequence advances only for accepted
   * forward progress (first / in_order / gap); duplicates and out-of-order events leave it unchanged.
   */
  classify(
    streamKey: string,
    sequence: number,
    options: { readonly contiguous?: boolean; readonly step?: number } = {},
  ): SequenceCheck {
    const last = this.last.get(streamKey);
    if (last === undefined) {
      this.last.set(streamKey, sequence);
      return { status: 'first', streamKey, received: sequence };
    }
    if (sequence === last) {
      return { status: 'duplicate', streamKey, received: sequence, expected: last };
    }
    if (sequence < last) {
      return { status: 'out_of_order', streamKey, received: sequence, expected: last + 1 };
    }
    // sequence > last — forward progress.
    const gap = detectGap(last, sequence, options.step ?? 1);
    this.last.set(streamKey, sequence);
    if (!gap.contiguous && (options.contiguous || gap.missing > 0)) {
      return {
        status: 'gap',
        streamKey,
        received: sequence,
        expected: gap.expected,
        missing: gap.missing,
      };
    }
    return { status: 'in_order', streamKey, received: sequence, expected: gap.expected };
  }
}
