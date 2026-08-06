/**
 * The scheduler abstraction — the single seam for time and delays, which is what makes the whole
 * Retry & Timeout Engine deterministic and testable. `SystemScheduler` uses the host timers; the
 * `ManualScheduler` gives tests (and benchmarks) full control over the clock. Nothing else in the
 * engine calls `Date.now`, `setTimeout` or `Math.random` directly.
 */

/** A cancellable scheduled callback. */
export type Cancel = () => void;

export interface Scheduler {
  /** The current time in epoch milliseconds. */
  now(): number;
  /** Resolve after `ms`, or reject if `signal` aborts first. */
  sleep(ms: number, signal?: AbortSignal): Promise<void>;
  /** Run `callback` after `ms`; returns a cancel handle. */
  schedule(callback: () => void, ms: number): Cancel;
}

/** Raised when a `sleep` is cancelled by its abort signal. */
export class SleepAbortedError extends Error {
  constructor() {
    super('Sleep aborted.');
    this.name = 'SleepAbortedError';
  }
}

/** The production scheduler, backed by the host `setTimeout`/`Date.now`. */
export class SystemScheduler implements Scheduler {
  now(): number {
    return Date.now();
  }
  schedule(callback: () => void, ms: number): Cancel {
    const handle = setTimeout(callback, ms);
    return () => clearTimeout(handle);
  }
  sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0)
      return signal?.aborted ? Promise.reject(new SleepAbortedError()) : Promise.resolve();
    return new Promise((resolve, reject) => {
      const cancel = this.schedule(() => {
        cleanup();
        resolve();
      }, ms);
      const onAbort = (): void => {
        cleanup();
        reject(new SleepAbortedError());
      };
      const cleanup = (): void => {
        cancel();
        signal?.removeEventListener('abort', onAbort);
      };
      if (signal) {
        if (signal.aborted) {
          cleanup();
          reject(new SleepAbortedError());
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }
}

interface Timer {
  readonly time: number;
  readonly callback: () => void;
  active: boolean;
}

/**
 * A deterministic, controllable scheduler. In `autoAdvanceSleep` mode (the default), `sleep`
 * resolves immediately while advancing the virtual clock by the requested amount — ideal for retry
 * tests that assert *chosen* delays without real waiting. With `autoAdvanceSleep: false`, timers fire
 * only when the test calls `advance`/`flush`, which is what timeout tests need.
 */
export class ManualScheduler implements Scheduler {
  private clock: number;
  private readonly timers: Timer[] = [];
  private readonly autoAdvanceSleep: boolean;

  constructor(options: { readonly startAt?: number; readonly autoAdvanceSleep?: boolean } = {}) {
    this.clock = options.startAt ?? 0;
    this.autoAdvanceSleep = options.autoAdvanceSleep ?? true;
  }

  now(): number {
    return this.clock;
  }

  schedule(callback: () => void, ms: number): Cancel {
    const timer: Timer = { time: this.clock + Math.max(0, ms), callback, active: true };
    this.timers.push(timer);
    return () => {
      timer.active = false;
    };
  }

  sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(new SleepAbortedError());
    if (this.autoAdvanceSleep) {
      this.clock += Math.max(0, ms);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const cancel = this.schedule(resolve, ms);
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            cancel();
            reject(new SleepAbortedError());
          },
          { once: true },
        );
      }
    });
  }

  /** Advance the virtual clock by `ms`, firing every timer that becomes due (in time order). */
  advance(ms: number): void {
    const target = this.clock + ms;
    for (;;) {
      const due = this.timers
        .filter((t) => t.active && t.time <= target)
        .sort((a, b) => a.time - b.time)[0];
      if (!due) break;
      this.clock = due.time;
      due.active = false;
      due.callback();
    }
    this.clock = target;
  }

  /** Fire every remaining timer immediately (in time order). */
  flush(): void {
    const pending = this.timers.filter((t) => t.active).sort((a, b) => a.time - b.time);
    for (const timer of pending) {
      if (!timer.active) continue;
      this.clock = Math.max(this.clock, timer.time);
      timer.active = false;
      timer.callback();
    }
  }
}
