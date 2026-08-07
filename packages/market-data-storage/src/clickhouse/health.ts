/**
 * `ClickHouseHealthMonitor` — a storage health check that **actually verifies ClickHouse
 * connectivity** by pinging the server, rather than merely checking that an object exists in memory.
 * It distinguishes HEALTHY (reachable, no recent I/O faults), DEGRADED (reachable but insert/query or
 * connection failures have occurred), and UNAVAILABLE (ping failed). `now` is supplied by the caller.
 */
import type { ClickHouseMetrics } from './metrics';

export type StorageConnectivity = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface StorageConnectivityReport {
  readonly status: StorageConnectivity;
  readonly reachable: boolean;
  readonly detail: string;
  readonly checkedAt: number;
}

/** Anything that can be pinged (the ClickHouse engine satisfies this). */
export interface Pingable {
  ping(): Promise<boolean>;
}

export class ClickHouseHealthMonitor {
  constructor(
    private readonly engine: Pingable,
    private readonly metrics?: ClickHouseMetrics,
  ) {}

  async check(now: number): Promise<StorageConnectivityReport> {
    let reachable = false;
    try {
      reachable = await this.engine.ping();
    } catch {
      reachable = false;
    }
    if (!reachable) {
      return {
        status: 'UNAVAILABLE',
        reachable: false,
        detail: 'ClickHouse did not respond to ping.',
        checkedAt: now,
      };
    }
    const m = this.metrics?.snapshot();
    if (m && (m.connectionFailures > 0 || m.insertFailures > 0 || m.queryFailures > 0)) {
      return {
        status: 'DEGRADED',
        reachable: true,
        detail: `Reachable, but ${m.insertFailures + m.queryFailures} I/O failure(s) and ${m.connectionFailures} connection failure(s) recorded.`,
        checkedAt: now,
      };
    }
    return { status: 'HEALTHY', reachable: true, detail: 'ClickHouse reachable.', checkedAt: now };
  }
}
