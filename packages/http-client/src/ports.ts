/**
 * Integration ports — the interfaces through which the HTTP client core reaches the platform's
 * cross-cutting foundations by reference only: Configuration Foundation (non-secret config),
 * Validation Foundation (pre-send request validation) and the Monitoring Module (request/response/
 * error signals). No concrete implementation lives here beyond inert no-op defaults; concrete adapters
 * are injected at composition time. No auth, no retry, no rate limiting.
 */
import type { HttpRequest } from './request';
import type { HttpError } from './errors';

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface HttpConfigurationPort {
  get(key: string): string | undefined;
}

/** The outcome of validating a request before it is sent. */
export interface HttpValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/** Validation Foundation — validate a composed request before dispatch (structural checks only). */
export interface HttpRequestValidator {
  validate(request: HttpRequest): HttpValidationResult;
}

export interface HttpRequestSignal {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly at: number;
}
export interface HttpResponseSignal {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly status: number;
  readonly durationMs: number;
  readonly at: number;
}
export interface HttpErrorSignal {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly kind: string;
  readonly message: string;
  readonly at: number;
}

/** Monitoring Module — receive request/response/error signals (publish-only). */
export interface HttpMonitoringPort {
  onRequest(signal: HttpRequestSignal): void;
  onResponse(signal: HttpResponseSignal): void;
  onError(signal: HttpErrorSignal): void;
}

/** A validator that accepts every structurally-built request. */
export const ALWAYS_VALID: HttpRequestValidator = {
  validate(): HttpValidationResult {
    return { valid: true, errors: [] };
  },
};

/** A monitoring port that discards every signal. */
export const NOOP_MONITORING: HttpMonitoringPort = {
  onRequest(): void {},
  onResponse(): void {},
  onError(): void {},
};

/** A configuration port that knows nothing. */
export const EMPTY_CONFIGURATION: HttpConfigurationPort = {
  get(): string | undefined {
    return undefined;
  },
};

/** Convenience: build an error signal from an `HttpError`. */
export function errorSignal(error: HttpError, at: number): HttpErrorSignal {
  return {
    requestId: error.request.context.requestId,
    method: error.request.method,
    url: error.request.url,
    kind: error.kind,
    message: error.message,
    at,
  };
}
