/**
 * `CircuitMetrics` — a deterministic, in-memory counter set for a single circuit breaker: permitted vs
 * rejected (short-circuited) calls, recorded successes/failures/ignored outcomes, how many times the
 * circuit opened, and how many state transitions occurred. Snapshots are plain, immutable data for the
 * Monitoring Module. No IO.
 */
import type { CircuitState } from './state';

export interface CircuitMetricsSnapshot {
  readonly state: CircuitState;
  readonly permittedCalls: number;
  readonly rejectedCalls: number;
  readonly totalCalls: number;
  readonly successes: number;
  readonly failures: number;
  readonly ignored: number;
  readonly timesOpened: number;
  readonly stateTransitions: number;
}

export class CircuitMetrics {
  private permittedCalls = 0;
  private rejectedCalls = 0;
  private successes = 0;
  private failures = 0;
  private ignored = 0;
  private timesOpened = 0;
  private stateTransitions = 0;

  onPermitted(): void {
    this.permittedCalls += 1;
  }
  onRejected(): void {
    this.rejectedCalls += 1;
  }
  onSuccess(): void {
    this.successes += 1;
  }
  onFailure(): void {
    this.failures += 1;
  }
  onIgnored(): void {
    this.ignored += 1;
  }
  onOpen(): void {
    this.timesOpened += 1;
  }
  onTransition(): void {
    this.stateTransitions += 1;
  }

  snapshot(state: CircuitState): CircuitMetricsSnapshot {
    return {
      state,
      permittedCalls: this.permittedCalls,
      rejectedCalls: this.rejectedCalls,
      totalCalls: this.permittedCalls + this.rejectedCalls,
      successes: this.successes,
      failures: this.failures,
      ignored: this.ignored,
      timesOpened: this.timesOpened,
      stateTransitions: this.stateTransitions,
    };
  }

  reset(): void {
    this.permittedCalls = 0;
    this.rejectedCalls = 0;
    this.successes = 0;
    this.failures = 0;
    this.ignored = 0;
    this.timesOpened = 0;
    this.stateTransitions = 0;
  }
}
