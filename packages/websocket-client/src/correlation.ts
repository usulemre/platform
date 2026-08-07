/**
 * `Correlator` — request/response correlation over a full-duplex socket. A request is sent with a
 * correlation id; `register` returns a promise that resolves when a response bearing that id arrives,
 * or rejects on timeout / connection loss. Deterministic: timeouts are driven by the injected
 * `Scheduler`.
 */
import type { Cancel, Scheduler } from '@platform/http-client';
import { ProtocolError, type WebSocketError } from './errors';

interface Pending {
  readonly resolve: (message: unknown) => void;
  readonly reject: (error: WebSocketError) => void;
  cancelTimer?: Cancel;
}

export class Correlator {
  private readonly pending = new Map<string, Pending>();

  constructor(private readonly scheduler: Scheduler) {}

  /** Register a pending request; resolves on `resolve(id, msg)` or rejects on timeout. */
  register(id: string, timeoutMs = 0): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const entry: Pending = { resolve, reject };
      if (timeoutMs > 0) {
        entry.cancelTimer = this.scheduler.schedule(() => {
          this.pending.delete(id);
          reject(new ProtocolError(`Request "${id}" timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }
      this.pending.set(id, entry);
    });
  }

  has(id: string): boolean {
    return this.pending.has(id);
  }
  get size(): number {
    return this.pending.size;
  }

  resolve(id: string, message: unknown): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    entry.cancelTimer?.();
    this.pending.delete(id);
    entry.resolve(message);
    return true;
  }
  reject(id: string, error: WebSocketError): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    entry.cancelTimer?.();
    this.pending.delete(id);
    entry.reject(error);
    return true;
  }

  /** Reject every pending request (e.g. on connection loss). */
  rejectAll(error: WebSocketError): void {
    for (const [id, entry] of this.pending) {
      entry.cancelTimer?.();
      entry.reject(error);
      this.pending.delete(id);
    }
  }
}
