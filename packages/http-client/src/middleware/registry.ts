/**
 * `MiddlewareRegistry` — a mutable, name-keyed registry of middleware. It is the composition surface
 * where providers register reusable middleware (their own or the default placeholders) and from which
 * an immutable `MiddlewarePipeline` is materialized. Registration is by unique name; re-registering the
 * same name requires an explicit override to avoid accidental shadowing.
 */
import { MiddlewarePipeline } from './pipeline';
import type { Middleware } from './types';

export class MiddlewareRegistry {
  private readonly middleware = new Map<string, Middleware>();

  /** Register a middleware. Throws on a duplicate name unless `override` is set. */
  register(middleware: Middleware, options: { readonly override?: boolean } = {}): this {
    if (this.middleware.has(middleware.name) && !options.override) {
      throw new Error(
        `Middleware "${middleware.name}" is already registered; pass { override: true } to replace it.`,
      );
    }
    this.middleware.set(middleware.name, middleware);
    return this;
  }

  /** Register many middleware at once. */
  registerAll(
    middleware: readonly Middleware[],
    options: { readonly override?: boolean } = {},
  ): this {
    for (const item of middleware) this.register(item, options);
    return this;
  }

  /** Remove a middleware by name; returns whether it existed. */
  unregister(name: string): boolean {
    return this.middleware.delete(name);
  }

  has(name: string): boolean {
    return this.middleware.has(name);
  }
  get(name: string): Middleware | undefined {
    return this.middleware.get(name);
  }
  names(): readonly string[] {
    return [...this.middleware.keys()];
  }
  all(): readonly Middleware[] {
    return [...this.middleware.values()];
  }
  get size(): number {
    return this.middleware.size;
  }

  /** Materialize an immutable, priority-ordered pipeline from the registered middleware. */
  toPipeline(): MiddlewarePipeline {
    return new MiddlewarePipeline(this.all());
  }
}
