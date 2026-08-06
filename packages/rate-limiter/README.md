# @platform/rate-limiter

The **Common Rate Limiter Engine** — the canonical, provider-independent request-throttling
infrastructure for every provider implementation (Phase 8.1.5). It enforces provider rate limits while
maximising throughput and preventing API bans.

## What it provides

- **Algorithms** (common contract): `TokenBucketLimiter`, `LeakyBucketLimiter`, `SlidingWindowLimiter`,
  `FixedWindowLimiter` — pure, deterministic (`tryAcquire(weight, now)`), with weighted requests and
  burst allowance.
- **Policy & scopes**: `RateLimitPolicy` / `createRateLimitPolicy`, scopes `GLOBAL`, `PROVIDER`,
  `ACCOUNT`, `API_KEY`, `ENDPOINT`, `SYMBOL`, `REQUEST_TYPE`.
- **Concurrency & queueing**: `PermitManager` (concurrency semaphore), `RequestQueue` (priority +
  backpressure), `RequestScheduler` (deterministic admission/waiting), `Permit` (acquire/release).
- **Facade**: `RateLimiter` (`acquire` / `tryAcquire` / `execute`), `CompositeRateLimiter` (multi-scope),
  dynamic quota updates (`QuotaManager`), `RateLimitMetrics`, `RateLimitContext`.
- **Registries & engine**: `RateLimitPolicyRegistry`, `RateLimiterRegistry`, and
  `RateLimiterEngine.middleware()` — a real rate-limit `Middleware` for the HTTP Middleware Pipeline
  (replacing the Phase 8.1.2 placeholder) that composes with the Retry, Timeout and Circuit Breaker
  engines.

## Determinism & thread-safety

Every side effect — time and timers — is injected through the `@platform/http-client` `Scheduler`
seam, so runs are fully reproducible (use `ManualScheduler` in tests). `tryAcquire`/`release` are
synchronous and atomic within the single JavaScript event loop. Nothing here is provider-specific.

## Example

```ts
import { RateLimiterEngine, createRateLimitPolicy } from '@platform/rate-limiter';
import {
  MiddlewarePipeline,
  MiddlewareHttpClient,
  FetchHttpTransport,
} from '@platform/http-client';

const engine = new RateLimiterEngine();
const middleware = engine.middleware({
  policy: createRateLimitPolicy({
    algorithm: 'token-bucket',
    params: { limit: 20, intervalMs: 1000 },
    scope: 'PROVIDER',
    maxConcurrent: 8,
  }),
});
const http = new MiddlewareHttpClient({
  transport: new FetchHttpTransport(),
  pipeline: MiddlewarePipeline.of(middleware),
});
```

## Scripts

`pnpm --filter @platform/rate-limiter typecheck | lint | test | bench`
