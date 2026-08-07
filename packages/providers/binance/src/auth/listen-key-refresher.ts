/**
 * `ListenKeyRefresher` — periodically keeps the active listen key alive via an injected `Scheduler`
 * (reused from the HTTP client foundation), so the user data stream never lapses. Binance recommends a
 * keep-alive well within the 60-minute validity window; the default interval is 30 minutes. On a
 * keep-alive failure (e.g. the key already expired) it recreates the key through the
 * {@link ListenKeyManager} and reports the outcome via callbacks. All timing is injected, so the
 * refresher is fully deterministic under a manual scheduler.
 */
import type { Cancel, Scheduler } from '@platform/http-client';
import type { ListenKeyManager } from './listen-key-manager';

/** Default keep-alive interval: 30 minutes (well within the 60-minute validity). */
export const DEFAULT_KEEPALIVE_INTERVAL_MS = 30 * 60 * 1000;

export interface ListenKeyRefresherCallbacks {
  readonly onKeepAlive?: () => void;
  readonly onRecreate?: (listenKey: string) => void;
  readonly onError?: (error: Error) => void;
}

export interface ListenKeyRefresherDeps {
  readonly manager: ListenKeyManager;
  readonly scheduler: Scheduler;
  readonly intervalMs?: number;
  readonly callbacks?: ListenKeyRefresherCallbacks;
}

export class ListenKeyRefresher {
  private readonly manager: ListenKeyManager;
  private readonly scheduler: Scheduler;
  private readonly intervalMs: number;
  private readonly callbacks?: ListenKeyRefresherCallbacks;
  private timer?: Cancel;
  private running = false;

  constructor(deps: ListenKeyRefresherDeps) {
    this.manager = deps.manager;
    this.scheduler = deps.scheduler;
    this.intervalMs = deps.intervalMs ?? DEFAULT_KEEPALIVE_INTERVAL_MS;
    this.callbacks = deps.callbacks;
  }

  /** Whether the refresher is currently scheduling keep-alives. */
  get isRunning(): boolean {
    return this.running;
  }

  /** Start the periodic keep-alive loop (idempotent). */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.schedule();
  }

  /** Stop the loop and cancel any pending keep-alive. */
  stop(): void {
    this.running = false;
    this.timer?.();
    this.timer = undefined;
  }

  /** Run a single keep-alive now (recreating the key on failure). Returns the active key. */
  async refreshOnce(): Promise<string | undefined> {
    try {
      await this.manager.keepAlive();
      this.callbacks?.onKeepAlive?.();
      return this.manager.key;
    } catch {
      try {
        const key = await this.manager.create();
        this.callbacks?.onRecreate?.(key);
        return key;
      } catch (recreateError) {
        this.callbacks?.onError?.(recreateError as Error);
        return undefined;
      }
    }
  }

  private schedule(): void {
    this.timer = this.scheduler.schedule(() => {
      this.timer = undefined;
      if (!this.running) return;
      void this.refreshOnce().finally(() => {
        if (this.running) this.schedule();
      });
    }, this.intervalMs);
  }
}
