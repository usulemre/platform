/**
 * `CircuitStateMachine` — owns the current circuit state and applies validated transitions, emitting a
 * `STATE_CHANGED` event on every actual change. Transition validity is governed by the `state.ts`
 * table; a no-op transition (same state) is silently ignored. Synchronous and atomic within the
 * single-threaded event loop.
 */
import { CircuitEventEmitter } from './events';
import { canTransition, type CircuitState } from './state';

export class CircuitStateMachine {
  private current: CircuitState;

  constructor(
    private readonly name: string,
    private readonly emitter: CircuitEventEmitter,
    initial: CircuitState = 'CLOSED',
  ) {
    this.current = initial;
  }

  get state(): CircuitState {
    return this.current;
  }

  /** Apply a transition; returns whether the state actually changed. Emits `STATE_CHANGED` if so. */
  transition(to: CircuitState, reason: string, at: number): boolean {
    if (to === this.current) return false;
    if (!canTransition(this.current, to)) {
      throw new Error(`Illegal circuit transition ${this.current} → ${to} for "${this.name}".`);
    }
    const previousState = this.current;
    this.current = to;
    this.emitter.emit({
      type: 'STATE_CHANGED',
      circuit: this.name,
      state: to,
      previousState,
      reason,
      at,
    });
    return true;
  }
}
