/**
 * Deterministic broker **health computation** — a pure function of a broker's connection metrics
 * (heartbeat age, latency, error rate) and lifecycle status. No IO, no randomness, no wall-clock: the
 * inputs are supplied by the caller. Powers the Broker Health / Connectivity Monitor views and the
 * HEALTHY ↔ DEGRADED transition decision (the transition itself is applied by the gateway service).
 */
import type { BrokerStatus } from './lifecycle';
import type { BrokerHealth, HealthCheck, HealthLevel } from './types';

export interface HealthInput {
  readonly brokerId: string;
  readonly status: BrokerStatus;
  readonly heartbeatAgeMs: number;
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly heartbeatIntervalMs: number;
  readonly at: string;
}

/** Health thresholds (basis for the deterministic score/level). */
export const HEALTH_THRESHOLDS = {
  latencyWarnMs: 250,
  latencyFailMs: 1000,
  errorRateWarn: 0.02,
  errorRateFail: 0.1,
  heartbeatStaleFactor: 2,
  heartbeatDeadFactor: 5,
} as const;

function clamp(value: number, lo: number, hi: number): number {
  return value < lo ? lo : value > hi ? hi : value;
}

function levelFor(score: number): HealthLevel {
  if (score >= 80) return 'HEALTHY';
  if (score >= 50) return 'DEGRADED';
  if (score > 0) return 'UNHEALTHY';
  return 'OFFLINE';
}

export function computeBrokerHealth(input: HealthInput): BrokerHealth {
  // A broker that is not connected is offline for health purposes.
  if (
    input.status === 'ARCHIVED' ||
    input.status === 'DISCONNECTED' ||
    input.status === 'REGISTERED' ||
    input.status === 'CONFIGURED' ||
    input.status === 'AUTHENTICATED'
  ) {
    const detail =
      input.status === 'DISCONNECTED' ? 'Transport session is down.' : 'Not yet connected.';
    return {
      brokerId: input.brokerId,
      level: 'OFFLINE',
      score: 0,
      heartbeatAgeMs: input.heartbeatAgeMs,
      latencyMs: input.latencyMs,
      errorRate: input.errorRate,
      checks: [{ id: 'connection', label: 'Connection', level: 'OFFLINE', detail }],
      evaluatedAt: input.at,
    };
  }

  const staleMs = input.heartbeatIntervalMs * HEALTH_THRESHOLDS.heartbeatStaleFactor;
  const deadMs = input.heartbeatIntervalMs * HEALTH_THRESHOLDS.heartbeatDeadFactor;

  let score = 100;
  const checks: HealthCheck[] = [];

  // Heartbeat freshness.
  if (input.heartbeatAgeMs > deadMs) {
    score -= 50;
    checks.push({
      id: 'heartbeat',
      label: 'Heartbeat',
      level: 'UNHEALTHY',
      detail: `No heartbeat for ${input.heartbeatAgeMs}ms (dead > ${deadMs}ms).`,
    });
  } else if (input.heartbeatAgeMs > staleMs) {
    score -= 25;
    checks.push({
      id: 'heartbeat',
      label: 'Heartbeat',
      level: 'DEGRADED',
      detail: `Heartbeat stale (${input.heartbeatAgeMs}ms > ${staleMs}ms).`,
    });
  } else {
    checks.push({
      id: 'heartbeat',
      label: 'Heartbeat',
      level: 'HEALTHY',
      detail: `Fresh (${input.heartbeatAgeMs}ms).`,
    });
  }

  // Latency.
  if (input.latencyMs > HEALTH_THRESHOLDS.latencyFailMs) {
    score -= 30;
    checks.push({
      id: 'latency',
      label: 'Latency',
      level: 'UNHEALTHY',
      detail: `${input.latencyMs}ms (> ${HEALTH_THRESHOLDS.latencyFailMs}ms).`,
    });
  } else if (input.latencyMs > HEALTH_THRESHOLDS.latencyWarnMs) {
    score -= 15;
    checks.push({
      id: 'latency',
      label: 'Latency',
      level: 'DEGRADED',
      detail: `${input.latencyMs}ms (> ${HEALTH_THRESHOLDS.latencyWarnMs}ms).`,
    });
  } else {
    checks.push({
      id: 'latency',
      label: 'Latency',
      level: 'HEALTHY',
      detail: `${input.latencyMs}ms.`,
    });
  }

  // Error rate.
  if (input.errorRate > HEALTH_THRESHOLDS.errorRateFail) {
    score -= 30;
    checks.push({
      id: 'error-rate',
      label: 'Error rate',
      level: 'UNHEALTHY',
      detail: `${(input.errorRate * 100).toFixed(1)}% (> ${(HEALTH_THRESHOLDS.errorRateFail * 100).toFixed(0)}%).`,
    });
  } else if (input.errorRate > HEALTH_THRESHOLDS.errorRateWarn) {
    score -= 15;
    checks.push({
      id: 'error-rate',
      label: 'Error rate',
      level: 'DEGRADED',
      detail: `${(input.errorRate * 100).toFixed(1)}% (> ${(HEALTH_THRESHOLDS.errorRateWarn * 100).toFixed(0)}%).`,
    });
  } else {
    checks.push({
      id: 'error-rate',
      label: 'Error rate',
      level: 'HEALTHY',
      detail: `${(input.errorRate * 100).toFixed(2)}%.`,
    });
  }

  score = clamp(score, 0, 100);
  return {
    brokerId: input.brokerId,
    level: levelFor(score),
    score,
    heartbeatAgeMs: input.heartbeatAgeMs,
    latencyMs: input.latencyMs,
    errorRate: input.errorRate,
    checks,
    evaluatedAt: input.at,
  };
}

/** Whether a computed health warrants the DEGRADED lifecycle status. */
export function isDegraded(health: BrokerHealth): boolean {
  return health.level === 'DEGRADED' || health.level === 'UNHEALTHY';
}
