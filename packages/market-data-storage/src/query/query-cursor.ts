/**
 * **Keyset (cursor) pagination.** Large historical market-data queries paginate by *keyset*, never by
 * `OFFSET`: a cursor encodes the exact canonical ordering position of the last record returned, so the
 * next page resumes from precisely there — deterministic, gap-free, and O(1) to resume regardless of
 * how deep the pagination goes. The ordering key is the engine's canonical total order
 * `(primaryTime, ingestSequence)`; `ingestSequence` is the gateway's globally unique, strictly
 * increasing intake ordinal, so the key is a total order with no ties.
 *
 * A cursor is an opaque base64url token wrapping a small, versioned JSON record. It carries no
 * provider state and no storage/SQL detail — only canonical ordering coordinates plus the order it was
 * issued under. Decoding is strict: malformed, truncated, wrong-version, or tampered tokens, and
 * tokens whose order disagrees with the current query, are rejected as {@link QueryCursorError}. The
 * embedded `identity` is not required for correctness (the key is already total) but is retained for
 * validation and audit.
 */
import type { StoredEntry } from '../engine/storage-engine';
import type { QueryOrder } from './query-spec';
import { QueryCursorError } from './query-errors';

const CURSOR_VERSION = 1 as const;

/** The canonical ordering coordinates a cursor pins. */
export interface CursorPosition {
  /** Primary timestamp (epoch ms) of the last record on the page. */
  readonly primaryTime: number;
  /** Globally unique intake ordinal of that record (the total-order tiebreak). */
  readonly ingestSequence: number;
  /** The record's canonical identity (validation/audit only). */
  readonly identity: string;
  /** The order the cursor was issued under; a resumed query MUST use the same order. */
  readonly order: QueryOrder;
}

interface CursorPayload {
  readonly v: number;
  readonly t: number;
  readonly s: number;
  readonly i: string;
  readonly o: QueryOrder;
}

/** The canonical ordering key of a stored entry. */
export function entryKey(entry: StoredEntry): { primaryTime: number; ingestSequence: number } {
  return { primaryTime: entry.primaryTime, ingestSequence: entry.record.provenance.ingestSequence };
}

/** The cursor position that resumes *after* the given entry, under `order`. */
export function positionOf(entry: StoredEntry, order: QueryOrder): CursorPosition {
  return {
    primaryTime: entry.primaryTime,
    ingestSequence: entry.record.provenance.ingestSequence,
    identity: entry.identity,
    order,
  };
}

/** Compare two ordering keys: ascending by primaryTime, then by the unique ingestSequence. */
function compareKey(
  a: { primaryTime: number; ingestSequence: number },
  b: { primaryTime: number; ingestSequence: number },
): number {
  if (a.primaryTime !== b.primaryTime) return a.primaryTime - b.primaryTime;
  return a.ingestSequence - b.ingestSequence;
}

/**
 * Whether `entry` falls strictly *after* the cursor position in the cursor's order — i.e. whether it
 * belongs on a later page. For ascending order that means a strictly greater key; for descending, a
 * strictly smaller key. Equality (the boundary record itself) is excluded, so pages never overlap.
 */
export function isAfterCursor(entry: StoredEntry, cursor: CursorPosition): boolean {
  const cmp = compareKey(entryKey(entry), cursor);
  return cursor.order === 'asc' ? cmp > 0 : cmp < 0;
}

/** Encode a cursor position into an opaque, resumable token. */
export function encodeCursor(position: CursorPosition): string {
  const payload: CursorPayload = {
    v: CURSOR_VERSION,
    t: position.primaryTime,
    s: position.ingestSequence,
    i: position.identity,
    o: position.order,
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/**
 * Decode and validate an opaque cursor token. Rejects anything that is not a well-formed,
 * current-version cursor, or whose order disagrees with `expectedOrder` (a tampered or mismatched
 * cursor). Never throws a raw parse error — always a canonical {@link QueryCursorError}.
 */
export function decodeCursor(token: string, expectedOrder: QueryOrder): CursorPosition {
  if (typeof token !== 'string' || token.length === 0) {
    throw new QueryCursorError('Cursor is empty.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch (cause) {
    throw new QueryCursorError('Cursor is malformed.', cause);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new QueryCursorError('Cursor is not a valid object.');
  }
  const p = parsed as Partial<CursorPayload>;

  if (p.v !== CURSOR_VERSION) {
    throw new QueryCursorError(`Unsupported cursor version.`);
  }
  if (typeof p.t !== 'number' || !Number.isFinite(p.t)) {
    throw new QueryCursorError('Cursor primary time is invalid.');
  }
  if (typeof p.s !== 'number' || !Number.isInteger(p.s)) {
    throw new QueryCursorError('Cursor sequence is invalid.');
  }
  if (typeof p.i !== 'string' || p.i.length === 0) {
    throw new QueryCursorError('Cursor identity is invalid.');
  }
  if (p.o !== 'asc' && p.o !== 'desc') {
    throw new QueryCursorError('Cursor order is invalid.');
  }
  if (p.o !== expectedOrder) {
    throw new QueryCursorError('Cursor order does not match the query order.');
  }

  return { primaryTime: p.t, ingestSequence: p.s, identity: p.i, order: p.o };
}
