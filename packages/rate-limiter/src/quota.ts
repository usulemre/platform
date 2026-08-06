/**
 * `QuotaManager` — the runtime surface for dynamic quota updates. Providers often learn their true
 * limits from response headers; the quota manager pushes those updates into the live limiters
 * (rate params and/or concurrency) without recreating them, so in-flight and queued requests continue
 * under the new quota. It also records the last-known quota per scope for observability.
 */
import type { RateLimitParams } from './algorithms';
import type { QuotaUpdate } from './limiter';
import type { RateLimiterRegistry } from './registry';

export interface QuotaSnapshot {
  readonly scope: string;
  readonly params?: RateLimitParams;
  readonly maxConcurrent?: number;
  readonly updatedAt: number;
}

export class QuotaManager {
  private readonly quotas = new Map<string, QuotaSnapshot>();

  constructor(
    private readonly registry: RateLimiterRegistry,
    private readonly now: () => number,
  ) {}

  /** Push a dynamic quota update to a live limiter (no-op if the scope has no limiter yet). */
  update(scope: string, update: QuotaUpdate): boolean {
    const limiter = this.registry.get(scope);
    if (!limiter) return false;
    limiter.updateQuota(update);
    this.quotas.set(scope, {
      scope,
      params: update.params,
      maxConcurrent: update.maxConcurrent,
      updatedAt: this.now(),
    });
    return true;
  }

  /** The last quota applied to a scope, if any. */
  get(scope: string): QuotaSnapshot | undefined {
    return this.quotas.get(scope);
  }
  snapshot(): readonly QuotaSnapshot[] {
    return [...this.quotas.values()];
  }
}
