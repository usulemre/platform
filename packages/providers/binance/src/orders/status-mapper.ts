/**
 * `BinanceOrderStatusMapper` — maps documented Binance order statuses to the canonical order status and
 * validates lifecycle transitions against the documented order state model
 * (`NEW → PARTIALLY_FILLED → FILLED | CANCELED | REJECTED | EXPIRED`). Terminal states have no outgoing
 * transitions. Pure and deterministic; the mapping delegates to the shared `parse.toCanonicalStatus`.
 */
import { toCanonicalStatus } from '../mappers/parse';
import { BinanceOrderStateError } from './errors';
import type { CanonicalOrderStatus } from './canonical';

/** The documented Binance order statuses. */
export const BINANCE_ORDER_STATUSES = [
  'NEW',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELED',
  'PENDING_CANCEL',
  'REJECTED',
  'EXPIRED',
  'EXPIRED_IN_MATCH',
] as const;

const TERMINAL: ReadonlySet<CanonicalOrderStatus> = new Set([
  'FILLED',
  'CANCELED',
  'REJECTED',
  'EXPIRED',
]);

/** Allowed canonical status transitions. */
const TRANSITIONS: Readonly<Record<CanonicalOrderStatus, readonly CanonicalOrderStatus[]>> = {
  NEW: ['NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'PENDING_CANCEL', 'REJECTED', 'EXPIRED'],
  PARTIALLY_FILLED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'PENDING_CANCEL', 'EXPIRED'],
  PENDING_CANCEL: ['PENDING_CANCEL', 'CANCELED', 'PARTIALLY_FILLED', 'FILLED'],
  FILLED: [],
  CANCELED: [],
  REJECTED: [],
  EXPIRED: [],
};

export class BinanceOrderStatusMapper {
  /** Map a raw Binance status to canonical. */
  toCanonical(status: string): CanonicalOrderStatus {
    return toCanonicalStatus(status);
  }

  /** Whether a canonical status is terminal (no further transitions). */
  isTerminal(status: CanonicalOrderStatus): boolean {
    return TERMINAL.has(status);
  }

  /** Whether a transition from → to is permitted by the documented lifecycle. */
  canTransition(from: CanonicalOrderStatus, to: CanonicalOrderStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  /** Validate a transition, throwing {@link BinanceOrderStateError} when it is not permitted. */
  validateTransition(from: CanonicalOrderStatus, to: CanonicalOrderStatus): void {
    if (!this.canTransition(from, to)) throw new BinanceOrderStateError(from, to);
  }
}
