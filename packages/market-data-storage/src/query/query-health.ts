/**
 * **Query Engine health** — reported from the *actual* underlying storage, never merely from the fact
 * that the engine object exists. When the engine is backed by a remote store (ClickHouse), health is
 * derived from a live availability probe (a ping): if the store does not respond the engine reports
 * `UNAVAILABLE`. A reachable store with recorded query failures/timeouts reports `DEGRADED`; a
 * reachable store with a clean recent history reports `HEALTHY`. An in-memory backend (no remote
 * dependency) has no probe and is always reachable.
 */
import type { QueryMetricsSnapshot } from './query-metrics';

export type QueryEngineStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

/** A minimal liveness probe over the underlying storage (the ClickHouse engine satisfies this). */
export interface StorageAvailabilityProbe {
  ping(): Promise<boolean>;
}

export interface QueryEngineHealth {
  readonly status: QueryEngineStatus;
  /** Whether the underlying storage responded to the liveness probe. */
  readonly reachable: boolean;
  readonly detail: string;
  readonly checkedAt: number;
  /** Total queries observed by the engine (from metrics). */
  readonly queriesRun: number;
  /** Total query failures observed by the engine (from metrics). */
  readonly failures: number;
}

/**
 * Evaluate engine health at `now`. `probe` is the underlying-storage liveness check (absent for an
 * in-memory backend, which is always reachable). `metrics` folds recent query failures/timeouts into a
 * `DEGRADED` verdict even when the store is reachable.
 */
export async function evaluateQueryEngineHealth(
  now: number,
  metrics: QueryMetricsSnapshot,
  probe?: StorageAvailabilityProbe,
): Promise<QueryEngineHealth> {
  let reachable = true;
  if (probe) {
    try {
      reachable = await probe.ping();
    } catch {
      reachable = false;
    }
  }

  const base = { checkedAt: now, queriesRun: metrics.queriesRun, failures: metrics.queryFailures };

  if (!reachable) {
    return {
      status: 'UNAVAILABLE',
      reachable: false,
      detail: 'Underlying market-data storage did not respond.',
      ...base,
    };
  }
  if (metrics.queryFailures > 0 || metrics.queryTimeouts > 0) {
    return {
      status: 'DEGRADED',
      reachable: true,
      detail: `Storage reachable, but ${metrics.queryFailures} query failure(s) and ${metrics.queryTimeouts} timeout(s) recorded.`,
      ...base,
    };
  }
  return {
    status: 'HEALTHY',
    reachable: true,
    detail: probe ? 'Underlying storage reachable.' : 'In-memory storage (no remote dependency).',
    ...base,
  };
}
