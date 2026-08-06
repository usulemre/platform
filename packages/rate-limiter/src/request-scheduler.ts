/**
 * `RequestScheduler` — the async admission engine that ties a rate-limit algorithm, the concurrency
 * `PermitManager` and the priority `RequestQueue` together. It admits a request immediately when
 * capacity is available, otherwise queues it and wakes it (via the injected `Scheduler`) exactly when
 * the rate refills, a concurrency slot frees, or the wait deadline is reached. Backpressure rejects
 * when the queue is full; cancellation and deadlines reject with a typed reason. Deterministic: all
 * time and timers come from the injected `Scheduler`.
 */
import type { Cancel, Scheduler } from '@platform/http-client';
import type { RateLimitAlgorithm, RateLimitParams } from './algorithms';
import { RateLimitRejectedError, type RateLimitReason } from './errors';
import { createPermit, PermitManager, type Permit } from './permit';
import { RequestQueue, type Waiter } from './queue';
import { RateLimitMetrics } from './metrics';
import type { RateLimitContext } from './context';

export interface RequestSchedulerDeps {
  readonly scope: string;
  readonly scheduler: Scheduler;
  readonly algorithm: RateLimitAlgorithm;
  readonly permits: PermitManager;
  readonly queue: RequestQueue;
  readonly metrics: RateLimitMetrics;
}

export class RequestScheduler {
  private readonly scope: string;
  private readonly scheduler: Scheduler;
  private readonly algorithm: RateLimitAlgorithm;
  private readonly permits: PermitManager;
  private readonly queue: RequestQueue;
  private readonly metrics: RateLimitMetrics;
  private seq = 0;
  private wakeCancel?: Cancel;

  constructor(deps: RequestSchedulerDeps) {
    this.scope = deps.scope;
    this.scheduler = deps.scheduler;
    this.algorithm = deps.algorithm;
    this.permits = deps.permits;
    this.queue = deps.queue;
    this.metrics = deps.metrics;
  }

  /** Reserve a rate token AND a concurrency slot without queuing; consumes only on success. */
  private tryAdmit(
    weight: number,
    now: number,
  ): { readonly admitted: boolean; readonly retryAfterMs: number } {
    const slotFree = this.permits.limit === 0 || this.permits.inUse < this.permits.limit;
    if (!slotFree) return { admitted: false, retryAfterMs: 0 };
    const decision = this.algorithm.tryAcquire(weight, now);
    if (!decision.allowed) return { admitted: false, retryAfterMs: decision.retryAfterMs };
    this.permits.tryAcquire();
    return { admitted: true, retryAfterMs: 0 };
  }

  /** Non-blocking attempt: admits only if the queue is empty and capacity is immediately available. */
  tryAcquire(
    context: RateLimitContext,
    now: number,
  ): { readonly allowed: boolean; readonly permit?: Permit; readonly retryAfterMs: number } {
    if (this.queue.size > 0) return { allowed: false, retryAfterMs: 0 };
    const result = this.tryAdmit(context.weight, now);
    if (!result.admitted) return { allowed: false, retryAfterMs: result.retryAfterMs };
    this.metrics.onAcquired(0);
    return {
      allowed: true,
      permit: createPermit(context, now, () => this.onRelease()),
      retryAfterMs: 0,
    };
  }

  /** Acquire a permit, queuing (and waiting) when capacity is unavailable. */
  schedule(
    context: RateLimitContext,
    signal: AbortSignal | undefined,
    maxWaitMs: number,
  ): Promise<Permit> {
    if (!this.queue.hasCapacity) {
      this.metrics.onRejected('queue-full');
      return Promise.reject(new RateLimitRejectedError(this.scope, 'queue-full'));
    }
    return new Promise<Permit>((resolve, reject) => {
      const deadline = maxWaitMs > 0 ? context.enqueuedAt + maxWaitMs : Number.POSITIVE_INFINITY;
      const waiter: Waiter = { context, seq: (this.seq += 1), deadline, signal, resolve, reject };
      if (signal) {
        const onAbort = (): void => {
          this.rejectWaiter(waiter, 'aborted');
          this.processQueue();
        };
        waiter.cleanup = () => signal.removeEventListener('abort', onAbort);
        signal.addEventListener('abort', onAbort, { once: true });
      }
      this.queue.enqueue(waiter);
      this.metrics.onQueueDepth(this.queue.size);
      this.processQueue();
    });
  }

  private onRelease(): void {
    this.permits.release();
    this.processQueue();
  }

  private sweep(now: number): void {
    for (const waiter of this.queue.list()) {
      if (waiter.signal?.aborted) this.rejectWaiter(waiter, 'aborted');
      else if (now >= waiter.deadline) this.rejectWaiter(waiter, 'timeout');
    }
  }

  private processQueue(): void {
    const now = this.scheduler.now();
    this.sweep(now);
    for (;;) {
      const waiter = this.queue.peek();
      if (!waiter) {
        this.cancelWake();
        return;
      }
      const result = this.tryAdmit(waiter.context.weight, now);
      if (result.admitted) {
        this.admitWaiter(waiter, now);
        continue;
      }
      const rateWake =
        result.retryAfterMs > 0 ? now + result.retryAfterMs : Number.POSITIVE_INFINITY;
      this.scheduleWake(Math.min(rateWake, this.queue.earliestDeadline()), now);
      return;
    }
  }

  private admitWaiter(waiter: Waiter, now: number): void {
    this.queue.remove(waiter);
    waiter.cleanup?.();
    this.metrics.onAcquired(now - waiter.context.enqueuedAt);
    waiter.resolve(createPermit(waiter.context, now, () => this.onRelease()));
  }

  private rejectWaiter(waiter: Waiter, reason: RateLimitReason): void {
    if (!this.queue.remove(waiter)) return;
    waiter.cleanup?.();
    this.metrics.onRejected(reason);
    waiter.reject(
      new RateLimitRejectedError(
        this.scope,
        reason,
        waiter.deadline === Number.POSITIVE_INFINITY
          ? 0
          : Math.max(0, waiter.deadline - this.scheduler.now()),
      ),
    );
  }

  private scheduleWake(at: number, now: number): void {
    this.cancelWake();
    if (!Number.isFinite(at)) return;
    this.wakeCancel = this.scheduler.schedule(
      () => {
        this.wakeCancel = undefined;
        this.processQueue();
      },
      Math.max(0, at - now),
    );
  }

  private cancelWake(): void {
    if (this.wakeCancel) {
      this.wakeCancel();
      this.wakeCancel = undefined;
    }
  }

  available(now: number): number {
    return this.algorithm.available(now);
  }
  inFlight(): number {
    return this.permits.inUse;
  }
  queued(): number {
    return this.queue.size;
  }

  updateQuota(
    params: RateLimitParams | undefined,
    maxConcurrent: number | undefined,
    now: number,
  ): void {
    if (params) this.algorithm.update(params, now);
    if (maxConcurrent !== undefined) this.permits.setLimit(maxConcurrent);
    this.processQueue();
  }

  reset(now: number): void {
    this.algorithm.reset(now);
    this.permits.reset();
    for (const waiter of this.queue.drain()) {
      waiter.cleanup?.();
      waiter.reject(new RateLimitRejectedError(this.scope, 'disabled'));
    }
    this.cancelWake();
  }
}
