/**
 * `RetryPolicy` — the immutable, declarative description of *when* and *how* to retry. It pairs the
 * retry classification rules (retryable/non-retryable statuses, network and timeout toggles, custom
 * conditions) with a maximum retry count and a backoff strategy. Policies are provider-independent
 * data; the decision is computed deterministically in `decision.ts`.
 */
import { ExponentialBackoff, withJitter, type BackoffStrategy } from './backoff';
import {
  DEFAULT_NON_RETRYABLE_STATUSES,
  DEFAULT_RETRYABLE_STATUSES,
  type RetryClassification,
  type RetryOutcome,
} from './classify';
import type { RetryContext } from './context';

/**
 * A custom retry rule. Returns `true` to force a retry, `false` to forbid it, or `undefined` to defer
 * to the policy's default status/category rules. The first condition returning a boolean wins.
 */
export type RetryCondition = (
  outcome: RetryOutcome,
  classification: RetryClassification,
  context: RetryContext,
) => boolean | undefined;

export interface RetryPolicy {
  readonly name: string;
  /** Maximum number of retries (total attempts = `maxRetries + 1`). */
  readonly maxRetries: number;
  readonly backoff: BackoffStrategy;
  /** Absolute cap applied to every computed backoff delay. */
  readonly maxDelayMs?: number;
  readonly retryableStatuses: readonly number[];
  readonly nonRetryableStatuses: readonly number[];
  readonly retryOnNetworkError: boolean;
  readonly retryOnTimeout: boolean;
  readonly conditions: readonly RetryCondition[];
}

export interface RetryPolicyInit {
  readonly name?: string;
  readonly maxRetries?: number;
  readonly backoff?: BackoffStrategy;
  readonly maxDelayMs?: number;
  readonly retryableStatuses?: readonly number[];
  readonly nonRetryableStatuses?: readonly number[];
  readonly retryOnNetworkError?: boolean;
  readonly retryOnTimeout?: boolean;
  readonly conditions?: readonly RetryCondition[];
}

/** The canonical default backoff: exponential (100ms base, ×2, 5s cap) with equal jitter. */
export function defaultBackoff(): BackoffStrategy {
  return withJitter(new ExponentialBackoff(100, 2, 5000), 'equal');
}

/** Build a retry policy from a partial specification, filling canonical defaults. */
export function createRetryPolicy(init: RetryPolicyInit = {}): RetryPolicy {
  return {
    name: init.name ?? 'default',
    maxRetries: init.maxRetries ?? 3,
    backoff: init.backoff ?? defaultBackoff(),
    maxDelayMs: init.maxDelayMs,
    retryableStatuses: init.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES,
    nonRetryableStatuses: init.nonRetryableStatuses ?? DEFAULT_NON_RETRYABLE_STATUSES,
    retryOnNetworkError: init.retryOnNetworkError ?? true,
    retryOnTimeout: init.retryOnTimeout ?? true,
    conditions: init.conditions ?? [],
  };
}

/** The canonical default retry policy (3 retries, jittered exponential backoff). */
export const DEFAULT_RETRY_POLICY: RetryPolicy = createRetryPolicy();

/** A policy that never retries. */
export const NO_RETRY_POLICY: RetryPolicy = createRetryPolicy({
  name: 'no-retry',
  maxRetries: 0,
  retryOnNetworkError: false,
  retryOnTimeout: false,
  retryableStatuses: [],
});

/* ------------------------------ reusable conditions ------------------------------ */

/** Retry only when the predicate holds (otherwise defer). */
export function retryWhen(
  predicate: (outcome: RetryOutcome, classification: RetryClassification) => boolean,
): RetryCondition {
  return (outcome, classification) => (predicate(outcome, classification) ? true : undefined);
}

/** Never retry when the predicate holds (otherwise defer). */
export function neverRetryWhen(
  predicate: (outcome: RetryOutcome, classification: RetryClassification) => boolean,
): RetryCondition {
  return (outcome, classification) => (predicate(outcome, classification) ? false : undefined);
}
