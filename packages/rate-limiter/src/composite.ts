/**
 * `CompositeRateLimiter` — enforces several limiters together (e.g. GLOBAL ∧ PROVIDER ∧ ENDPOINT). A
 * request must acquire a permit from every limiter, in order; if any fails, the already-acquired
 * permits are released so no capacity leaks. The composite permit releases all underlying permits.
 */
import { createRateLimitContext } from './context';
import type { AcquireOptions, RateLimiter } from './limiter';
import type { Permit } from './permit';

export class CompositeRateLimiter {
  constructor(private readonly limiters: readonly RateLimiter[]) {}

  /** Acquire a permit from every underlying limiter (releasing on partial failure). */
  async acquire(options: AcquireOptions = {}): Promise<Permit> {
    const acquired: Permit[] = [];
    try {
      for (const limiter of this.limiters) acquired.push(await limiter.acquire(options));
    } catch (error) {
      for (const permit of acquired) permit.release();
      throw error;
    }
    return this.combine(acquired, options);
  }

  async execute<T>(operation: () => Promise<T>, options: AcquireOptions = {}): Promise<T> {
    const permit = await this.acquire(options);
    try {
      return await operation();
    } finally {
      permit.release();
    }
  }

  private combine(permits: readonly Permit[], options: AcquireOptions): Permit {
    let released = false;
    const context = createRateLimitContext({
      scope: this.limiters.map((l) => l.scope).join('+'),
      weight: options.weight ?? 1,
      priority: options.priority ?? 0,
      enqueuedAt: permits[0]?.acquiredAt ?? 0,
      requestId: options.requestId,
    });
    return {
      context,
      acquiredAt: permits[0]?.acquiredAt ?? 0,
      get released() {
        return released;
      },
      release() {
        if (released) return;
        released = true;
        for (const permit of [...permits].reverse()) permit.release();
      },
    };
  }
}
