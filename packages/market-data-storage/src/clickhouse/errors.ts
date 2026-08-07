/**
 * **ClickHouse error translation.** Raw driver/network errors are never leaked through the public
 * platform contracts; they are mapped to canonical {@link StorageEngineError}s with a stable code and
 * a `retryable` classification. Connection/timeout faults are retryable (transient); authentication,
 * schema, and parse faults are not (retrying will not help). The raw error is retained on `reason` for
 * diagnostics but is never assumed to be safe to log verbatim by callers.
 */
import { StorageEngineError, type StorageErrorCode } from '../errors';

export interface MappedError {
  readonly error: StorageEngineError;
  readonly retryable: boolean;
}

/** ClickHouse server error codes we special-case (subset relevant to storage). */
const SCHEMA_CODES = new Set(['60', '81', '47', '53', '27', '117', '73']);
const AUTH_CODES = new Set(['516', '194', '192', '193']);

function rawCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') return code;
    if (typeof code === 'number') return String(code);
  }
  return undefined;
}

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function looksLikeNetwork(text: string, code: string | undefined): boolean {
  if (code && ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'EPIPE', 'ETIMEDOUT'].includes(code)) {
    return true;
  }
  return /econnrefused|enotfound|econnreset|socket hang up|fetch failed|network|connect/i.test(
    text,
  );
}

function looksLikeTimeout(text: string, name: string | undefined): boolean {
  return (
    name === 'AbortError' || name === 'TimeoutError' || /timeout|timed out|aborted/i.test(text)
  );
}

/**
 * Translate a raw error thrown by the ClickHouse client (or the network) into a canonical storage
 * error plus a retryability verdict.
 */
export function mapClickHouseError(raw: unknown, operation: string): MappedError {
  const text = message(raw);
  const code = rawCode(raw);
  const name = raw instanceof Error ? raw.name : undefined;

  if (looksLikeNetwork(text, code)) {
    return {
      error: new StorageEngineError(
        `ClickHouse unavailable during ${operation}.`,
        'ENGINE_UNAVAILABLE',
        raw,
      ),
      retryable: true,
    };
  }
  if (looksLikeTimeout(text, name)) {
    return {
      error: new StorageEngineError(
        `ClickHouse ${operation} timed out.`,
        'ENGINE_UNAVAILABLE',
        raw,
      ),
      retryable: true,
    };
  }
  if (code && AUTH_CODES.has(code)) {
    return {
      error: new StorageEngineError(
        `ClickHouse authentication failed during ${operation}.`,
        'ENGINE_UNAVAILABLE',
        raw,
      ),
      retryable: false,
    };
  }
  if (code && SCHEMA_CODES.has(code)) {
    return {
      error: new StorageEngineError(
        `ClickHouse schema/serialization error during ${operation}.`,
        'SCHEMA_INCOMPATIBLE',
        raw,
      ),
      retryable: false,
    };
  }
  const fallbackCode: StorageErrorCode = 'WRITE_FAILED';
  return {
    error: new StorageEngineError(`ClickHouse ${operation} failed.`, fallbackCode, raw),
    retryable: false,
  };
}
