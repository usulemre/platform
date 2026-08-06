/**
 * `RetryMetrics` — a deterministic, in-memory collector of retry statistics fed one `RetryResult` at a
 * time. It counts requests, attempts and retries, tracks how often a retry rescued a request, how
 * often retries were exhausted, and the distribution of final outcome categories. Snapshots are plain,
 * immutable data suitable for the Monitoring Module. No IO.
 */
import type { RetryCategory } from './classify';
import type { RetryResult } from './executor';

export interface RetryMetricsSnapshot {
  readonly totalRequests: number;
  readonly totalAttempts: number;
  readonly totalRetries: number;
  /** Requests that were retried at least once. */
  readonly retriedRequests: number;
  /** Requests that ultimately succeeded (2xx) after one or more retries. */
  readonly successAfterRetry: number;
  /** Requests that stopped because the retry budget was exhausted. */
  readonly exhausted: number;
  readonly aborted: number;
  /** Requests whose final outcome was an error. */
  readonly failed: number;
  readonly totalDelayMs: number;
  readonly averageAttempts: number;
  readonly retryRate: number;
  readonly byCategory: readonly { readonly category: RetryCategory; readonly count: number }[];
}

/** A minimal recorder interface (so the executor need not depend on the concrete collector). */
export interface RetryMetricsRecorder {
  record(result: RetryResult): void;
}

export class RetryMetrics implements RetryMetricsRecorder {
  private totalRequests = 0;
  private totalAttempts = 0;
  private totalRetries = 0;
  private retriedRequests = 0;
  private successAfterRetry = 0;
  private exhausted = 0;
  private aborted = 0;
  private failed = 0;
  private totalDelayMs = 0;
  private readonly categoryCounts = new Map<RetryCategory, number>();

  record(result: RetryResult): void {
    this.totalRequests += 1;
    this.totalAttempts += result.attempts;
    this.totalRetries += result.retries;
    this.totalDelayMs += result.totalDelayMs;
    if (result.retries > 0) this.retriedRequests += 1;
    if (result.retries > 0 && result.ok) this.successAfterRetry += 1;
    if (result.exhausted) this.exhausted += 1;
    if (result.aborted) this.aborted += 1;
    if (!result.ok && result.outcome.error) this.failed += 1;
    this.categoryCounts.set(result.category, (this.categoryCounts.get(result.category) ?? 0) + 1);
  }

  snapshot(): RetryMetricsSnapshot {
    return {
      totalRequests: this.totalRequests,
      totalAttempts: this.totalAttempts,
      totalRetries: this.totalRetries,
      retriedRequests: this.retriedRequests,
      successAfterRetry: this.successAfterRetry,
      exhausted: this.exhausted,
      aborted: this.aborted,
      failed: this.failed,
      totalDelayMs: this.totalDelayMs,
      averageAttempts: this.totalRequests > 0 ? this.totalAttempts / this.totalRequests : 0,
      retryRate: this.totalRequests > 0 ? this.retriedRequests / this.totalRequests : 0,
      byCategory: [...this.categoryCounts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.totalAttempts = 0;
    this.totalRetries = 0;
    this.retriedRequests = 0;
    this.successAfterRetry = 0;
    this.exhausted = 0;
    this.aborted = 0;
    this.failed = 0;
    this.totalDelayMs = 0;
    this.categoryCounts.clear();
  }
}
