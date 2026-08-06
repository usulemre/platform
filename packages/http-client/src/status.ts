/**
 * HTTP status codes and classification helpers. Pure vocabulary; the client never *decides* anything
 * from a status (no retry, no throwing on non-2xx) — it only exposes these helpers to callers.
 */

/** Named HTTP status codes commonly used by REST APIs. */
export const HttpStatus = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export type HttpStatusCategory =
  | 'informational'
  | 'success'
  | 'redirect'
  | 'clientError'
  | 'serverError'
  | 'unknown';

/** Classify a status code into its RFC category. */
export function statusCategory(status: number): HttpStatusCategory {
  if (status >= 100 && status < 200) return 'informational';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'clientError';
  if (status >= 500 && status < 600) return 'serverError';
  return 'unknown';
}

export function isInformational(status: number): boolean {
  return statusCategory(status) === 'informational';
}
export function isSuccess(status: number): boolean {
  return statusCategory(status) === 'success';
}
export function isRedirect(status: number): boolean {
  return statusCategory(status) === 'redirect';
}
export function isClientError(status: number): boolean {
  return statusCategory(status) === 'clientError';
}
export function isServerError(status: number): boolean {
  return statusCategory(status) === 'serverError';
}
export function isError(status: number): boolean {
  return status >= 400;
}
