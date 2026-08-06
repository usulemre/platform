/**
 * The typed HTTP error hierarchy. Errors carry the originating request context so failures can be
 * correlated end-to-end. The core NEVER throws on a non-2xx status by itself (callers inspect
 * `response.ok`); `HttpStatusError` is only produced when a caller explicitly opts in via
 * `ensureSuccess`.
 */
import type { HttpRequest } from './request';
import type { HttpResponse } from './response';

export type HttpErrorKind =
  | 'transport'
  | 'serialize'
  | 'parse'
  | 'status'
  | 'aborted'
  | 'validation'
  | 'timeout'
  | 'circuit_open';

/** Base class for every error raised by the HTTP client core. */
export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  readonly request: HttpRequest;
  override readonly cause?: unknown;

  constructor(kind: HttpErrorKind, message: string, request: HttpRequest, cause?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.kind = kind;
    this.request = request;
    this.cause = cause;
  }
}

/** A network/transport failure — the request never produced a response. */
export class HttpTransportError extends HttpError {
  constructor(message: string, request: HttpRequest, cause?: unknown) {
    super('transport', message, request, cause);
    this.name = 'HttpTransportError';
  }
}

/** The request was cancelled via its abort signal. */
export class HttpAbortError extends HttpError {
  constructor(request: HttpRequest, cause?: unknown) {
    super('aborted', 'The HTTP request was aborted.', request, cause);
    this.name = 'HttpAbortError';
  }
}

/** The request exceeded its allotted time and was aborted by the Timeout Engine (Phase 8.1.3). */
export class HttpTimeoutError extends HttpError {
  readonly timeoutMs: number;
  constructor(request: HttpRequest, timeoutMs: number, cause?: unknown) {
    super('timeout', `The HTTP request timed out after ${timeoutMs}ms.`, request, cause);
    this.name = 'HttpTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/** The request was rejected by an open circuit breaker before it was sent (Phase 8.1.4). */
export class HttpCircuitOpenError extends HttpError {
  readonly circuit: string;
  readonly circuitState: string;
  constructor(request: HttpRequest, circuit: string, circuitState: string) {
    super(
      'circuit_open',
      `Circuit "${circuit}" is ${circuitState}; request short-circuited.`,
      request,
    );
    this.name = 'HttpCircuitOpenError';
    this.circuit = circuit;
    this.circuitState = circuitState;
  }
}

/** The request failed pre-send validation (Validation Foundation). */
export class HttpValidationError extends HttpError {
  readonly errors: readonly string[];
  constructor(errors: readonly string[], request: HttpRequest) {
    super('validation', `Request validation failed: ${errors.join('; ')}`, request);
    this.name = 'HttpValidationError';
    this.errors = errors;
  }
}

/** The request body could not be serialized. */
export class HttpSerializationError extends HttpError {
  constructor(message: string, request: HttpRequest, cause?: unknown) {
    super('serialize', message, request, cause);
    this.name = 'HttpSerializationError';
  }
}

/** The response body could not be parsed into the requested type. */
export class HttpParseError extends HttpError {
  readonly status: number;
  constructor(message: string, request: HttpRequest, status: number, cause?: unknown) {
    super('parse', message, request, cause);
    this.name = 'HttpParseError';
    this.status = status;
  }
}

/** A response whose status was outside the accepted range (only via `ensureSuccess`). */
export class HttpStatusError<T = unknown> extends HttpError {
  readonly response: HttpResponse<T>;
  constructor(response: HttpResponse<T>) {
    super('status', `HTTP ${response.status} ${response.statusText}`.trim(), response.request);
    this.name = 'HttpStatusError';
    this.response = response;
  }
}

export function isHttpError(value: unknown): value is HttpError {
  return value instanceof HttpError;
}
