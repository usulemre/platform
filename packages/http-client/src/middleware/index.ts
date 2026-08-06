/**
 * The HTTP Middleware Pipeline — the canonical, provider-independent request-processing framework for
 * the Common HTTP Client. It provides extensible request/response/error interception through composable
 * `Middleware` (unified onion handlers plus hook-style `RequestMiddleware`/`ResponseMiddleware`/
 * `ErrorMiddleware`), an immutable `MiddlewareContext` for context propagation, deterministic priority
 * ordering, conditional and short-circuit execution, cancellation via the request signal, a
 * `MiddlewareRegistry` and fluent `PipelineBuilder` for composition, a `PipelineExecutor` /
 * `MiddlewarePipeline` for execution, the `MiddlewareHttpClient` integration with the client core, and
 * inert placeholders for the ten default cross-cutting middleware.
 *
 * It is framework- and provider-independent and deterministic. The default middleware are placeholders
 * only: NO authentication, retry, logging, metrics, rate limiting or circuit breaking is implemented
 * here — those arrive in later phases and slot into the existing contracts unchanged.
 */
export * from './priority';
export * from './result';
export * from './context';
export * from './types';
export * from './adapters';
export * from './executor';
export * from './pipeline';
export * from './registry';
export * from './builder';
export * from './client';
export * from './placeholders';
