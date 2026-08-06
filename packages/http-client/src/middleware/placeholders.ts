/**
 * Default middleware **placeholders** — the canonical set of cross-cutting middleware the platform will
 * eventually provide. In this phase they are inert, transparent pass-throughs: each declares its name
 * and priority and simply continues the pipeline. NO functionality is implemented here — no
 * authentication, no retry, no logging, no metrics, no rate limiting, no circuit breaking. They exist
 * so the contracts, ordering and registration are in place; later phases replace each `passThrough`
 * with a real implementation without changing the pipeline or the client core.
 */
import { passThrough } from './adapters';
import { MiddlewarePriority } from './priority';
import type { Middleware } from './types';

export const AUTHENTICATION_MIDDLEWARE = 'authentication';
export const LOGGING_MIDDLEWARE = 'logging';
export const RETRY_MIDDLEWARE = 'retry';
export const RATE_LIMIT_MIDDLEWARE = 'rate-limit';
export const CIRCUIT_BREAKER_MIDDLEWARE = 'circuit-breaker';
export const METRICS_MIDDLEWARE = 'metrics';
export const TRACING_MIDDLEWARE = 'tracing';
export const COMPRESSION_MIDDLEWARE = 'compression';
export const USER_AGENT_MIDDLEWARE = 'user-agent';
export const REQUEST_ID_MIDDLEWARE = 'request-id';

export function createAuthenticationMiddleware(): Middleware {
  return passThrough({
    name: AUTHENTICATION_MIDDLEWARE,
    priority: MiddlewarePriority.AUTHENTICATION,
    placeholder: true,
  });
}
export function createLoggingMiddleware(): Middleware {
  return passThrough({
    name: LOGGING_MIDDLEWARE,
    priority: MiddlewarePriority.LOGGING,
    placeholder: true,
  });
}
export function createRetryMiddleware(): Middleware {
  return passThrough({
    name: RETRY_MIDDLEWARE,
    priority: MiddlewarePriority.RETRY,
    placeholder: true,
  });
}
export function createRateLimitMiddleware(): Middleware {
  return passThrough({
    name: RATE_LIMIT_MIDDLEWARE,
    priority: MiddlewarePriority.RATE_LIMIT,
    placeholder: true,
  });
}
export function createCircuitBreakerMiddleware(): Middleware {
  return passThrough({
    name: CIRCUIT_BREAKER_MIDDLEWARE,
    priority: MiddlewarePriority.CIRCUIT_BREAKER,
    placeholder: true,
  });
}
export function createMetricsMiddleware(): Middleware {
  return passThrough({
    name: METRICS_MIDDLEWARE,
    priority: MiddlewarePriority.METRICS,
    placeholder: true,
  });
}
export function createTracingMiddleware(): Middleware {
  return passThrough({
    name: TRACING_MIDDLEWARE,
    priority: MiddlewarePriority.TRACING,
    placeholder: true,
  });
}
export function createCompressionMiddleware(): Middleware {
  return passThrough({
    name: COMPRESSION_MIDDLEWARE,
    priority: MiddlewarePriority.COMPRESSION,
    placeholder: true,
  });
}
export function createUserAgentMiddleware(): Middleware {
  return passThrough({
    name: USER_AGENT_MIDDLEWARE,
    priority: MiddlewarePriority.USER_AGENT,
    placeholder: true,
  });
}
export function createRequestIdMiddleware(): Middleware {
  return passThrough({
    name: REQUEST_ID_MIDDLEWARE,
    priority: MiddlewarePriority.REQUEST_ID,
    placeholder: true,
  });
}

/** Every default placeholder, constructed fresh, in priority order. */
export function defaultMiddlewarePlaceholders(): readonly Middleware[] {
  return [
    createTracingMiddleware(),
    createRequestIdMiddleware(),
    createUserAgentMiddleware(),
    createAuthenticationMiddleware(),
    createCompressionMiddleware(),
    createLoggingMiddleware(),
    createMetricsMiddleware(),
    createRateLimitMiddleware(),
    createCircuitBreakerMiddleware(),
    createRetryMiddleware(),
  ];
}

/** The canonical placeholder names, in priority order. */
export const DEFAULT_MIDDLEWARE_NAMES: readonly string[] = [
  TRACING_MIDDLEWARE,
  REQUEST_ID_MIDDLEWARE,
  USER_AGENT_MIDDLEWARE,
  AUTHENTICATION_MIDDLEWARE,
  COMPRESSION_MIDDLEWARE,
  LOGGING_MIDDLEWARE,
  METRICS_MIDDLEWARE,
  RATE_LIMIT_MIDDLEWARE,
  CIRCUIT_BREAKER_MIDDLEWARE,
  RETRY_MIDDLEWARE,
];
