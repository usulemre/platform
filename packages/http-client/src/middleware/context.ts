/**
 * `MiddlewareContext` — the immutable value threaded through the pipeline. It carries the (possibly
 * transformed) request, a shared attribute bag for cross-middleware state, and timing. Every mutation
 * returns a NEW context; nothing is mutated in place, so context propagation is deterministic and a
 * middleware can never corrupt a sibling's view. Cancellation is exposed via the request's abort
 * signal.
 */
import type { HttpRequest } from '../request';

export class MiddlewareContext {
  readonly request: HttpRequest;
  readonly startedAt: number;
  private readonly attributes: ReadonlyMap<string, unknown>;

  private constructor(
    request: HttpRequest,
    startedAt: number,
    attributes: ReadonlyMap<string, unknown>,
  ) {
    this.request = request;
    this.startedAt = startedAt;
    this.attributes = attributes;
  }

  /** Create a fresh context for a request. */
  static create(
    request: HttpRequest,
    startedAt: number = Date.now(),
    attributes?: Readonly<Record<string, unknown>>,
  ): MiddlewareContext {
    return new MiddlewareContext(
      request,
      startedAt,
      new Map(attributes ? Object.entries(attributes) : []),
    );
  }

  /** The cancellation signal for this exchange, if any (cancellation only — no timeout here). */
  get signal(): AbortSignal | undefined {
    return this.request.context.signal;
  }

  /** Whether the exchange has been cancelled. */
  get aborted(): boolean {
    return this.request.context.signal?.aborted ?? false;
  }

  /** Return a new context bound to a different request (used by request middleware). */
  withRequest(request: HttpRequest): MiddlewareContext {
    return new MiddlewareContext(request, this.startedAt, this.attributes);
  }

  /** Return a new context with `key` set to `value` in the attribute bag. */
  withAttribute(key: string, value: unknown): MiddlewareContext {
    const next = new Map(this.attributes);
    next.set(key, value);
    return new MiddlewareContext(this.request, this.startedAt, next);
  }

  /** Return a new context with several attributes merged in. */
  withAttributes(values: Readonly<Record<string, unknown>>): MiddlewareContext {
    const next = new Map(this.attributes);
    for (const [key, value] of Object.entries(values)) next.set(key, value);
    return new MiddlewareContext(this.request, this.startedAt, next);
  }

  /** Read an attribute (typed by the caller). */
  attribute<T = unknown>(key: string): T | undefined {
    return this.attributes.get(key) as T | undefined;
  }

  hasAttribute(key: string): boolean {
    return this.attributes.has(key);
  }

  /** A snapshot of the attribute bag. */
  attributeEntries(): readonly (readonly [string, unknown])[] {
    return [...this.attributes.entries()];
  }
}
