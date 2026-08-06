/**
 * Shared Live Trading Platform status vocabularies + pure control / order-state
 * predicates, used identically across the live-trading service and its UIs. Vocabulary +
 * pure predicates only — NO exchange/broker connectivity, NO order execution, NO
 * REST/WebSocket/FIX.
 *
 * The kill switch and emergency stop are ALWAYS available to authorized humans and are
 * never gated by AI or by this SDK's predicates (which describe only whether a *normal*
 * runtime control is structurally applicable).
 */

/** The runtime state of a production deployment. */
export type RuntimeStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'HALTED';

/** The canonical production order states (all inert; no state machine executes here). */
export type OrderStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'PARTIALLY_FILLED'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'EXPIRED';

export const ORDER_STATES: readonly OrderStatus[] = [
  'CREATED',
  'VALIDATED',
  'SUBMITTED',
  'ACCEPTED',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
];

/** The default execution posture; LIVE requires a valid governance authorization token. */
export type ExecutionMode = 'PAPER' | 'SHADOW' | 'LIVE';

/** The connection state of a broker/exchange abstraction (no real connectivity here). */
export type ConnectionStatus = 'DISCONNECTED' | 'CONFIGURED' | 'AUTHORIZED' | 'ERROR';

/** The health state of a running deployment (reported, never computed here). */
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUESTED';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';

export type DependencyStatus = 'SATISFIED' | 'PENDING' | 'MISSING';

/** The state of the kill switch (always operable by authorized humans). */
export type KillSwitchStatus = 'ARMED' | 'ENGAGED';

/** A running deployment can be paused. */
export function canPause(status: RuntimeStatus): boolean {
  return status === 'RUNNING';
}

/** A paused deployment can be resumed. */
export function canResume(status: RuntimeStatus): boolean {
  return status === 'PAUSED';
}

/** A running or paused deployment can be stopped. */
export function canStop(status: RuntimeStatus): boolean {
  return status === 'RUNNING' || status === 'PAUSED';
}

/** A stopped or halted deployment can be restarted (subject to re-authorization). */
export function canRestart(status: RuntimeStatus): boolean {
  return status === 'STOPPED' || status === 'HALTED';
}

/**
 * Whether an emergency stop is applicable — for any deployment that is not already
 * stopped. Emergency stop is a human authority and is never blocked by AI.
 */
export function canEmergencyStop(status: RuntimeStatus): boolean {
  return status !== 'STOPPED';
}

/** Whether a deployment is actively trading (running or paused). */
export function isActiveDeployment(status: RuntimeStatus): boolean {
  return status === 'RUNNING' || status === 'PAUSED';
}

/** Whether a deployment is halted (e.g. by the kill switch). */
export function isHalted(status: RuntimeStatus): boolean {
  return status === 'HALTED';
}

/** Whether an order state is terminal (no further transitions). */
export function isTerminalOrder(status: OrderStatus): boolean {
  return (
    status === 'FILLED' || status === 'CANCELLED' || status === 'REJECTED' || status === 'EXPIRED'
  );
}

/** Whether an order is still open (not terminal). */
export function isOpenOrder(status: OrderStatus): boolean {
  return !isTerminalOrder(status);
}
