/**
 * `createResilientHttpClient` — composes the Common HTTP Client with the shared resiliency foundations
 * (Rate Limiter → Circuit Breaker → Retry & Timeout) into one `HttpClient` the Binance REST client
 * uses. The pipeline order is deliberate: the rate limiter admits (or paces) the request first, the
 * circuit breaker guards a failing venue, and retry/timeout wraps the actual send. Every side effect
 * (clock, scheduler, randomness) is injected so behavior is deterministic under test. This function
 * owns NO Binance specifics beyond the request-rate policy; it is pure resiliency wiring.
 */
import {
  MiddlewareHttpClient,
  PipelineBuilder,
  RetryEngine,
  CircuitBreakerEngine,
  type Clock,
  type HttpClient,
  type HttpMonitoringPort,
  type HttpRequestValidator,
  type HttpTransport,
  type Random,
  type Scheduler,
} from '@platform/http-client';
import { RateLimiterEngine, createRateLimitPolicy } from '@platform/rate-limiter';

export interface ResilienceOptions {
  readonly transport: HttpTransport;
  readonly clock?: Clock;
  readonly scheduler?: Scheduler;
  readonly random?: Random;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
  readonly monitoring?: HttpMonitoringPort;
  readonly validator?: HttpRequestValidator;
  /** Provider request-rate policy (Binance uses weight/minute; defaults to a conservative bucket). */
  readonly rateLimit?: { readonly limit: number; readonly intervalMs: number };
}

/** The composed engines, exposed so the provider can surface breaker/limiter state for health/metrics. */
export interface ResilientHttpClient {
  readonly http: HttpClient;
  readonly retry: RetryEngine;
  readonly circuitBreaker: CircuitBreakerEngine;
  readonly rateLimiter: RateLimiterEngine;
}

export function createResilientHttpClient(options: ResilienceOptions): ResilientHttpClient {
  const retry = new RetryEngine({ scheduler: options.scheduler, random: options.random });
  const circuitBreaker = new CircuitBreakerEngine({ clock: options.clock });
  const rateLimiter = new RateLimiterEngine({ scheduler: options.scheduler });

  const policy = createRateLimitPolicy({
    name: 'binance',
    scope: 'PROVIDER',
    algorithm: 'token-bucket',
    params: options.rateLimit ?? { limit: 1200, intervalMs: 60_000 },
  });

  const pipeline = PipelineBuilder.create()
    .use(rateLimiter.middleware({ policy }))
    .use(circuitBreaker.middleware())
    .use(retry.middleware())
    .build();

  const http = new MiddlewareHttpClient({
    transport: options.transport,
    clock: options.clock,
    monitoring: options.monitoring,
    validator: options.validator,
    defaultHeaders: options.defaultHeaders,
    pipeline,
  });

  return { http, retry, circuitBreaker, rateLimiter };
}
