/**
 * The **ingestion buffer** — a bounded FIFO queue that decouples the fast intake path from the slower
 * store-write path and is the pipeline's backpressure point. Bounded by construction (SC-2: no
 * unbounded "hot forever" growth); when full it applies an explicit overflow policy and reports the
 * outcome so overflow is observable, never silent. The gateway consults {@link isUnderPressure} to
 * shed or slow intake under load (controlled degradation).
 */

/** What to do when an event arrives at a full buffer. */
export type OverflowPolicy = 'REJECT' | 'DROP_OLDEST' | 'DROP_NEWEST';

export type EnqueueResult =
  | { readonly accepted: true; readonly depth: number }
  | { readonly accepted: false; readonly droppedOldest: boolean; readonly depth: number };

export interface IngestionBufferConfig {
  readonly capacity: number;
  readonly overflow: OverflowPolicy;
  /** Depth (as a fraction of capacity) at/above which the buffer reports backpressure. */
  readonly highWatermark: number;
}

const DEFAULT_CONFIG: IngestionBufferConfig = {
  capacity: 10_000,
  overflow: 'REJECT',
  highWatermark: 0.8,
};

export class IngestionBuffer<T> {
  private readonly config: IngestionBufferConfig;
  private readonly queue: T[] = [];

  constructor(config: Partial<IngestionBufferConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.capacity < 1) throw new Error('Buffer capacity must be >= 1.');
  }

  /**
   * Enqueue an item. When the buffer is full: `REJECT` refuses the new item; `DROP_OLDEST` evicts the
   * head to make room; `DROP_NEWEST` refuses the new item (dropping it). The result always reports the
   * resulting depth and whether the item was accepted.
   */
  enqueue(item: T): EnqueueResult {
    if (this.queue.length < this.config.capacity) {
      this.queue.push(item);
      return { accepted: true, depth: this.queue.length };
    }
    switch (this.config.overflow) {
      case 'DROP_OLDEST':
        this.queue.shift();
        this.queue.push(item);
        return { accepted: false, droppedOldest: true, depth: this.queue.length };
      case 'REJECT':
      case 'DROP_NEWEST':
        return { accepted: false, droppedOldest: false, depth: this.queue.length };
    }
  }

  /** Remove and return up to `max` items from the head. */
  dequeue(max: number): T[] {
    if (max <= 0) return [];
    return this.queue.splice(0, max);
  }

  get depth(): number {
    return this.queue.length;
  }

  get capacity(): number {
    return this.config.capacity;
  }

  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get isFull(): boolean {
    return this.queue.length >= this.config.capacity;
  }

  /** Whether the buffer has crossed its high-watermark and intake should slow. */
  isUnderPressure(): boolean {
    return this.queue.length >= this.config.capacity * this.config.highWatermark;
  }
}
