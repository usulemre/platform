/**
 * `EventDispatcher` — a lightweight, typed publish/subscribe emitter used for connection lifecycle and
 * message events. Emission is synchronous; a throwing listener never breaks the client. `WebSocketEvents`
 * is the canonical event map.
 */
import type { WebSocketError } from './errors';
import type { ConnectionState } from './state';

export interface WebSocketEvents {
  state: {
    readonly from: ConnectionState;
    readonly to: ConnectionState;
    readonly reason: string;
    readonly at: number;
  };
  open: { readonly at: number };
  message: { readonly message: unknown; readonly at: number };
  close: { readonly code: number; readonly reason: string; readonly at: number };
  error: { readonly error: WebSocketError; readonly at: number };
  reconnecting: { readonly attempt: number; readonly delayMs: number; readonly at: number };
  reconnected: { readonly attempts: number; readonly at: number };
  heartbeat: { readonly at: number };
  subscribed: { readonly topic: string; readonly at: number };
  unsubscribed: { readonly topic: string; readonly at: number };
}

export type EventListener<T> = (payload: T) => void;

export class EventDispatcher<Events> {
  private readonly listeners = new Map<keyof Events, Set<EventListener<unknown>>>();

  on<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as EventListener<unknown>);
    return () => this.off(type, listener);
  }

  once<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): () => void {
    const off = this.on(type, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  off<K extends keyof Events>(type: K, listener: EventListener<Events[K]>): void {
    this.listeners.get(type)?.delete(listener as EventListener<unknown>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of set) {
      try {
        (listener as EventListener<Events[K]>)(payload);
      } catch {
        /* a listener must never break the client */
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
