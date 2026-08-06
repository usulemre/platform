/**
 * Pure UI-side derivations — routing metrics, health and event-sourced replay — computed from the
 * canonical routings/venues via `@platform/sor-sdk`. Deterministic, no IO. Mirrors the SOR service's
 * derivations so the UI presents the same numbers.
 */
import {
  ROUTING_STATUSES,
  canTransition,
  isActiveStatus,
  type Routing,
  type RoutingMetrics,
  type RoutingPolicyType,
  type RoutingState,
  type RoutingStatus,
  type Venue,
} from '@platform/sor-sdk';

export function computeMetrics(routings: readonly Routing[]): RoutingMetrics {
  const total = routings.length;
  const counts = new Map<RoutingStatus, number>();
  const venueCounts = new Map<string, number>();
  const policyCounts = new Map<RoutingPolicyType, number>();
  let candidates = 0;
  let rerouted = 0;
  for (const routing of routings) {
    counts.set(routing.status, (counts.get(routing.status) ?? 0) + 1);
    candidates += routing.candidateVenueIds.length;
    if (routing.attempts > 0) rerouted += 1;
    if (routing.decision?.selectedVenueId)
      venueCounts.set(
        routing.decision.selectedVenueId,
        (venueCounts.get(routing.decision.selectedVenueId) ?? 0) + 1,
      );
    if (routing.decision?.policyType)
      policyCounts.set(
        routing.decision.policyType,
        (policyCounts.get(routing.decision.policyType) ?? 0) + 1,
      );
  }
  const ready = counts.get('EXECUTION_READY') ?? 0;
  const failed = counts.get('ROUTING_FAILED') ?? 0;
  return {
    total,
    active: routings.filter((r) => isActiveStatus(r.status)).length,
    ready,
    failed,
    rerouted,
    readyRate: total > 0 ? ready / total : 0,
    failRate: total > 0 ? failed / total : 0,
    averageCandidates: total > 0 ? candidates / total : 0,
    byStatus: ROUTING_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 })).filter(
      (entry) => entry.count > 0,
    ),
    byVenue: [...venueCounts.entries()]
      .map(([venueId, count]) => ({ venueId, count }))
      .sort((a, b) => b.count - a.count),
    byPolicy: [...policyCounts.entries()]
      .map(([policyType, count]) => ({ policyType, count }))
      .sort((a, b) => b.count - a.count),
  };
}

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
}

function worst(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { HEALTHY: 0, DEGRADED: 1, UNHEALTHY: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function computeHealth(
  routings: readonly Routing[],
  venues: readonly Venue[],
): RoutingHealth {
  const metrics = computeMetrics(routings);
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
    detail: `${online} online, ${degraded} degraded, ${offline} offline`,
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
    detail: noVenue === 0 ? 'all ready routings have a venue' : `${noVenue} without a venue`,
  });
  return {
    status: checks.reduce<HealthStatus>((acc, check) => worst(acc, check.status), 'HEALTHY'),
    checks,
  };
}

export interface ReplayStep {
  readonly index: number;
  readonly type: string;
  readonly from: RoutingStatus;
  readonly to: RoutingStatus;
  readonly legal: boolean;
  readonly actor: string;
  readonly at: string;
  readonly message: string;
}
export interface ReplayResult {
  readonly steps: readonly ReplayStep[];
  readonly reconstructedStatus: RoutingStatus;
  readonly recordedStatus: RoutingStatus;
  readonly consistent: boolean;
  readonly states: readonly RoutingState[];
}

export function replay(routing: Routing): ReplayResult {
  let current: RoutingStatus = 'EXECUTION_REQUEST';
  let legalThroughout = true;
  const steps: ReplayStep[] = [];
  const states: RoutingState[] = [];
  let index = 0;
  for (const event of routing.events) {
    if (event.status === undefined) continue;
    const to = event.status;
    if (index === 0) {
      current = to;
      steps.push({
        index,
        type: event.type,
        from: to,
        to,
        legal: true,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
    } else {
      const legal = canTransition(current, to) || current === to;
      if (!legal) legalThroughout = false;
      steps.push({
        index,
        type: event.type,
        from: current,
        to,
        legal,
        actor: event.actor,
        at: event.at,
        message: event.message,
      });
      current = to;
    }
    states.push({ status: to, at: event.at, note: event.message });
    index += 1;
  }
  return {
    steps,
    reconstructedStatus: current,
    recordedStatus: routing.status,
    consistent: legalThroughout && current === routing.status,
    states,
  };
}
