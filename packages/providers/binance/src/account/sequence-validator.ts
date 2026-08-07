/**
 * `SequenceValidator` — orders and de-duplicates incoming account events. Binance user-data account
 * events carry no explicit sequence number, but the stream delivers them in non-decreasing event-time
 * (`E`) order; this validator enforces that ordering and rejects duplicates and stale (out-of-order)
 * events. Genuinely *missing* events cannot be detected from event time alone — those are caught by the
 * synchronizer's periodic snapshot reconciliation. Deterministic; no IO. The system prefers rejecting a
 * suspicious event (and recovering by snapshot) over silently applying it.
 */
export type SequenceDecision = 'ok' | 'duplicate' | 'stale';

export interface SequenceInput {
  readonly eventTime: number;
  /** A stable key identifying the event within its event-time (e.g. `balance:BTC`). */
  readonly key: string;
}

export class SequenceValidator {
  private lastEventTime = Number.NEGATIVE_INFINITY;
  private readonly keysAtLast = new Set<string>();

  /** The last accepted event time (−Infinity before any). */
  get lastAccepted(): number {
    return this.lastEventTime;
  }

  /** Seed the last accepted event time (e.g. from a fresh snapshot's update time). */
  set(eventTime: number): void {
    if (eventTime > this.lastEventTime) {
      this.lastEventTime = eventTime;
      this.keysAtLast.clear();
    }
  }

  reset(): void {
    this.lastEventTime = Number.NEGATIVE_INFINITY;
    this.keysAtLast.clear();
  }

  /** Classify an event: accept in-order & unseen, reject duplicates and stale events. */
  check(input: SequenceInput): SequenceDecision {
    if (input.eventTime < this.lastEventTime) return 'stale';
    if (input.eventTime === this.lastEventTime) {
      if (this.keysAtLast.has(input.key)) return 'duplicate';
      this.keysAtLast.add(input.key);
      return 'ok';
    }
    this.lastEventTime = input.eventTime;
    this.keysAtLast.clear();
    this.keysAtLast.add(input.key);
    return 'ok';
  }
}
