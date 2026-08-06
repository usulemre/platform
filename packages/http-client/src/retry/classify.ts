/**
 * Outcome classification — maps a completed attempt (a response or a typed error) to a stable
 * `RetryCategory`. This is pure vocabulary: it says *what happened*, not *whether to retry* (that is
 * the policy's job in `decision.ts`). Provider-independent — no provider-specific status handling.
 */
import {
  HttpAbortError,
  HttpParseError,
  HttpSerializationError,
  HttpTimeoutError,
  HttpTransportError,
  HttpValidationError,
  type HttpError,
} from '../errors';
import { isSuccess } from '../status';
import type { HttpResponse } from '../response';

/** The outcome of a single attempt. */
export type RetryOutcome<T = unknown> =
  | { readonly response: HttpResponse<T>; readonly error?: undefined }
  | { readonly response?: undefined; readonly error: HttpError };

export type RetryCategory =
  | 'success'
  | 'network'
  | 'timeout'
  | 'rate-limit'
  | 'server'
  | 'client'
  | 'redirect'
  | 'validation'
  | 'aborted'
  | 'parse'
  | 'other';

export interface RetryClassification {
  readonly category: RetryCategory;
  readonly status?: number;
  /** Whether the category is *inherently* transient (before the policy's own status rules). */
  readonly transient: boolean;
}

/** The default statuses commonly treated as transient (rate-limit + temporary server errors). */
export const DEFAULT_RETRYABLE_STATUSES: readonly number[] = [429, 500, 502, 503, 504];
/** The statuses that MUST NOT be retried. */
export const DEFAULT_NON_RETRYABLE_STATUSES: readonly number[] = [400, 401, 403, 404];

function classifyStatus(status: number): RetryClassification {
  if (isSuccess(status)) return { category: 'success', status, transient: false };
  if (status === 429) return { category: 'rate-limit', status, transient: true };
  if (status >= 500 && status < 600) return { category: 'server', status, transient: true };
  if (status >= 400 && status < 500) return { category: 'client', status, transient: false };
  if (status >= 300 && status < 400) return { category: 'redirect', status, transient: false };
  return { category: 'other', status, transient: false };
}

/** Classify an outcome into a category (and status, if any). */
export function classifyOutcome(outcome: RetryOutcome): RetryClassification {
  if (outcome.response) return classifyStatus(outcome.response.status);
  const error = outcome.error;
  if (error instanceof HttpTimeoutError) return { category: 'timeout', transient: true };
  if (error instanceof HttpTransportError) return { category: 'network', transient: true };
  if (error instanceof HttpAbortError) return { category: 'aborted', transient: false };
  if (error instanceof HttpValidationError) return { category: 'validation', transient: false };
  if (error instanceof HttpParseError || error instanceof HttpSerializationError)
    return { category: 'parse', status: (error as HttpParseError).status, transient: false };
  return { category: 'other', transient: false };
}
