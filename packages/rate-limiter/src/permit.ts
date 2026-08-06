/**
 * `Permit` and `PermitManager`. A `Permit` is the grant returned by a successful acquisition; the
 * holder MUST `release()` it when the request completes (once released, further releases are no-ops).
 * `PermitManager` is the concurrency semaphore: it bounds the number of simultaneously in-flight
 * permits (0 = unlimited). Synchronous and atomic within the single JavaScript event loop.
 */
import type { RateLimitContext } from './context';

export interface Permit {
  readonly context: RateLimitContext;
  readonly acquiredAt: number;
  readonly released: boolean;
  release(): void;
}

/** Create a permit bound to a one-shot release callback (idempotent). */
export function createPermit(
  context: RateLimitContext,
  acquiredAt: number,
  onRelease: () => void,
): Permit {
  let released = false;
  return {
    context,
    acquiredAt,
    get released() {
      return released;
    },
    release() {
      if (released) return;
      released = true;
      onRelease();
    },
  };
}

/** The concurrency semaphore. `max === 0` means unlimited. */
export class PermitManager {
  private used = 0;
  constructor(private max: number) {}

  get inUse(): number {
    return this.used;
  }
  get limit(): number {
    return this.max;
  }
  get available(): number {
    return this.max === 0 ? Number.POSITIVE_INFINITY : Math.max(0, this.max - this.used);
  }

  /** Reserve a concurrency slot; returns whether one was available. */
  tryAcquire(): boolean {
    if (this.max !== 0 && this.used >= this.max) return false;
    this.used += 1;
    return true;
  }

  release(): void {
    if (this.used > 0) this.used -= 1;
  }

  /** Change the concurrency cap at runtime (dynamic quota). */
  setLimit(max: number): void {
    this.max = max;
  }

  reset(): void {
    this.used = 0;
  }
}
