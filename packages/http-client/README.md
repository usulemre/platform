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

## Scripts

`pnpm --filter @platform/http-client typecheck | lint | test`
