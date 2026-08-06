# @platform/http-client

The **Common HTTP Client Core** — the canonical, provider-independent HTTP communication layer reused
by every exchange, broker and market-data connector. Foundational infrastructure (Phase 8.1.1).

## What it provides

- **Strongly-typed, immutable models**: `HttpRequest`, `HttpResponse<T>`, `HttpHeaders` (case-insensitive),
  `HttpMethod`, `HttpStatus`, `RequestContext`, `ResponseContext`.
- **Fluent immutable builders**: `HttpRequestBuilder`, `HttpQueryBuilder`, plus `buildUrl`/`joinUrl`.
- **Automatic JSON serialization/parsing**, plus text, binary (`Uint8Array`) and **streaming**
  (`ReadableStream<Uint8Array>`) response support.
- **Generic engine**: the `HttpClient` interface and `BaseHttpClient` (`get/post/put/patch/delete/head/options`
  - `send`/`request`).
- **Injectable transport**: `HttpTransport` port with a default `FetchHttpTransport` adapting the Fetch
  API — pass any `FetchLike` for framework independence and testing.
- **Typed error hierarchy**: `HttpError` → `HttpTransportError`, `HttpAbortError`,
  `HttpSerializationError`, `HttpParseError`, `HttpValidationError`, `HttpStatusError`.
- **Base provider abstraction**: `ProviderHttpClient` (base URL + default headers/query composition).
- **Integration ports** (by reference only): Configuration (`HttpConfigurationPort`), Validation
  (`HttpRequestValidator`), Monitoring (`HttpMonitoringPort`).

## What it deliberately does NOT do

No provider-specific logic, **no authentication, no retry, no timeout, no rate limiting, no circuit
breaker** — those are separate, later foundations. A non-2xx status is returned normally (never
thrown); opt into throwing with `ensureSuccess(response)`.

## Example

```ts
import { BaseHttpClient, FetchHttpTransport, jsonBody, ensureSuccess } from '@platform/http-client';

const http = new BaseHttpClient({ transport: new FetchHttpTransport() });
const res = await http.post<{ id: string }>(
  'https://api.example.com/v1/orders',
  jsonBody({ symbol: 'BTC' }),
);
ensureSuccess(res);
console.log(res.body.id, res.context.durationMs);
```

## Middleware pipeline (`src/middleware`, Phase 8.1.2)

An extensible, provider-independent request-processing framework layered on the core. Providers compose
reusable middleware **without modifying the client core**.

- **Contracts**: `Middleware` (unified onion handler) plus hook-style `RequestMiddleware` /
  `ResponseMiddleware` / `ErrorMiddleware`; `MiddlewareResult` (typed `response`/`error` outcome).
- **Context**: immutable `MiddlewareContext` (request + attribute bag + timing + abort signal) for
  deterministic context propagation and cancellation.
- **Composition**: `MiddlewareRegistry`, fluent `PipelineBuilder`, `defineMiddleware`/`passThrough`/`when`,
  `MiddlewarePriority` ordering.
- **Execution**: `PipelineExecutor` / `MiddlewarePipeline` — priority ordering, conditional execution,
  short-circuit, and error interception (thrown `HttpError`s become `error` results so error middleware
  can recover them).
- **Integration**: `MiddlewareHttpClient` extends `BaseHttpClient`; every verb flows through the pipeline.

The ten default middleware (authentication, logging, retry, rate-limit, circuit-breaker, metrics,
tracing, compression, user-agent, request-id) are **inert placeholders** (transparent pass-throughs) —
no functionality is implemented yet; later phases replace them in place.

```ts
import { MiddlewareHttpClient, PipelineBuilder, FetchHttpTransport } from '@platform/http-client';

const pipeline = PipelineBuilder.create()
  .useRequest({
    name: 'x-app',
    processRequest: (ctx) =>
      ctx.withRequest({ ...ctx.request, headers: ctx.request.headers.set('X-App', 'platform') }),
  })
  .build();
const http = new MiddlewareHttpClient({ transport: new FetchHttpTransport(), pipeline });
```

