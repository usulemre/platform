/**
 * The storage error hierarchy. Every persistence failure the layer recognises is a typed error with a
 * stable `code`, so failures are observable and never silently swallowed (the platform rule: invalid
 * or un-persistable market data is rejected/quarantined with a reason, never dropped). On the normal
 * write path callers receive structured {@link WriteResult}s and dead-letter entries rather than
 * thrown errors; these types classify the underlying cause and back the storage-engine seam.
 */

/** Stable, machine-readable classification of a storage failure. */
export type StorageErrorCode =
  | 'SCHEMA_INCOMPATIBLE'
  | 'REQUIRED_FIELD_MISSING'
  | 'TIMESTAMP_INVALID'
  | 'INSTRUMENT_INVALID'
  | 'SEQUENCE_INVALID'
  | 'NUMERIC_INVALID'
  | 'IDENTITY_UNRESOLVABLE'
  | 'ENGINE_UNAVAILABLE'
  | 'WRITE_FAILED'
  | 'RETENTION_FAILED';

/** Base class for every storage error. */
export class StorageError extends Error {
  readonly code: StorageErrorCode;

  constructor(code: StorageErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/** A canonical record that fails storage-schema validation before persistence. */
export class StorageValidationError extends StorageError {}

/** The persistence engine is unavailable (connection/transaction failure, timeout, capacity). */
export class StorageEngineError extends StorageError {
  readonly reason?: unknown;

  constructor(message: string, code: StorageErrorCode = 'ENGINE_UNAVAILABLE', reason?: unknown) {
    super(code, message);
    this.reason = reason;
  }
}
