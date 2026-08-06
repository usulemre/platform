/**
 * `PipelineExecutor` — composes an ordered middleware list into a single onion chain and runs it. It
 * is deterministic and stateless: given the same middleware, context and terminal it always behaves
 * identically. Disabled middleware are skipped up front; per-context `condition`s are evaluated at
 * dispatch time. Thrown `HttpError`s are converted to `error` results at each hop so error middleware
 * can observe them through `next`; short-circuiting (a middleware that never calls `next`) is fully
 * supported.
 */
import { isHttpError, type HttpError } from '../errors';
import { MiddlewareResult } from './result';
import type { MiddlewareContext } from './context';
import type { Middleware, MiddlewareNext } from './types';

/** The innermost handler — typically dispatches the HTTP request via the client core. */
export type TerminalHandler = (context: MiddlewareContext) => Promise<MiddlewareResult>;

export class PipelineExecutor {
  private readonly middleware: readonly Middleware[];

  constructor(middleware: readonly Middleware[]) {
    this.middleware = middleware.filter((m) => m.enabled !== false);
  }

  /** Run the chain for `context`, ending at `terminal`. */
  execute(context: MiddlewareContext, terminal: TerminalHandler): Promise<MiddlewareResult> {
    const active = this.middleware;

    const dispatch = (index: number, ctx: MiddlewareContext): Promise<MiddlewareResult> => {
      if (index >= active.length) return guard(() => terminal(ctx));
      const middleware = active[index]!;
      if (middleware.condition && !middleware.condition(ctx)) return dispatch(index + 1, ctx);
      const next: MiddlewareNext = (nextContext) => dispatch(index + 1, nextContext);
      return guard(() => middleware.handle(ctx, next));
    };

    return dispatch(0, context);
  }
}

/**
 * Invoke a thunk, converting a thrown `HttpError` into an `error` result so it propagates back through
 * the chain as data. Non-HTTP errors (programmer errors) are left to propagate — they are bugs, not
 * request failures.
 */
async function guard(thunk: () => Promise<MiddlewareResult>): Promise<MiddlewareResult> {
  try {
    return await thunk();
  } catch (error) {
    if (isHttpError(error)) return MiddlewareResult.error(error as HttpError);
    throw error;
  }
}
