/**
 * `HeartbeatManager` — drives the ping/pong liveness cycle. It periodically calls `sendPing` and, if a
 * pong (via `pong()`) does not arrive within `timeoutMs`, invokes `onTimeout`. Deterministic: all
 * timing comes from the injected `Scheduler`; nothing uses ambient timers.
 */
import type { Cancel, Scheduler } from '@platform/http-client';

export interface HeartbeatDeps {
  readonly scheduler: Scheduler;
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly sendPing: () => void;
  readonly onTimeout: () => void;
  readonly onBeat?: () => void;
}

export class HeartbeatManager {
  private pingTimer?: Cancel;
  private timeoutTimer?: Cancel;
  private running = false;

  constructor(private readonly deps: HeartbeatDeps) {}

  get active(): boolean {
    return this.running;
  }

  /** Begin the heartbeat cycle (no-op if already running or interval ≤ 0). */
  start(): void {
    if (this.running || this.deps.intervalMs <= 0) return;
    this.running = true;
    this.schedulePing();
  }

  /** Stop the cycle and clear all timers. */
  stop(): void {
    this.running = false;
    this.pingTimer?.();
    this.timeoutTimer?.();
    this.pingTimer = undefined;
    this.timeoutTimer = undefined;
  }

  /** Record a received heartbeat response, clearing the pending timeout. */
  pong(): void {
    this.timeoutTimer?.();
    this.timeoutTimer = undefined;
  }

  private schedulePing(): void {
    this.pingTimer = this.deps.scheduler.schedule(() => this.beat(), this.deps.intervalMs);
  }

  private beat(): void {
    if (!this.running) return;
    this.deps.sendPing();
    this.deps.onBeat?.();
    this.timeoutTimer?.();
    this.timeoutTimer = this.deps.scheduler.schedule(() => {
      if (this.running) this.deps.onTimeout();
    }, this.deps.timeoutMs);
    this.schedulePing();
  }
}
