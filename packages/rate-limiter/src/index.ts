/**
 * @platform/rate-limiter — the Common Rate Limiter Engine.
 *
 * The canonical, provider-independent request-throttling infrastructure for every provider
 * implementation. It enforces provider rate limits while maximising throughput and preventing API
 * bans. It provides all four rate-limit algorithms (token bucket, leaky bucket, sliding window, fixed
 * window) behind a common contract; weighted and prioritised requests; concurrency limiting via a
 * `PermitManager`; a priority `RequestQueue` with backpressure; a `RequestScheduler` that admits or
 * waits deterministically; a `RateLimiter` facade (acquire / tryAcquire / execute), a
 * `CompositeRateLimiter` for multi-scope limits, dynamic quota updates (`QuotaManager`), the policy and
 * limiter registries, metrics and context, and a real rate-limit `Middleware` (`RateLimiterEngine`) for
 * the HTTP Middleware Pipeline. Limit scopes: global, provider, account, API key, endpoint, symbol and
 * request type.
 *
 * Every side effect — time and timers — is injected through the `@platform/http-client` `Scheduler`
 * seam, so runs are fully deterministic. `tryAcquire`/`release` are synchronous and atomic within the
 * single JavaScript event loop. Nothing here is provider-specific.
 */
export * from './algorithms';
export * from './policy';
export * from './errors';
export * from './context';
export * from './permit';
export * from './queue';
export * from './metrics';
export * from './request-scheduler';
export * from './limiter';
export * from './composite';
export * from './registry';
export * from './quota';
export * from './engine';
