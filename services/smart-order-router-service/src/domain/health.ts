/**
 * Routing & venue health — deterministic health checks over the routings and venues (routing fail
 * rate, offline/degraded venues, blacklisted venues, feasibility coverage). No IO; derived purely
 * from the current data. Powers the Routing/Venue Health views.
 */
import type { Routing, Venue } from '@platform/sor-sdk';
import { computeRoutingMetrics } from './metrics';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface HealthCheck {
  readonly id: string;
  readonly label: string;
  readonly status: HealthStatus;
  readonly detail: string;
}

export interface RoutingHealth {
  readonly status: HealthStatus;
  readonly checks: readonly HealthCheck[];
  readonly checkedAt: string;
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(
  routings: readonly Routing[],
  venues: readonly Venue[],
  checkedAt: string,
): RoutingHealth {
  const metrics = computeRoutingMetrics(routings);
  const checks: HealthCheck[] = [];

  checks.push({
    id: 'fail_rate',
    label: 'Routing failure rate',
    status: metrics.failRate > 0.3 ? 'UNHEALTHY' : metrics.failRate > 0.15 ? 'DEGRADED' : 'HEALTHY',
    detail: `${(metrics.failRate * 100).toFixed(1)}% failed`,
  });

  const online = venues.filter((v) => v.status === 'ONLINE').length;
  const degraded = venues.filter((v) => v.status === 'DEGRADED').length;
  const offline = venues.filter((v) => v.status === 'OFFLINE' || v.status === 'BLACKLISTED').length;
  checks.push({
    id: 'venue_online',
    label: 'Venue availability',
    status: online === 0 ? 'UNHEALTHY' : online < venues.length / 2 ? 'DEGRADED' : 'HEALTHY',
    detail: `${online} online, ${degraded} degraded, ${offline} offline/blacklisted`,
  });

  const blacklisted = venues.filter((v) => v.status === 'BLACKLISTED').length;
  checks.push({
    id: 'blacklist',
    label: 'Blacklisted venues',
    status: blacklisted > 2 ? 'DEGRADED' : 'HEALTHY',
    detail: `${blacklisted} blacklisted`,
  });

  const noVenue = routings.filter(
    (r) => r.status === 'EXECUTION_READY' && !r.decision?.selectedVenueId,
  ).length;
  checks.push({
    id: 'ready_integrity',
    label: 'Ready routings have a venue',
    status: noVenue > 0 ? 'UNHEALTHY' : 'HEALTHY',
    detail:
      noVenue === 0 ? 'all ready routings have a selected venue' : `${noVenue} without a venue`,
  });

  return {
    status: checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY'),
    checks,
    checkedAt,
  };
}
