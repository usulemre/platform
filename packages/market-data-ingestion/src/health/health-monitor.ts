/**
 * `IngestionHealthMonitor` — a deterministic, pure health evaluation over the pipeline's observable
 * signals: buffer pressure, degraded (desynced) streams, store failures, quarantine rate, and time
 * since the last event. No IO and no ambient clock — the caller supplies the current time, so health
 * is reproducible. Powers operational dashboards and the HEALTHY ↔ DEGRADED signal.
 */
import type { IngestionMetricsSnapshot } from '../metrics/ingestion-metrics';

export type IngestionHealthLevel = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE';

export interface HealthCheck {
  readonly id: string;
  readonly level: IngestionHealthLevel;
  readonly detail: string;
}

export interface IngestionHealth {
  readonly level: IngestionHealthLevel;
  readonly score: number;
  readonly checks: readonly HealthCheck[];
  readonly evaluatedAt: number;
}

export interface HealthThresholds {
  readonly bufferWarn: number;
  readonly bufferFail: number;
  readonly quarantineRateWarn: number;
  readonly quarantineRateFail: number;
  readonly stalenessWarnMs: number;
  readonly stalenessFailMs: number;
}

export const DEFAULT_HEALTH_THRESHOLDS: HealthThresholds = {
  bufferWarn: 0.8,
  bufferFail: 1.0,
  quarantineRateWarn: 0.01,
  quarantineRateFail: 0.1,
  stalenessWarnMs: 30_000,
  stalenessFailMs: 120_000,
};

export interface HealthInput {
  readonly metrics: IngestionMetricsSnapshot;
  readonly bufferCapacity: number;
  readonly now: number;
}

export class IngestionHealthMonitor {
  private readonly thresholds: HealthThresholds;

  constructor(thresholds: Partial<HealthThresholds> = {}) {
    this.thresholds = { ...DEFAULT_HEALTH_THRESHOLDS, ...thresholds };
  }

  evaluate(input: HealthInput): IngestionHealth {
    const { metrics, bufferCapacity, now } = input;
    const checks: HealthCheck[] = [];

    // Never received an event → offline (nothing to be healthy about yet).
    if (metrics.received === 0 || metrics.lastEventAt === undefined) {
      return {
        level: 'OFFLINE',
        score: 0,
        checks: [{ id: 'liveness', level: 'OFFLINE', detail: 'No events ingested yet.' }],
        evaluatedAt: now,
      };
    }

    checks.push(this.bufferCheck(metrics.bufferDepth, bufferCapacity));
    checks.push(this.desyncCheck(metrics.degradedStreams));
    checks.push(this.quarantineCheck(metrics));
    checks.push(this.storeCheck(metrics.storeFailures));
    checks.push(this.livenessCheck(metrics.lastEventAt, now));

    const level = worst(checks.map((c) => c.level));
    return { level, score: scoreFor(level), checks, evaluatedAt: now };
  }

  private bufferCheck(depth: number, capacity: number): HealthCheck {
    const ratio = capacity > 0 ? depth / capacity : 0;
    if (ratio >= this.thresholds.bufferFail) {
      return { id: 'buffer', level: 'UNHEALTHY', detail: `Buffer full (${depth}/${capacity}).` };
    }
    if (ratio >= this.thresholds.bufferWarn) {
      return {
        id: 'buffer',
        level: 'DEGRADED',
        detail: `Buffer under pressure (${depth}/${capacity}).`,
      };
    }
    return { id: 'buffer', level: 'HEALTHY', detail: `Buffer depth ${depth}/${capacity}.` };
  }

  private desyncCheck(degraded: number): HealthCheck {
    if (degraded === 0)
      return { id: 'order_book', level: 'HEALTHY', detail: 'All books synchronized.' };
    return {
      id: 'order_book',
      level: 'DEGRADED',
      detail: `${degraded} stream(s) awaiting order-book resync.`,
    };
  }

  private quarantineCheck(metrics: IngestionMetricsSnapshot): HealthCheck {
    const denom = metrics.received || 1;
    const rate = (metrics.quarantined + metrics.rejected) / denom;
    if (rate >= this.thresholds.quarantineRateFail) {
      return {
        id: 'quarantine',
        level: 'UNHEALTHY',
        detail: `Reject/quarantine rate ${(rate * 100).toFixed(1)}%.`,
      };
    }
    if (rate >= this.thresholds.quarantineRateWarn) {
      return {
        id: 'quarantine',
        level: 'DEGRADED',
        detail: `Reject/quarantine rate ${(rate * 100).toFixed(1)}%.`,
      };
    }
    return {
      id: 'quarantine',
      level: 'HEALTHY',
      detail: `Reject/quarantine rate ${(rate * 100).toFixed(2)}%.`,
    };
  }

  private storeCheck(storeFailures: number): HealthCheck {
    if (storeFailures === 0) return { id: 'store', level: 'HEALTHY', detail: 'No store failures.' };
    return { id: 'store', level: 'DEGRADED', detail: `${storeFailures} store write failure(s).` };
  }

  private livenessCheck(lastEventAt: number, now: number): HealthCheck {
    const age = now - lastEventAt;
    if (age >= this.thresholds.stalenessFailMs) {
      return { id: 'liveness', level: 'UNHEALTHY', detail: `No events for ${age}ms.` };
    }
    if (age >= this.thresholds.stalenessWarnMs) {
      return { id: 'liveness', level: 'DEGRADED', detail: `No events for ${age}ms.` };
    }
    return { id: 'liveness', level: 'HEALTHY', detail: `Last event ${age}ms ago.` };
  }
}

const ORDER: readonly IngestionHealthLevel[] = ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'OFFLINE'];

function worst(levels: readonly IngestionHealthLevel[]): IngestionHealthLevel {
  let worstLevel: IngestionHealthLevel = 'HEALTHY';
  for (const level of levels) {
    if (ORDER.indexOf(level) > ORDER.indexOf(worstLevel)) worstLevel = level;
  }
  return worstLevel;
}

function scoreFor(level: IngestionHealthLevel): number {
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