## Retry & Timeout Engine (`src/retry`, Phase 8.1.3)

The canonical, **deterministic** resiliency layer. Every side effect — time, delay, randomness — is
injected through the `Scheduler` and `Random` seams, so runs are reproducible.

- **Backoff**: `ConstantBackoff`, `LinearBackoff`, `ExponentialBackoff`, `DecorrelatedJitter`, plus
  full/equal jitter (`withJitter`).
- **Policies**: `RetryPolicy` (max retries, retryable/non-retryable statuses, network/timeout toggles,
  custom conditions), `createRetryPolicy`, `DEFAULT_RETRY_POLICY`, `NO_RETRY_POLICY`, `RetryPolicyRegistry`.
  Retries 429/500/502/503/504, network failures and timeouts; never retries 400/401/403/404, validation
  or parse errors.
- **Classification & decision**: `classifyOutcome` + `RetryDecisionEngine` (pure).
- **Timeout**: `TimeoutPolicy` (request/connection/read + per-request override via `metadata.timeoutMs`),
  `TimeoutManager` (raises `HttpTimeoutError`, honours cancellation).
- **Execution**: `RetryExecutor` (attempts, `RetryHistory`, `RetryMetrics`), `RetryContext` propagation.
- **Facade & integration**: `RetryEngine.middleware()` returns a real retry `Middleware` for the pipeline
  (replacing the Phase 8.1.2 placeholder).

```ts
import {
  RetryEngine,
  MiddlewarePipeline,
  MiddlewareHttpClient,
  FetchHttpTransport,
  createRetryPolicy,
} from '@platform/http-client';

const engine = new RetryEngine();
const pipeline = MiddlewarePipeline.of(
  engine.middleware({
    policy: createRetryPolicy({ maxRetries: 3 }),
    timeoutPolicy: { requestTimeoutMs: 5000 },
  }),
);
const http = new MiddlewareHttpClient({ transport: new FetchHttpTransport(), pipeline });
```

## Circuit Breaker Engine (`src/circuit-breaker`, Phase 8.1.4)

The canonical, **deterministic** resiliency component that protects the platform from repeatedly
calling unhealthy providers and recovers automatically when they heal. Time is injected via `clock`.

- **State machine**: `CLOSED → OPEN → HALF_OPEN → CLOSED`, plus `FORCED_OPEN`, `FORCED_CLOSED` and
  `DISABLED` operator overrides (`CircuitStateMachine`, `describeCircuitState`, `canTransition`).
- **Sliding window**: `CountSlidingWindow` / `TimeSlidingWindow` behind a `FailureTracker`; a
  `SuccessTracker` counts half-open trials.
- **Failure classification** (`classifyForCircuit`): counts network / timeout / 5xx (optionally 429);
  ignores validation, auth/authorization (4xx client) and business errors.
- **Decision & recovery**: `HealthEvaluator` (failure threshold / rate + minimum throughput),
  `RecoveryManager` (recovery timeout → half-open probe), `SuccessTracker` (success threshold → close).
- **Breaker**: `CircuitBreaker` (`tryAcquire`/`record`/`execute`, manual `reset`, `forceOpen`/`forceClosed`/
  `disable`/`enable`), `CircuitMetrics`, `CircuitEvents`, `CircuitContext`. Rejections raise
  `HttpCircuitOpenError`.
- **Registries & engine**: `CircuitPolicyRegistry`, `CircuitRegistry` (one breaker per provider key),
  and `CircuitBreakerEngine.middleware()` — a real circuit-breaker `Middleware` (keyed by host) for the
  pipeline that composes with the Retry & Timeout Engine.

```ts
import {
  CircuitBreakerEngine,
  MiddlewarePipeline,
  MiddlewareHttpClient,
  FetchHttpTransport,
} from '@platform/http-client';

const cb = new CircuitBreakerEngine();
const pipeline = MiddlewarePipeline.of(cb.middleware());
const http = new MiddlewareHttpClient({ transport: new FetchHttpTransport(), pipeline });
```

## Scripts

`pnpm --filter @platform/http-client typecheck | lint | test | bench`
