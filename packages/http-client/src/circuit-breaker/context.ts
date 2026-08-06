/**
 * `CircuitContext` — the immutable snapshot of a circuit's identity and state at the moment a call is
 * evaluated. It travels with the outcome so observers and the Monitoring Module can correlate a
 * short-circuit or a state change with a specific request.
 */
import type { CircuitState } from './state';

export interface CircuitContext {
  readonly circuit: string;
  readonly state: CircuitState;
  readonly requestId?: string;
  readonly at: number;
}

export function createCircuitContext(
  circuit: string,
  state: CircuitState,
  at: number,
  requestId?: string,
): CircuitContext {
  return { circuit, state, requestId, at };
}
