/**
 * `MiddlewarePipeline` — an immutable, priority-ordered collection of middleware plus the entry point
 * to execute them. Construction sorts by priority (stable for ties); every mutation (`with`, `without`)
 * returns a new pipeline. Execution delegates to a fresh `PipelineExecutor`, so a pipeline value is
 * safe to share and reuse across concurrent requests.
 */
import { effectivePriority } from './priority';
import { PipelineExecutor, type TerminalHandler } from './executor';
import type { MiddlewareContext } from './context';
import type { MiddlewareResult } from './result';
import type { Middleware } from './types';

function sortByPriority(middleware: readonly Middleware[]): readonly Middleware[] {
  return middleware
    .map((m, index) => ({ m, index }))
    .sort(
      (a, b) =>
        effectivePriority(a.m.priority) - effectivePriority(b.m.priority) || a.index - b.index,
    )
    .map((entry) => entry.m);
}

export class MiddlewarePipeline {
  private readonly middleware: readonly Middleware[];

  constructor(middleware: readonly Middleware[] = []) {
    this.middleware = sortByPriority(middleware);
  }

  /** Build a pipeline from a list of middleware. */
  static of(...middleware: readonly Middleware[]): MiddlewarePipeline {
    return new MiddlewarePipeline(middleware);
  }

  /** Return a new pipeline with additional middleware appended (then re-sorted). */
  with(...middleware: readonly Middleware[]): MiddlewarePipeline {
    return new MiddlewarePipeline([...this.middleware, ...middleware]);
  }

  /** Return a new pipeline without the named middleware. */
  without(name: string): MiddlewarePipeline {
    return new MiddlewarePipeline(this.middleware.filter((m) => m.name !== name));
  }

  /** Whether a named middleware is present. */
  has(name: string): boolean {
    return this.middleware.some((m) => m.name === name);
  }

  /** Look up a middleware by name. */
  get(name: string): Middleware | undefined {
    return this.middleware.find((m) => m.name === name);
  }

  /** The middleware in execution order. */
  list(): readonly Middleware[] {
    return this.middleware;
  }

  get size(): number {
    return this.middleware.length;
  }

  /** Execute the pipeline for `context`, ending at `terminal`. */
  execute(context: MiddlewareContext, terminal: TerminalHandler): Promise<MiddlewareResult> {
    return new PipelineExecutor(this.middleware).execute(context, terminal);
  }
}
