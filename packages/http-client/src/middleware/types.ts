/**
 * The middleware contracts. `Middleware` is the unified, composable, onion-style handler that receives
 * the context and a `next` continuation and returns a `MiddlewareResult`; it can intercept the request
 * (before `next`), the response/error (after `next`), or short-circuit (never call `next`). The
 * hook-style `RequestMiddleware` / `ResponseMiddleware` / `ErrorMiddleware` interfaces are ergonomic
 * specializations adapted onto `Middleware`. All handlers are async and fully typed.
 */
import type { HttpError } from '../errors';
import type { HttpResponse } from '../response';
import type { MiddlewareContext } from './context';
import type { MiddlewareResult } from './result';

/** The continuation that invokes the rest of the pipeline (and ultimately the transport send). */
export type MiddlewareNext = (context: MiddlewareContext) => Promise<MiddlewareResult>;

/** Fields shared by every middleware kind. */
export interface MiddlewareDescriptor {
  readonly name: string;
  /** Ordering key — lower runs earlier (outermost). Defaults to `MiddlewarePriority.DEFAULT`. */
  readonly priority?: number;
  /** When `false`, the pipeline skips this middleware entirely. Defaults to `true`. */
  readonly enabled?: boolean;
  /** Marks a not-yet-implemented placeholder (pass-through). */
  readonly placeholder?: boolean;
  /** Optional per-invocation predicate — return `false` to skip this middleware for a context. */
  condition?(context: MiddlewareContext): boolean;
}

/** The unified, composable middleware. */
export interface Middleware extends MiddlewareDescriptor {
  handle(context: MiddlewareContext, next: MiddlewareNext): Promise<MiddlewareResult>;
}

/** A middleware that only transforms the outgoing request. */
export interface RequestMiddleware extends MiddlewareDescriptor {
  processRequest(context: MiddlewareContext): MiddlewareContext | Promise<MiddlewareContext>;
}

/** A middleware that only transforms a successful response. */
export interface ResponseMiddleware extends MiddlewareDescriptor {
  processResponse(
    response: HttpResponse,
    context: MiddlewareContext,
  ): HttpResponse | Promise<HttpResponse>;
}

/** A middleware that inspects an error outcome and may recover it into a response. */
export interface ErrorMiddleware extends MiddlewareDescriptor {
  processError(
    error: HttpError,
    context: MiddlewareContext,
  ): MiddlewareResult | Promise<MiddlewareResult>;
}
