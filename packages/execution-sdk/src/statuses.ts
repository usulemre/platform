/**
 * Shared Execution Simulator status vocabularies + pure run-control / order-state
 * predicates, used identically across the execution-simulator service and its UIs.
 * Vocabulary + pure predicates only — no execution algorithm, no exchange/broker
 * connectivity, no fill/price calculation.
 */
export type RunStatus = 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/** The canonical simulated order states (all inert; no state machine executes here). */
export type OrderStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'QUEUED'
  | 'SUBMITTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export const ORDER_STATES: readonly OrderStatus[] = [
  'CREATED',
  'VALIDATED',
  'QUEUED',
  'SUBMITTED',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
];

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ReviewStatus = 'PENDING' | 'PASSED' | 'CHANGES_REQUESTED';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** A session run can be cancelled while it is queued, running or paused. */
export function canCancel(status: RunStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING' || status === 'PAUSED';
}

/** A session run can be retried after it failed or was cancelled. */
export function canRetry(status: RunStatus): boolean {
  return status === 'FAILED' || status === 'CANCELLED';
}

/** A running session run can be paused. */
export function canPause(status: RunStatus): boolean {
  return status === 'RUNNING';
}

/** A paused session run can be resumed. */
export function canResume(status: RunStatus): boolean {
  return status === 'PAUSED';
}

/** A completed session can be replayed (re-simulated deterministically). */
export function canReplay(status: RunStatus): boolean {
  return status === 'COMPLETED';
}

/** Whether a session run is actively in flight (queued, running or paused). */
export function isActiveRun(status: RunStatus): boolean {
  return status === 'QUEUED' || status === 'RUNNING' || status === 'PAUSED';
}

/** Whether an order state is terminal (no further simulated transitions). */
export function isTerminalOrder(status: OrderStatus): boolean {
  return (
    status === 'FILLED' || status === 'CANCELLED' || status === 'REJECTED' || status === 'EXPIRED'
  );
}
