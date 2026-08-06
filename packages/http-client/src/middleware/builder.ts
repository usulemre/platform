/**
 * `PipelineBuilder` — a fluent, immutable builder that assembles a `MiddlewarePipeline` from unified
 * and hook-style middleware, with optional conditional wrapping. Every method returns a new builder;
 * `build` sorts by priority. This is the ergonomic front door providers use to compose a pipeline
 * without touching the HTTP client core.
 */
import {
  fromErrorMiddleware,
  fromRequestMiddleware,
  fromResponseMiddleware,
  when,
} from './adapters';
import { MiddlewarePipeline } from './pipeline';
import type { MiddlewareContext } from './context';
import type { ErrorMiddleware, Middleware, RequestMiddleware, ResponseMiddleware } from './types';

export class PipelineBuilder {
  private constructor(private readonly middleware: readonly Middleware[]) {}

  static create(): PipelineBuilder {
    return new PipelineBuilder([]);
  }

  private add(middleware: Middleware): PipelineBuilder {
    return new PipelineBuilder([...this.middleware, middleware]);
  }

  /** Add a unified middleware. */
  use(middleware: Middleware): PipelineBuilder {
    return this.add(middleware);
  }

  /** Add several unified middleware. */
  useAll(middleware: readonly Middleware[]): PipelineBuilder {
    return new PipelineBuilder([...this.middleware, ...middleware]);
  }

  /** Add a request-only middleware. */
  useRequest(middleware: RequestMiddleware): PipelineBuilder {
    return this.add(fromRequestMiddleware(middleware));
  }

  /** Add a response-only middleware. */
  useResponse(middleware: ResponseMiddleware): PipelineBuilder {
    return this.add(fromResponseMiddleware(middleware));
  }

  /** Add an error-only middleware. */
  useError(middleware: ErrorMiddleware): PipelineBuilder {
    return this.add(fromErrorMiddleware(middleware));
  }

  /** Add a middleware guarded by an extra condition. */
  useWhen(
    condition: (context: MiddlewareContext) => boolean,
    middleware: Middleware,
  ): PipelineBuilder {
    return this.add(when(condition, middleware));
  }

  /** Materialize the immutable, priority-ordered pipeline. */
  build(): MiddlewarePipeline {
    return new MiddlewarePipeline(this.middleware);
  }
}
