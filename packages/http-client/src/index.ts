/**
 * @platform/http-client — the Common HTTP Client Core.
 *
 * The canonical, provider-independent HTTP communication layer reused by every exchange, broker and
 * market-data connector. It provides strongly-typed, immutable request/response models
 * (`HttpRequest`, `HttpResponse`, `HttpHeaders`, `HttpMethod`, `HttpStatus`), fluent immutable builders
 * (`HttpRequestBuilder`, `HttpQueryBuilder`), automatic JSON serialization/parsing, binary and
 * streaming response support, request/response context and metadata, a typed error hierarchy, an
 * injectable transport (`HttpTransport` / `FetchHttpTransport`), the generic engine (`HttpClient` /
 * `BaseHttpClient`) and the `ProviderHttpClient` base abstraction. It integrates with the
 * Configuration, Validation and Monitoring foundations through ports only.
 *
 * It is framework- and provider-independent and deliberately minimal: it implements NO
 * provider-specific logic, NO authentication, NO retry, NO timeout, NO rate limiting and NO circuit
 * breaker — those are separate, later foundations. A non-2xx status is never thrown by default.
 */
export * from './method';
export * from './status';
export * from './headers';
export * from './query';
export * from './body';
export * from './context';
export * from './request';
export * from './response';
export * from './errors';
export * from './transport';
export * from './parser';
export * from './ports';
export * from './client';
export * from './provider-client';
export * from './middleware';
export * from './retry';
export * from './circuit-breaker';
