/**
 * `RetryContext` — the immutable state propagated across retry attempts of a single logical request.
 * It carries the correlation id, the policy in force, the current 0-based attempt index and the
 * previous delay (needed by decorrelated jitter). Every transition returns a new context; nothing is
 * mutated in place.
 */
import type { RetryCategory } from './classify';

export interface RetryContext {
  readonly requestId: string;
  readonly policyName: string;
  /** The 0-based index of the attempt about to run (0 = first try). */
  readonly attempt: number;
  /** The maximum number of retries permitted (attempts = maxRetries + 1). */
  readonly maxRetries: number;
  readonly startedAt: number;
  /** The delay chosen before the current attempt (0 for the first). */
  readonly previousDelayMs: number;
}

export function createRetryContext(params: {
  readonly requestId: string;
  readonly policyName: string;
  readonly maxRetries: number;
  readonly startedAt: number;
}): RetryContext {
  return {
    requestId: params.requestId,
    policyName: params.policyName,
    attempt: 0,
    maxRetries: params.maxRetries,
    startedAt: params.startedAt,
    previousDelayMs: 0,
  };
}

/** Advance the context to the next attempt, recording the delay just applied. */
export function advanceRetryContext(context: RetryContext, appliedDelayMs: number): RetryContext {
  return { ...context, attempt: context.attempt + 1, previousDelayMs: appliedDelayMs };
}

/** A single recorded attempt (an entry of the retry history). */
export interface RetryAttemptRecord {
  /** The 1-based attempt number. */
  readonly attempt: number;
  readonly category: RetryCategory;
  readonly status?: number;
  readonly retried: boolean;
  /** The backoff delay applied after this attempt before the next (0 if none). */
  readonly delayMs: number;
  /** How long the attempt itself took. */
  readonly durationMs: number;
  readonly at: number;
  readonly reason: string;
}
