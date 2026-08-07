/**
 * Metadata-specific errors, extending the provider's canonical {@link BinanceError} hierarchy so
 * callers can catch a single family. A validation failure carries the structured error list (never any
 * secret material).
 */
import { BinanceError } from '../errors';

export class BinanceMetadataError extends BinanceError {
  readonly validationErrors: readonly string[];
  constructor(message: string, validationErrors: readonly string[] = []) {
    super(message, 'INVALID_REQUEST', false);
    this.name = 'BinanceMetadataError';
    this.validationErrors = validationErrors;
  }
}
