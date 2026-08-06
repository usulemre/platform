/**
 * `RetryHistory` — the immutable, append-only record of every attempt of a single request. It is the
 * evidence trail behind a retry decision: how many attempts ran, why each was (not) retried, and how
 * long each took. Purely additive; a new instance is produced on each append.
 */
import type { RetryAttemptRecord } from './context';

export class RetryHistory {
  private readonly records: readonly RetryAttemptRecord[];

  constructor(records: readonly RetryAttemptRecord[] = []) {
    this.records = records;
  }

  /** Return a new history with `record` appended. */
  append(record: RetryAttemptRecord): RetryHistory {
    return new RetryHistory([...this.records, record]);
  }

  entries(): readonly RetryAttemptRecord[] {
    return this.records;
  }

  /** The number of attempts recorded. */
  get attempts(): number {
    return this.records.length;
  }

  /** The number of retries (attempts that led to another try). */
  get retries(): number {
    return this.records.filter((r) => r.retried).length;
  }

  /** The total backoff delay applied across the history. */
  get totalDelayMs(): number {
    return this.records.reduce((sum, r) => sum + r.delayMs, 0);
  }

  /** The total time spent inside attempts. */
  get totalDurationMs(): number {
    return this.records.reduce((sum, r) => sum + r.durationMs, 0);
  }

  last(): RetryAttemptRecord | undefined {
    return this.records[this.records.length - 1];
  }
}
