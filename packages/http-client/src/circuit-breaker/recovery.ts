/**
 * `RecoveryManager` — the pure timing rules for automatic recovery. When a circuit is OPEN it stays
 * open until `recoveryTimeoutMs` has elapsed since it opened; the next permitted call then probes the
 * provider via HALF_OPEN. Deterministic — the current time is always supplied by the caller.
 */
import type { CircuitPolicy } from './policy';

export class RecoveryManager {
  /** Whether enough time has elapsed since `openedAt` to attempt a recovery probe. */
  isRecoveryDue(openedAt: number, now: number, policy: CircuitPolicy): boolean {
    return now - openedAt >= policy.recoveryTimeoutMs;
  }

  /** The earliest time a recovery probe may be attempted. */
  nextAttemptAt(openedAt: number, policy: CircuitPolicy): number {
    return openedAt + policy.recoveryTimeoutMs;
  }

  /** Milliseconds remaining until a recovery probe is due (0 once due). */
  remainingMs(openedAt: number, now: number, policy: CircuitPolicy): number {
    return Math.max(0, this.nextAttemptAt(openedAt, policy) - now);
  }
}
