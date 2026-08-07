/**
 * The **duplicate detector** — a bounded, per-stream memory of recently seen sequence numbers. It
 * catches exact replays that the {@link SequenceValidator} alone would miss (a re-delivered event
 * whose sequence is below the current high-water mark, e.g. after a provider reconnect that replays a
 * window). Memory is bounded per stream (LRU by insertion) so a long-running stream cannot grow the
 * detector without limit — controlled degradation over unbounded state.
 */
export class DuplicateDetector {
  private readonly windowSize: number;
  private readonly seen = new Map<string, Set<number>>();
  private readonly order = new Map<string, number[]>();

  constructor(windowSize = 4096) {
    if (windowSize < 1) throw new Error('DuplicateDetector window size must be >= 1.');
    this.windowSize = windowSize;
  }

  /**
   * Record `sequence` for `streamKey`. Returns `true` if it was already seen within the window (a
   * duplicate), `false` otherwise. New sequences are remembered, evicting the oldest when the window
   * is exceeded.
   */
  check(streamKey: string, sequence: number): boolean {
    let set = this.seen.get(streamKey);
    let queue = this.order.get(streamKey);
    if (!set || !queue) {
      set = new Set<number>();
      queue = [];
      this.seen.set(streamKey, set);
      this.order.set(streamKey, queue);
    }
    if (set.has(sequence)) return true;
    set.add(sequence);
    queue.push(sequence);
    if (queue.length > this.windowSize) {
      const evicted = queue.shift();
      if (evicted !== undefined) set.delete(evicted);
    }
    return false;
  }

  /** Drop a stream's memory entirely. */
  reset(streamKey: string): void {
    this.seen.delete(streamKey);
    this.order.delete(streamKey);
  }
}
