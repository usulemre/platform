/**
 * `RetryDecision` and `RetryDecisionEngine` — the deterministic core that answers "given this policy,
 * this attempt and this outcome, do we retry, and after what delay?". It applies the policy's status/
 * category rules and any custom conditions, enforces the maximum retry count, and computes the backoff
 * delay. Pure: given the same inputs (including the injected random for jitter) it always returns the
 * same decision.
 */
import {
  classifyOutcome,
  type RetryCategory,
  type RetryClassification,
  type RetryOutcome,
} from './classify';
import type { Random } from './backoff';
import type { RetryContext } from './context';
import type { RetryPolicy } from './policy';

export interface RetryDecision {
  readonly shouldRetry: boolean;
  readonly reason: string;
  readonly category: RetryCategory;
  readonly status?: number;
  /** The 0-based index of the attempt just completed. */
  readonly attempt: number;
  /** The delay (ms) before the next attempt; 0 when not retrying. */
  readonly delayMs: number;
}

function defaultRetryable(policy: RetryPolicy, classification: RetryClassification): boolean {
  switch (classification.category) {
    case 'success':
    case 'aborted':
    case 'validation':
    case 'parse':
      return false;
    case 'network':
      return policy.retryOnNetworkError;
    case 'timeout':
      return policy.retryOnTimeout;
    default:
      if (classification.status === undefined) return false;
      return (
        policy.retryableStatuses.includes(classification.status) &&
        !policy.nonRetryableStatuses.includes(classification.status)
      );
  }
}

export class RetryDecisionEngine {
  /** Decide whether to retry after an attempt, and the backoff delay if so. */
  decide(
    policy: RetryPolicy,
    context: RetryContext,
    outcome: RetryOutcome,
    random: Random,
  ): RetryDecision {
    const classification = classifyOutcome(outcome);
    const base = {
      category: classification.category,
      status: classification.status,
      attempt: context.attempt,
      delayMs: 0,
    } as const;

    if (classification.category === 'success')
      return { ...base, shouldRetry: false, reason: 'success' };

    let retryable = defaultRetryable(policy, classification);
    for (const condition of policy.conditions) {
      const verdict = condition(outcome, classification, context);
      if (verdict !== undefined) {
        retryable = verdict;
        break;
      }
    }

    if (!retryable)
      return { ...base, shouldRetry: false, reason: `non-retryable:${classification.category}` };
    if (context.attempt >= policy.maxRetries)
      return { ...base, shouldRetry: false, reason: 'exhausted' };

    let delayMs = policy.backoff.delay(context.attempt + 1, context.previousDelayMs, random);
    if (policy.maxDelayMs !== undefined) delayMs = Math.min(delayMs, policy.maxDelayMs);
    return { ...base, shouldRetry: true, reason: `retry:${classification.category}`, delayMs };
  }
}
