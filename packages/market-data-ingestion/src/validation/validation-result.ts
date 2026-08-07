/**
 * The shared result type for every validation/decision stage. A stage never throws on the normal
 * path: it returns a {@link Validity}. A rejection carries a stable code and a human-readable reason
 * so the failure is observable (dead-lettered/quarantined with a reason) rather than silently dropped.
 */
import type { IngestionErrorCode } from '../errors';

/** A structured rejection reason. */
export interface Rejection {
  readonly code: IngestionErrorCode;
  readonly message: string;
  /** Optional structured detail for observability (never affects control flow). */
  readonly detail?: Readonly<Record<string, number | string | boolean>>;
}

/** The outcome of a validation stage. */
export type Validity =
  | { readonly valid: true }
  | { readonly valid: false; readonly rejection: Rejection };

/** Construct an accepted result. */
export const accepted: Validity = { valid: true };

/** Construct a rejected result. */
export function rejected(
  code: IngestionErrorCode,
  message: string,
  detail?: Readonly<Record<string, number | string | boolean>>,
): Validity {
  return { valid: false, rejection: detail ? { code, message, detail } : { code, message } };
}
