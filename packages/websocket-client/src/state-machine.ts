/**
 * `ConnectionStateMachine` — owns the current connection state and applies validated transitions,
 * emitting a `state` event on every actual change. Transition validity is governed by the `state.ts`
 * table. Synchronous and atomic within the single JavaScript event loop.
 */
import type { EventDispatcher, WebSocketEvents } from './events';
import { canTransition, type ConnectionState } from './state';

export class ConnectionStateMachine {
  private current: ConnectionState;

  constructor(
    private readonly events: EventDispatcher<WebSocketEvents>,
    initial: ConnectionState = 'DISCONNECTED',
  ) {
    this.current = initial;
  }

  get state(): ConnectionState {
    return this.current;
  }

  /** Apply a transition; returns whether the state changed. Emits `state` if so. */
  transition(to: ConnectionState, reason: string, at: number): boolean {
    if (to === this.current) return false;
    if (!canTransition(this.current, to))
      throw new Error(`Illegal WebSocket transition ${this.current} → ${to}.`);
    const from = this.current;
    this.current = to;
    this.events.emit('state', { from, to, reason, at });
    return true;
  }
}
