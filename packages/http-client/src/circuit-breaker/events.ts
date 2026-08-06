/**
 * `CircuitEvents` — the observable lifecycle of a circuit breaker. A small synchronous emitter lets
 * the Monitoring Module (or any observer) subscribe to state changes, permitted/rejected calls and
 * recorded outcomes. Emission is synchronous and side-effect-isolated: a throwing listener never
 * corrupts the breaker's state.
 */
import type { CircuitState } from './state';

export type CircuitEventType =
  | 'STATE_CHANGED'
  | 'CALL_PERMITTED'
  | 'CALL_REJECTED'
  | 'SUCCESS_RECORDED'
  | 'FAILURE_RECORDED'
  | 'OUTCOME_IGNORED'
  | 'RESET';

export interface CircuitEvent {
  readonly type: CircuitEventType;
  readonly circuit: string;
  readonly state: CircuitState;
  readonly previousState?: CircuitState;
  readonly reason?: string;
  readonly at: number;
}

export type CircuitEventListener = (event: CircuitEvent) => void;

export class CircuitEventEmitter {
  private readonly listeners = new Set<CircuitEventListener>();

  /** Subscribe; returns an unsubscribe function. */
  on(listener: CircuitEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: CircuitEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        /* a listener must never break the breaker */
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
