/**
 * `StorageHealthMonitor` — a deterministic, pure health evaluation over the storage layer's observable
 * signals: engine-error rate, quarantine rate, buffered-write queue depth, and time since the last
 * successful write. No IO and no ambient clock — the caller supplies the current time — so health is
 * reproducible. Powers operational dashboards and the HEALTHY ↔ DEGRADED signal for storage.
 */
import type { StorageMetricsSnapshot } from '../metrics/storage-metrics';

export type StorageHealthLevel = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE';

export interface StorageHealthCheck {
  readonly id: string;
  readonly level: StorageHealthLevel;
  readonly detail: string;
}

export interface StorageHealth {
  readonly level: StorageHealthLevel;
  readonly score: number;
  readonly checks: readonly StorageHealthCheck[];
  readonly evaluatedAt: number;
}

export interface StorageHealthThresholds {
  readonly errorRateWarn: number;
  readonly errorRateFail: number;
  readonly quarantineRateWarn: number;
  readonly quarantineRateFail: number;
  readonly queueWarn: number;
  readonly queueFail: number;
  readonly stalenessWarnMs: number;
  readonly stalenessFailMs: number;
}

export const DEFAULT_STORAGE_HEALTH_THRESHOLDS: StorageHealthThresholds = {
  errorRateWarn: 0.01,
  errorRateFail: 0.1,
  quarantineRateWarn: 0.01,
  quarantineRateFail: 0.1,
  queueWarn: 5_000,
  queueFail: 20_000,
  stalenessWarnMs: 60_000,
  stalenessFailMs: 300_000,
};

export interface StorageHealthInput {
  readonly metrics: StorageMetricsSnapshot;
  readonly now: number;
}

export class StorageHealthMonitor {
  private readonly thresholds: StorageHealthThresholds;

  constructor(thresholds: Partial<StorageHealthThresholds> = {}) {
    this.thresholds = { ...DEFAULT_STORAGE_HEALTH_THRESHOLDS, ...thresholds };
  }

  evaluate(input: StorageHealthInput): StorageHealth {
    const { metrics, now } = input;
    if (metrics.writesAttempted === 0) {
      return {
        level: 'OFFLINE',
        score: 0,
        checks: [{ id: 'liveness', level: 'OFFLINE', detail: 'No writes attempted yet.' }],
        evaluatedAt: now,
      };
    }

    const checks: StorageHealthCheck[] = [
      this.rateCheck(
        'engine',
        metrics.engineErrors / metrics.writesAttempted,
        this.thresholds.errorRateWarn,
        this.thresholds.errorRateFail,
        'Engine error rate',
      ),
      this.rateCheck(
        'quarantine',
        (metrics.rejected + metrics.quarantined) / metrics.writesAttempted,
        this.thresholds.quarantineRateWarn,
        this.thresholds.quarantineRateFail,
        'Reject/quarantine rate',
      ),
      this.queueCheck(metrics.queueDepth),
      this.livenessCheck(metrics.lastWriteAt, now),
    ];

    const level = worst(checks.map((c) => c.level));
    return { level, score: scoreFor(level), checks, evaluatedAt: now };
  }

  private rateCheck(
    id: string,
    rate: number,
    warn: number,
    fail: number,
    label: string,
  ): StorageHealthCheck {
    const pct = `${(rate * 100).toFixed(2)}%`;
    if (rate >= fail) return { id, level: 'UNHEALTHY', detail: `${label} ${pct}.` };
    if (rate >= warn) return { id, level: 'DEGRADED', detail: `${label} ${pct}.` };
    return { id, level: 'HEALTHY', detail: `${label} ${pct}.` };
  }

  private queueCheck(depth: number): StorageHealthCheck {
    if (depth >= this.thresholds.queueFail) {
      return { id: 'queue', level: 'UNHEALTHY', detail: `Write queue depth ${depth}.` };
    }
    if (depth >= this.thresholds.queueWarn) {
      return { id: 'queue', level: 'DEGRADED', detail: `Write queue depth ${depth}.` };
    }
    return { id: 'queue', level: 'HEALTHY', detail: `Write queue depth ${depth}.` };
  }

  private livenessCheck(lastWriteAt: number | undefined, now: number): StorageHealthCheck {
    if (lastWriteAt === undefined) {
      return { id: 'liveness', level: 'DEGRADED', detail: 'No successful write recorded.' };
    }
    const age = now - lastWriteAt;
    if (age >= this.thresholds.stalenessFailMs) {
      return { id: 'liveness', level: 'UNHEALTHY', detail: `No write for ${age}ms.` };
    }
    if (age >= this.thresholds.stalenessWarnMs) {
      return { id: 'liveness', level: 'DEGRADED', detail: `No write for ${age}ms.` };
    }
    return { id: 'liveness', level: 'HEALTHY', detail: `Last write ${age}ms ago.` };
  }
}

const ORDER: readonly StorageHealthLevel[] = ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'OFFLINE'];

function worst(levels: readonly StorageHealthLevel[]): StorageHealthLevel {
  let worstLevel: StorageHealthLevel = 'HEALTHY';
  for (const level of levels) {
    if (ORDER.indexOf(level) > ORDER.indexOf(worstLevel)) worstLevel = level;
  }
  return worstLevel;
}

function scoreFor(level: StorageHealthLevel): number {
  switch (level) {
    case 'HEALTHY':
      return 100;
    case 'DEGRADED':
      return 60;
    case 'UNHEALTHY':
      return 25;
    case 'OFFLINE':
      return 0;
  }
}
