/**
 * `ReconnectEngine` — computes the delay before each reconnect attempt using exponential backoff with
 * optional jitter (reusing the Retry & Timeout Engine's backoff primitives), and enforces a maximum
 * attempt count. Deterministic: jitter draws from an injected `random`. It computes *when* to retry;
 * the client uses the `Scheduler` to actually wait.
 */
import {
  ExponentialBackoff,
  withJitter,
  type BackoffStrategy,
  type Random,
} from '@platform/http-client';

export interface ReconnectPolicy {
  /** Maximum reconnect attempts before giving up (0 = unlimited). */
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly factor: number;
  readonly jitter: 'none' | 'full' | 'equal';
}

export interface ReconnectPlan {
  readonly attempt: number;
  readonly delayMs: number;
}

export function createReconnectPolicy(init: Partial<ReconnectPolicy> = {}): ReconnectPolicy {
  return {
    maxAttempts: init.maxAttempts ?? 0,
    baseDelayMs: init.baseDelayMs ?? 500,
    maxDelayMs: init.maxDelayMs ?? 30_000,
    factor: init.factor ?? 2,
    jitter: init.jitter ?? 'equal',
  };
}

export class ReconnectEngine {
  private readonly backoff: BackoffStrategy;
  private attemptCount = 0;
  private previousDelayMs = 0;

  constructor(
    private readonly policy: ReconnectPolicy,
    private readonly random: Random,
  ) {
    this.backoff = withJitter(
      new ExponentialBackoff(policy.baseDelayMs, policy.factor, policy.maxDelayMs),
      policy.jitter,
    );
  }

  get attempts(): number {
    return this.attemptCount;
  }

  /** Reset the attempt counter after a successful reconnect. */
  reset(): void {
    this.attemptCount = 0;
    this.previousDelayMs = 0;
  }

  /** The plan for the next attempt, or `null` when the budget is exhausted. */
  next(): ReconnectPlan | null {
    this.attemptCount += 1;
    if (this.policy.maxAttempts > 0 && this.attemptCount > this.policy.maxAttempts) return null;
    const delayMs = this.backoff.delay(this.attemptCount, this.previousDelayMs, this.random);
    this.previousDelayMs = delayMs;
    return { attempt: this.attemptCount, delayMs };
  }
}
