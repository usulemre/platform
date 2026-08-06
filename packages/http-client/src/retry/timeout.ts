/**
 * The Timeout Engine — timeout policies and the `TimeoutManager` that enforces them. A per-attempt
 * timeout is enforced by deriving a child `AbortController` (linked to any parent signal), scheduling
 * an abort through the injected `Scheduler`, and running the operation with that signal. If the abort
 * fired because of the timeout, the manager raises a typed `HttpTimeoutError`. It supports a request
 * (overall) timeout plus declarative connection/read timeouts, and a per-request override.
 */
import { HttpTimeoutError } from '../errors';
import type { HttpRequest } from '../request';
import type { Scheduler } from './scheduler';

export interface TimeoutPolicy {
  /** Overall per-attempt timeout. */
  readonly requestTimeoutMs?: number;
  /** Time allotted to establish a connection (declarative; contributes to the effective timeout). */
  readonly connectionTimeoutMs?: number;
  /** Time allotted to read the response after connecting (declarative). */
  readonly readTimeoutMs?: number;
}

export const NO_TIMEOUT: TimeoutPolicy = {};

export function createTimeoutPolicy(init: TimeoutPolicy = {}): TimeoutPolicy {
  return {
    requestTimeoutMs: init.requestTimeoutMs,
    connectionTimeoutMs: init.connectionTimeoutMs,
    readTimeoutMs: init.readTimeoutMs,
  };
}

/**
 * The effective per-attempt timeout for a policy, honoring a per-request override. When both a request
 * timeout and connection+read timeouts are given, the smaller bound wins (fail fast). Returns
 * `undefined` when no timeout applies.
 */
export function effectiveTimeout(policy: TimeoutPolicy, overrideMs?: number): number | undefined {
  if (overrideMs !== undefined) return overrideMs > 0 ? overrideMs : undefined;
  const candidates: number[] = [];
  if (policy.requestTimeoutMs !== undefined) candidates.push(policy.requestTimeoutMs);
  if (policy.connectionTimeoutMs !== undefined || policy.readTimeoutMs !== undefined) {
    candidates.push((policy.connectionTimeoutMs ?? 0) + (policy.readTimeoutMs ?? 0));
  }
  const positive = candidates.filter((ms) => ms > 0);
  return positive.length > 0 ? Math.min(...positive) : undefined;
}

/** Link a parent abort signal into a child controller (propagate cancellation downward). */
function linkParent(parent: AbortSignal | undefined, controller: AbortController): () => void {
  if (!parent) return () => {};
  if (parent.aborted) {
    controller.abort();
    return () => {};
  }
  const onAbort = (): void => controller.abort();
  parent.addEventListener('abort', onAbort, { once: true });
  return () => parent.removeEventListener('abort', onAbort);
}

export class TimeoutManager {
  constructor(private readonly scheduler: Scheduler) {}

  /**
   * Run `operation` with a child signal that aborts after `timeoutMs`. If `timeoutMs` is undefined the
   * operation runs with the parent signal unchanged. A timeout-triggered failure becomes an
   * `HttpTimeoutError`; a parent-triggered abort propagates as the operation's own error.
   */
  async run<T>(
    operation: (signal: AbortSignal | undefined) => Promise<T>,
    timeoutMs: number | undefined,
    request: HttpRequest,
    parentSignal?: AbortSignal,
  ): Promise<T> {
    if (timeoutMs === undefined || timeoutMs <= 0) return operation(parentSignal);

    const controller = new AbortController();
    const unlink = linkParent(parentSignal, controller);
    let timedOut = false;
    const cancelTimer = this.scheduler.schedule(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      return await operation(controller.signal);
    } catch (error) {
      if (timedOut) throw new HttpTimeoutError(request, timeoutMs, error);
      throw error;
    } finally {
      cancelTimer();
      unlink();
    }
  }
}
