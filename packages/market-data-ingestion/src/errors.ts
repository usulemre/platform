/**
 * The ingestion error hierarchy. Every failure mode the pipeline recognises is a typed error with a
 * stable `code`, so failures are observable and never silently swallowed (the platform rule: invalid
 * market data is rejected or quarantined with an observable reason, never dropped). These are raised
 * inside stage boundaries and translated into {@link RejectionReason}s / dead-letter records; callers
 * of the gateway receive structured results, not thrown errors, on the normal ingestion path.
 */

/** Stable, machine-readable classification of an ingestion failure. */
export type IngestionErrorCode =
  | 'SCHEMA_INVALID'
  | 'REQUIRED_FIELD_MISSING'
  | 'TIMESTAMP_INVALID'
  | 'SYMBOL_UNKNOWN'
  | 'PRICE_INVALID'
  | 'QUANTITY_INVALID'
  | 'SEQUENCE_INVALID'
  | 'DUPLICATE_EVENT'
  | 'OUT_OF_ORDER'
  | 'SEQUENCE_GAP'
  | 'IMPOSSIBLE_STATE'
  | 'ORDER_BOOK_DESYNC'
  | 'BUFFER_OVERFLOW'
  | 'STORE_FAILURE'
  | 'PROCESSING_FAILURE'
  | 'UNSUPPORTED_EVENT';

/** Base class for every ingestion error. */
export class IngestionError extends Error {
  readonly code: IngestionErrorCode;

  constructor(code: IngestionErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/** A malformed or structurally invalid event (fails schema validation). */
export class SchemaValidationError extends IngestionError {
  constructor(message: string, code: IngestionErrorCode = 'SCHEMA_INVALID') {
    super(code, message);
  }
}

/** A data-quality violation (bad price/quantity/timestamp/impossible state). */
export class DataQualityError extends IngestionError {}

/** A sequence-integrity violation (duplicate, out-of-order, or gap). */
export class SequenceError extends IngestionError {}

/** The order book could not be kept consistent (a gap forced it into a degraded state). */
export class OrderBookDesyncError extends IngestionError {
  constructor(message: string) {
    super('ORDER_BOOK_DESYNC', message);
  }
}

/** The bounded buffer rejected an event because it is full and overflow policy is REJECT. */
export class BufferOverflowError extends IngestionError {
  constructor(message: string) {
    super('BUFFER_OVERFLOW', message);
  }
}

/** The downstream canonical store failed to accept a batch. */
export class StoreFailureError extends IngestionError {
  readonly reason?: unknown;

  constructor(message: string, reason?: unknown) {
    super('STORE_FAILURE', message);
    this.reason = reason;
  }
}
