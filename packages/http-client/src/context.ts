/**
 * Request/response context and metadata. `RequestContext` carries the correlation identity, tags and
 * free-form attributes that travel with a request; `ResponseContext` carries the timing and identity
 * of the completed exchange. Both are immutable. Identifiers are generated deterministically from a
 * monotonic counter (no crypto dependency); the caller may always supply its own id.
 */

/** Free-form, read-only metadata attached to a request or response. */
export type Metadata = Readonly<Record<string, unknown>>;

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId?: string;
  readonly createdAt: number;
  readonly tags: readonly string[];
  readonly attributes: Metadata;
  /** Optional cancellation signal (cancellation only — this core implements no timeout). */
  readonly signal?: AbortSignal;
}

export interface ResponseContext {
  readonly requestId: string;
  readonly correlationId?: string;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly durationMs: number;
  readonly attributes: Metadata;
}

let counter = 0;

/** Generate a process-unique request id (monotonic; no randomness, no crypto). */
export function nextRequestId(prefix = 'req'): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}`;
}

export interface RequestContextInit {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly createdAt?: number;
  readonly tags?: readonly string[];
  readonly attributes?: Metadata;
  readonly signal?: AbortSignal;
}

/** Build a `RequestContext`, filling defaults for anything not supplied. */
export function createRequestContext(
  init: RequestContextInit = {},
  now: number = Date.now(),
): RequestContext {
  return {
    requestId: init.requestId ?? nextRequestId(),
    correlationId: init.correlationId,
    createdAt: init.createdAt ?? now,
    tags: init.tags ?? [],
    attributes: init.attributes ?? {},
    signal: init.signal,
  };
}

/** Build a `ResponseContext` for a completed exchange. */
export function createResponseContext(
  request: RequestContext,
  startedAt: number,
  completedAt: number,
  attributes: Metadata = {},
): ResponseContext {
  return {
    requestId: request.requestId,
    correlationId: request.correlationId,
    startedAt,
    completedAt,
    durationMs: Math.max(0, completedAt - startedAt),
    attributes,
  };
}
