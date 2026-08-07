/**
 * **Canonical query errors.** Every failure the Query Engine surfaces is a typed {@link QueryError}
 * with a stable, machine-readable `code`. Storage- and database-specific failures (including raw
 * ClickHouse driver/network errors) are translated here into canonical query errors with generic,
 * safe messages — the public read contract never leaks SQL text, ClickHouse server codes, credentials,
 * or driver internals. The originating error is retained on `cause` for internal diagnostics only and
 * is never assumed safe to surface to callers.
 */
import { StorageError } from '../errors';

/** Stable classification of a query failure. */
export type QueryErrorCode =
  | 'QUERY_INVALID'
  | 'CURSOR_INVALID'
  | 'TIME_RANGE_INVALID'
  | 'SEQUENCE_RANGE_INVALID'
  | 'LIMIT_INVALID'
  | 'UNSUPPORTED_MARKET_DATA_TYPE'
  | 'QUERY_TIMEOUT'
  | 'QUERY_CANCELLED'
  | 'STORAGE_UNAVAILABLE'
  | 'SERIALIZATION_ERROR'
  | 'CORRUPTED_DATA'
  | 'QUERY_FAILED';

/** Base class for every query error. */
export class QueryError extends Error {
  readonly code: QueryErrorCode;
  /** The originating error, for internal diagnostics only — never surfaced to consumers. */
  override readonly cause?: unknown;

  constructor(code: QueryErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    if (cause !== undefined) this.cause = cause;
  }
}

/** A query rejected by validation before any storage access. */
export class QueryValidationError extends QueryError {}

/** A malformed, tampered, or incompatible pagination cursor. */
export class QueryCursorError extends QueryValidationError {
  constructor(message: string, cause?: unknown) {
    super('CURSOR_INVALID', message, cause);
  }
}

/** True when a value is (or wraps) an abort/timeout signal from a cancelled operation. */
function isAbort(raw: unknown): boolean {
  if (raw instanceof Error) {
    if (raw.name === 'AbortError') return true;
    if (raw.name === 'TimeoutError') return true;
  }
  return false;
}

/**
 * Translate any failure raised while executing a query into a canonical {@link QueryError} with a
 * safe, generic message. Already-canonical {@link QueryError}s pass through unchanged. Storage-layer
 * {@link StorageError}s are re-classified by their code; abort/timeout signals become
 * `QUERY_TIMEOUT`; anything else becomes an opaque `QUERY_FAILED`. Raw messages from the underlying
 * driver are never copied into the public message.
 */
export function mapToQueryError(raw: unknown): QueryError {
  if (raw instanceof QueryError) return raw;

  if (isAbort(raw)) {
    return new QueryError('QUERY_TIMEOUT', 'The query timed out or was aborted.', raw);
  }

  if (raw instanceof StorageError) {
    switch (raw.code) {
      case 'ENGINE_UNAVAILABLE':
        return new QueryError('STORAGE_UNAVAILABLE', 'Market-data storage is unavailable.', raw);
      case 'SCHEMA_INCOMPATIBLE':
        return new QueryError(
          'SERIALIZATION_ERROR',
          'A stored record could not be deserialized.',
          raw,
        );
      case 'NUMERIC_INVALID':
      case 'TIMESTAMP_INVALID':
      case 'IDENTITY_UNRESOLVABLE':
        return new QueryError('CORRUPTED_DATA', 'A stored record failed integrity checks.', raw);
      default:
        return new QueryError('QUERY_FAILED', 'The query could not be completed.', raw);
    }
  }

  if (raw instanceof SyntaxError) {
    return new QueryError('SERIALIZATION_ERROR', 'A stored record could not be deserialized.', raw);
  }

  return new QueryError('QUERY_FAILED', 'The query could not be completed.', raw);
}
