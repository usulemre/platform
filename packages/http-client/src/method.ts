/**
 * HTTP methods — the canonical request verbs and structural helpers. Pure vocabulary; no transport,
 * no provider logic.
 */

/** The supported HTTP request methods. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/** All supported methods, in canonical order. */
export const HTTP_METHODS: readonly HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

const BODYLESS = new Set<HttpMethod>(['GET', 'HEAD', 'OPTIONS']);

/** Whether a method conventionally carries no request body. */
export function isBodylessMethod(method: HttpMethod): boolean {
  return BODYLESS.has(method);
}

/** Whether a method is safe (read-only, no intended side effects). */
export function isSafeMethod(method: HttpMethod): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

/** Whether a method is idempotent per RFC 7231. */
export function isIdempotentMethod(method: HttpMethod): boolean {
  return method !== 'POST' && method !== 'PATCH';
}

/** Narrowing guard for an arbitrary string. */
export function isHttpMethod(value: string): value is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(value);
}
