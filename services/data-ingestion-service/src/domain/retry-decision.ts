/**
 * Pure retry/dead-letter decision for a failed job. Deterministic, no IO, no
 * time access — the caller supplies the current attempt. Backs the Retry
 * Policies and Dead-Letter Queue capabilities.
 */
import { nextRetryDelayMs, shouldDeadLetter, type RetryPolicy } from '@platform/data-sdk';

export type RetryAction = 'RETRY' | 'DEAD_LETTER';

export interface RetryDecision {
  readonly action: RetryAction;
  readonly nextAttempt: number;
  readonly delayMs: number;
}

/**
 * Decide what happens to a job that has just failed on its `attempt`-th try.
 * If the retry budget is exhausted, dead-letter; otherwise schedule the next
 * attempt with an exponential-backoff delay.
 */
export function decideRetry(attempt: number, policy: RetryPolicy): RetryDecision {
  if (shouldDeadLetter(attempt, policy)) {
    return { action: 'DEAD_LETTER', nextAttempt: attempt, delayMs: 0 };
  }
  const nextAttempt = attempt + 1;
  return { action: 'RETRY', nextAttempt, delayMs: nextRetryDelayMs(nextAttempt, policy) };
}
