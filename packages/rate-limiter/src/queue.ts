/**
 * `RequestQueue` — the priority wait queue for permit requests. Waiters are ordered by priority
 * (higher first) and, within a priority, first-come-first-served via a monotonic sequence number. This
 * is the queue-management + backpressure surface: the scheduler enqueues when capacity is unavailable
 * and rejects when the queue is full.
 */
import type { RateLimitContext } from './context';
import type { Permit } from './permit';

export interface Waiter {
  readonly context: RateLimitContext;
  readonly seq: number;
  /** Absolute wait deadline (epoch ms); `Infinity` when unbounded. */
  readonly deadline: number;
  readonly signal?: AbortSignal;
  readonly resolve: (permit: Permit) => void;
  readonly reject: (error: Error) => void;
  /** Detach any abort listener (set by the scheduler). */
  cleanup?: () => void;
}

export class RequestQueue {
  private readonly waiters: Waiter[] = [];

  constructor(private readonly maxSize: number) {}

  get size(): number {
    return this.waiters.length;
  }
  /** Whether another waiter may be enqueued (respecting `maxSize`; 0 = unbounded). */
  get hasCapacity(): boolean {
    return this.maxSize === 0 || this.waiters.length < this.maxSize;
  }

  enqueue(waiter: Waiter): void {
    this.waiters.push(waiter);
  }

  /** The highest-priority, earliest waiter, or `undefined`. */
  peek(): Waiter | undefined {
    if (this.waiters.length === 0) return undefined;
    let best = this.waiters[0]!;
    for (const waiter of this.waiters) {
      if (
        waiter.context.priority > best.context.priority ||
        (waiter.context.priority === best.context.priority && waiter.seq < best.seq)
      ) {
        best = waiter;
      }
    }
    return best;
  }

  remove(waiter: Waiter): boolean {
    const index = this.waiters.indexOf(waiter);
    if (index < 0) return false;
    this.waiters.splice(index, 1);
    return true;
  }

  /** The earliest deadline among waiters (for scheduling a timeout wake), or `Infinity`. */
  earliestDeadline(): number {
    let earliest = Number.POSITIVE_INFINITY;
    for (const waiter of this.waiters) if (waiter.deadline < earliest) earliest = waiter.deadline;
    return earliest;
  }

  /** A snapshot of the current waiters (safe to iterate while mutating the queue). */
  list(): readonly Waiter[] {
    return [...this.waiters];
  }

  drain(): readonly Waiter[] {
    const all = [...this.waiters];
    this.waiters.length = 0;
    return all;
  }
}
