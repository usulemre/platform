/**
 * The Binance error model and `BinanceErrorMapper` — the single translation point from raw venue and
 * transport failures into a typed, canonical error hierarchy. Both the HTTP status and the Binance
 * `{ code, msg }` envelope are collapsed onto a stable {@link BinanceErrorCategory} so callers reason
 * about failures without decoding venue codes. No secret material is ever placed in an error message.
 */
import { HttpError, type HttpResponse } from '@platform/http-client';
import type { BinanceErrorBody } from './types/binance';

/** Stable, venue-neutral error categories. */
export type BinanceErrorCategory =
  | 'CONFIGURATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'RATE_LIMIT'
  | 'INVALID_REQUEST'
  | 'ORDER_REJECTED'
  | 'NOT_FOUND'
  | 'TIMESTAMP'
  | 'MARKET_CLOSED'
  | 'TRANSPORT'
  | 'CIRCUIT_OPEN'
  | 'SERVER'
  | 'UNKNOWN';

/** Base class for every error raised by the Binance provider. */
export class BinanceError extends Error {
  readonly category: BinanceErrorCategory;
  /** Whether retrying the exact same request could plausibly succeed later. */
  readonly retryable: boolean;
  override readonly cause?: unknown;
  constructor(message: string, category: BinanceErrorCategory, retryable = false, cause?: unknown) {
    super(message);
    this.name = 'BinanceError';
    this.category = category;
    this.retryable = retryable;
    this.cause = cause;
  }
}

/** A local misconfiguration (missing reference, unknown provider) — fails closed, never retried. */
export class BinanceConfigurationError extends BinanceError {
  constructor(message: string) {
    super(message, 'CONFIGURATION', false);
    this.name = 'BinanceConfigurationError';
  }
}

/** A venue-reported error carrying the Binance `{ code, msg }` and originating HTTP status. */
export class BinanceApiError extends BinanceError {
  readonly code: number;
  readonly httpStatus: number;
  constructor(
    code: number,
    msg: string,
    httpStatus: number,
    category: BinanceErrorCategory,
    retryable: boolean,
  ) {
    super(`Binance error ${code}: ${msg} (HTTP ${httpStatus})`, category, retryable);
    this.name = 'BinanceApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/** Binance error codes with a known, stable classification. */
const CODE_CATEGORY: Readonly<Record<number, BinanceErrorCategory>> = {
  [-1003]: 'RATE_LIMIT',
  [-1021]: 'TIMESTAMP',
  [-1022]: 'AUTHENTICATION',
  [-1099]: 'AUTHORIZATION',
  [-1100]: 'INVALID_REQUEST',
  [-1102]: 'INVALID_REQUEST',
  [-1121]: 'INVALID_REQUEST',
  [-2010]: 'ORDER_REJECTED',
  [-2011]: 'ORDER_REJECTED',
  [-2013]: 'NOT_FOUND',
  [-2014]: 'AUTHENTICATION',
  [-2015]: 'AUTHENTICATION',
  [-1013]: 'ORDER_REJECTED',
};

function categoryForStatus(status: number): BinanceErrorCategory {
  if (status === 401) return 'AUTHENTICATION';
  if (status === 403) return 'AUTHORIZATION';
  if (status === 404) return 'NOT_FOUND';
  if (status === 418 || status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  if (status >= 400) return 'INVALID_REQUEST';
  return 'UNKNOWN';
}

function retryableCategory(category: BinanceErrorCategory): boolean {
  return (
    category === 'RATE_LIMIT' ||
    category === 'SERVER' ||
    category === 'TRANSPORT' ||
    category === 'TIMESTAMP'
  );
}

function isBinanceErrorBody(value: unknown): value is BinanceErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'number' &&
    typeof (value as { msg?: unknown }).msg === 'string'
  );
}

/** Deterministic mapper from raw failures to the canonical Binance error hierarchy. */
export class BinanceErrorMapper {
  /** Map a non-2xx HTTP response (with its parsed body) to a {@link BinanceApiError}. */
  fromResponse(response: HttpResponse<unknown>): BinanceApiError {
    const status = response.status;
    if (isBinanceErrorBody(response.body)) {
      const category = CODE_CATEGORY[response.body.code] ?? categoryForStatus(status);
      return new BinanceApiError(
        response.body.code,
        response.body.msg,
        status,
        category,
        retryableCategory(category),
      );
    }
    const category = categoryForStatus(status);
    return new BinanceApiError(
      0,
      response.statusText || 'HTTP error',
      status,
      category,
      retryableCategory(category),
    );
  }

  /** Map a thrown transport/resilience error onto the canonical hierarchy. */
  fromHttpError(error: HttpError): BinanceError {
    switch (error.kind) {
      case 'rate_limited':
        return new BinanceError(error.message, 'RATE_LIMIT', true, error);
      case 'circuit_open':
        return new BinanceError(error.message, 'CIRCUIT_OPEN', true, error);
      case 'timeout':
      case 'transport':
      case 'aborted':
        return new BinanceError(error.message, 'TRANSPORT', true, error);
      case 'validation':
      case 'serialize':
        return new BinanceError(error.message, 'INVALID_REQUEST', false, error);
      default:
        return new BinanceError(error.message, 'UNKNOWN', false, error);
    }
  }

  /** Map any thrown value to a {@link BinanceError} (idempotent for already-canonical errors). */
  map(error: unknown): BinanceError {
    if (error instanceof BinanceError) return error;
    if (error instanceof HttpError) return this.fromHttpError(error);
    if (error instanceof Error) return new BinanceError(error.message, 'UNKNOWN', false, error);
    return new BinanceError('Unknown Binance provider error.', 'UNKNOWN', false, error);
  }
}
