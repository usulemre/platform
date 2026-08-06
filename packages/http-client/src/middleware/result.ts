/**
 * `MiddlewareResult` — the typed, discriminated outcome that flows *back* through the pipeline. A
 * middleware (or the terminal send) yields either a `response` or an `error`; error middleware inspect
 * an `error` result and may recover it into a `response`. Modelling the outcome as data (rather than a
 * thrown exception) is what makes error interception and short-circuiting deterministic and testable.
 */
import type { HttpError } from '../errors';
import type { HttpResponse } from '../response';

export type MiddlewareResult<T = unknown> =
  | { readonly kind: 'response'; readonly response: HttpResponse<T> }
  | { readonly kind: 'error'; readonly error: HttpError };

/** Constructors for the two result variants. */
export const MiddlewareResult = {
  response<T = unknown>(response: HttpResponse<T>): MiddlewareResult<T> {
    return { kind: 'response', response };
  },
  error(error: HttpError): MiddlewareResult<never> {
    return { kind: 'error', error };
  },
} as const;

export function isResponseResult<T>(
  result: MiddlewareResult<T>,
): result is { kind: 'response'; response: HttpResponse<T> } {
  return result.kind === 'response';
}
export function isErrorResult<T>(
  result: MiddlewareResult<T>,
): result is { kind: 'error'; error: HttpError } {
  return result.kind === 'error';
}

/** Return the response, or throw the error — the pipeline's boundary conversion back to a promise. */
export function unwrapResult<T>(result: MiddlewareResult<T>): HttpResponse<T> {
  if (result.kind === 'error') throw result.error;
  return result.response;
}
