/**
 * Timestamp management. A `TimestampProvider` exposes the current time in the units auth schemes need
 * (milliseconds, seconds, ISO-8601). Time comes from an INJECTED clock, so signing that includes a
 * timestamp is deterministic and testable.
 */
export interface TimestampProvider {
  millis(): number;
  seconds(): number;
  iso(): string;
}

export class ClockTimestampProvider implements TimestampProvider {
  constructor(private readonly clock: () => number = Date.now) {}
  millis(): number {
    return this.clock();
  }
  seconds(): number {
    return Math.floor(this.clock() / 1000);
  }
  iso(): string {
    return new Date(this.clock()).toISOString();
  }
}
