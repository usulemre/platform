/**
 * `RateLimiter` — the public facade for one scope. It composes a rate-limit algorithm, a concurrency
 * `PermitManager` and a priority `RequestQueue` behind a `RequestScheduler`, exposing `acquire`
 * (async, queuing), `tryAcquire` (non-blocking), `execute` (acquire → run → release), dynamic quota
 * updates, and metrics. Deterministic: all time and timers come from the injected `Scheduler`.
 *
 * Thread-safety note: JavaScript is single-threaded; permit accounting and queue mutations happen
 * synchronously with no interleaving `await`, so concurrent in-flight requests observe a consistent
 * limiter state.
 */
import type { Scheduler } from '@platform/http-client';
import type { RateLimitParams } from './algorithms';
import { createRateLimitContext } from './context';
import { RateLimitMetrics, type RateLimitMetricsSnapshot } from './metrics';
import { PermitManager, type Permit } from './permit';
import { createAlgorithm, type RateLimitPolicy } from './policy';
import { RequestQueue } from './queue';
import { RequestScheduler } from './request-scheduler';

export interface AcquireOptions {
  readonly weight?: number;
  readonly priority?: number;
  readonly signal?: AbortSignal;
  readonly maxWaitMs?: number;
  readonly requestId?: string;
}

export interface RateLimiterDeps {
  readonly scheduler: Scheduler;
}

export interface QuotaUpdate {
  readonly params?: RateLimitParams;
  readonly maxConcurrent?: number;
}

export interface RateLimiterSnapshot {
  readonly scope: string;
  readonly algorithm: string;
  readonly available: number;
  readonly inFlight: number;
  readonly queued: number;
  readonly metrics: RateLimitMetricsSnapshot;
}

export class RateLimiter {
  readonly scope: string;
  private readonly policy: RateLimitPolicy;
  private readonly scheduler: Scheduler;
  private readonly metrics = new RateLimitMetrics();
  private readonly requestScheduler: RequestScheduler;

  constructor(scope: string, policy: RateLimitPolicy, deps: RateLimiterDeps) {
    this.scope = scope;
    this.policy = policy;
    this.scheduler = deps.scheduler;
    const now = this.scheduler.now();
    this.requestScheduler = new RequestScheduler({
      scope,
      scheduler: this.scheduler,
      algorithm: createAlgorithm(policy, now),
      permits: new PermitManager(policy.maxConcurrent),
      queue: new RequestQueue(policy.maxQueue),
      metrics: this.metrics,
    });
  }

  private context(options: AcquireOptions) {
    return createRateLimitContext({
      scope: this.scope,
      weight: options.weight ?? this.policy.defaultWeight,
      priority: options.priority ?? 0,
      enqueuedAt: this.scheduler.now(),
      requestId: options.requestId,
    });
  }

  /** Acquire a permit, queuing and waiting when capacity is unavailable. */
  acquire(options: AcquireOptions = {}): Promise<Permit> {
    return this.requestScheduler.schedule(
      this.context(options),
      options.signal,
      options.maxWaitMs ?? this.policy.maxWaitMs,
    );
  }

  /** Non-blocking attempt: returns immediately whether a permit was granted. */
  tryAcquire(options: AcquireOptions = {}): {
    readonly allowed: boolean;
    readonly permit?: Permit;
    readonly retryAfterMs: number;
  } {
    return this.requestScheduler.tryAcquire(this.context(options), this.scheduler.now());
  }

  /** Acquire, run the operation, and release the permit (even on failure). */
  async execute<T>(operation: () => Promise<T>, options: AcquireOptions = {}): Promise<T> {
    const permit = await this.acquire(options);
    try {
      return await operation();
    } finally {
      permit.release();
    }
  }

  /** Apply a dynamic quota update (rate params and/or concurrency cap). */
  updateQuota(update: QuotaUpdate): void {
    this.requestScheduler.updateQuota(update.params, update.maxConcurrent, this.scheduler.now());
  }

  available(now: number = this.scheduler.now()): number {
    return this.requestScheduler.available(now);
  }
  snapshot(now: number = this.scheduler.now()): RateLimiterSnapshot {
    return {
      scope: this.scope,
      algorithm: this.policy.algorithm,
      available: this.requestScheduler.available(now),
      inFlight: this.requestScheduler.inFlight(),
      queued: this.requestScheduler.queued(),
      metrics: this.metrics.snapshot(),
    };
  }
  metricsSnapshot(): RateLimitMetricsSnapshot {
    return this.metrics.snapshot();
  }
  reset(now: number = this.scheduler.now()): void {
    this.requestScheduler.reset(now);
  }
}
