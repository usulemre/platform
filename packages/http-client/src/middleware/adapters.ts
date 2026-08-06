/**
 * Middleware construction and adaptation helpers. `defineMiddleware` builds a unified `Middleware` from
 * a handler; `fromRequestMiddleware` / `fromResponseMiddleware` / `fromErrorMiddleware` adapt the
 * hook-style specializations onto the unified contract; `when` wraps a middleware with an extra
 * condition; `passThrough` builds an inert middleware (the basis for the default placeholders). All are
 * pure and provider-independent.
 */
import { MiddlewareResult } from './result';
import type { MiddlewareContext } from './context';
import type {
  ErrorMiddleware,
  Middleware,
  MiddlewareDescriptor,
  MiddlewareNext,
  RequestMiddleware,
  ResponseMiddleware,
} from './types';

/** Build a unified `Middleware` from a descriptor and a handler. */
export function defineMiddleware(
  descriptor: MiddlewareDescriptor,
  handle: (context: MiddlewareContext, next: MiddlewareNext) => Promise<MiddlewareResult>,
): Middleware {
  return { ...descriptor, handle };
}

/** Adapt a request-only middleware: transform the context, then continue. */
export function fromRequestMiddleware(middleware: RequestMiddleware): Middleware {
  return defineMiddleware(middleware, async (context, next) => {
    const nextContext = await middleware.processRequest(context);
    return next(nextContext);
  });
}

/** Adapt a response-only middleware: continue, then transform a successful response. */
export function fromResponseMiddleware(middleware: ResponseMiddleware): Middleware {
  return defineMiddleware(middleware, async (context, next) => {
    const result = await next(context);
    if (result.kind !== 'response') return result;
    const response = await middleware.processResponse(result.response, context);
    return MiddlewareResult.response(response);
  });
}

/** Adapt an error-only middleware: continue, then handle an error outcome (may recover). */
export function fromErrorMiddleware(middleware: ErrorMiddleware): Middleware {
  return defineMiddleware(middleware, async (context, next) => {
    const result = await next(context);
    if (result.kind !== 'error') return result;
    return middleware.processError(result.error, context);
  });
}

/** Wrap a middleware so it only runs when BOTH its own condition and `condition` hold. */
export function when(
  condition: (context: MiddlewareContext) => boolean,
  middleware: Middleware,
): Middleware {
  const existing = middleware.condition?.bind(middleware);
  return {
    ...middleware,
    condition(context: MiddlewareContext) {
      if (!condition(context)) return false;
      return existing ? existing(context) : true;
    },
  };
}

/** Build an inert, transparent middleware that simply continues the pipeline. */
export function passThrough(descriptor: MiddlewareDescriptor): Middleware {
  return defineMiddleware(descriptor, (context, next) => next(context));
}
