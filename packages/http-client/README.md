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

## Scripts

`pnpm --filter @platform/http-client typecheck | lint | test`
