/**
 * Routing metrics — deterministic aggregation over a set of routings (counts by status, ready/fail
 * rates, venue and policy distribution). No IO. Powers the Routing Metrics view.
 */
import {
  ROUTING_STATUSES,
  isActiveStatus,
  type Routing,
  type RoutingMetrics,
  type RoutingPolicyType,
  type RoutingStatus,
} from '@platform/sor-sdk';

export function computeRoutingMetrics(routings: readonly Routing[]): RoutingMetrics {
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
    const selected = routing.decision?.selectedVenueId;
    if (selected) venueCounts.set(selected, (venueCounts.get(selected) ?? 0) + 1);
    const policy = routing.decision?.policyType;
    if (policy) policyCounts.set(policy, (policyCounts.get(policy) ?? 0) + 1);
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
