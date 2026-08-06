/**
 * `HealthEvaluator` — the pure decision "given the current window statistics and the policy, is the
 * provider unhealthy enough to open the circuit?". A circuit opens when the minimum throughput is met
 * and either the absolute failure count reaches `failureThreshold` or the failure rate reaches
 * `failureRateThreshold`. Deterministic — no state, no IO.
 */
import type { CircuitPolicy } from './policy';
import type { FailureTracker } from './trackers';

export interface HealthSnapshot {
  readonly total: number;
  readonly failures: number;
  readonly failureRate: number;
  readonly healthy: boolean;
  readonly reason: string;
}

export class HealthEvaluator {
  /** Whether the circuit should open given the current failure statistics. */
  shouldOpen(tracker: FailureTracker, policy: CircuitPolicy, now: number): boolean {
    const total = tracker.total(now);
    if (total < policy.minimumThroughput) return false;
    if (tracker.failures(now) >= policy.failureThreshold) return true;
    if (
      policy.failureRateThreshold !== undefined &&
      tracker.failureRate(now) >= policy.failureRateThreshold
    )
      return true;
    return false;
  }

  evaluate(tracker: FailureTracker, policy: CircuitPolicy, now: number): HealthSnapshot {
    const total = tracker.total(now);
    const failures = tracker.failures(now);
    const failureRate = tracker.failureRate(now);
    const healthy = !this.shouldOpen(tracker, policy, now);
    const reason =
      total < policy.minimumThroughput
        ? 'below-minimum-throughput'
        : healthy
          ? 'healthy'
          : 'unhealthy';
    return { total, failures, failureRate, healthy, reason };
  }
}
