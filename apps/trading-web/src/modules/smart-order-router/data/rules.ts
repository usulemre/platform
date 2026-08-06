/**
 * UI-local routing preview — a compact, deterministic mirror of the SOR service's routing pipeline,
 * used by the Routing Rules / Decisions screens and the seed. Uses the shared SDK vocabulary (venue
 * ranking, feasibility, policy catalog). Pure; no IO, no connectivity.
 */
import {
  describePolicy,
  infeasibleReason,
  isVenueFeasible,
  rankVenues,
  type RankedVenue,
  type RoutingDecision,
  type RoutingPolicy,
  type RoutingRequest,
  type RoutingStrategy,
  type Venue,
} from '@platform/sor-sdk';

export interface RoutePreview {
  readonly decision: RoutingDecision;
  readonly ranked: readonly RankedVenue[];
  readonly excluded: readonly { readonly venueId: string; readonly reason: string }[];
  readonly candidateVenueIds: readonly string[];
  readonly feasibleCount: number;
  readonly ok: boolean;
}

function primaryPolicy(request: RoutingRequest): RoutingPolicy {
  const enabled = request.policies.filter((p) => p.enabled);
  const override = enabled.find((p) => p.type === 'MANUAL_OVERRIDE');
  if (override) return override;
  const concrete = enabled.find((p) => !describePolicy(p.type).placeholder);
  return concrete ?? enabled[0] ?? { type: 'BEST_AVAILABLE', enabled: true };
}

function strategyFor(policyType: RoutingPolicy['type']): RoutingStrategy {
  switch (policyType) {
    case 'FAILOVER':
      return 'FAILOVER';
    case 'WEIGHTED':
      return 'WEIGHTED';
    case 'MANUAL_OVERRIDE':
      return 'MANUAL';
    case 'MULTI_VENUE':
      return 'MULTI_VENUE';
    default:
      return 'SINGLE_VENUE';
  }
}

export function previewRoute(
  request: RoutingRequest,
  venues: readonly Venue[],
  blacklisted: readonly string[],
  at: string,
): RoutePreview {
  const candidates = venues.filter((v) => v.capability.assetClasses.includes(request.assetClass));
  const feasible: Venue[] = [];
  const excluded: { venueId: string; reason: string }[] = [];
  for (const venue of candidates) {
    if (isVenueFeasible(venue, request, blacklisted)) feasible.push(venue);
    else
      excluded.push({
        venueId: venue.id,
        reason: infeasibleReason(venue, request, blacklisted) ?? 'infeasible',
      });
  }

  const policy = primaryPolicy(request);
  const preferredVenueId = policy.preferredVenueId ?? request.preferredVenueId;
  const preferredFeasible =
    preferredVenueId !== undefined && feasible.some((v) => v.id === preferredVenueId);
  const ranked = rankVenues(feasible, policy.type, { weights: policy.weights, preferredVenueId });
  const selected = ranked.find((v) => v.selected);
  const fallback = ranked.find((v) => v.fallback);
  const overrideBlocked = policy.type === 'MANUAL_OVERRIDE' && !preferredFeasible;
  const ok = feasible.length > 0 && !overrideBlocked;

  const reason = !ok
    ? overrideBlocked
      ? `Manual override venue ${preferredVenueId} is infeasible.`
      : `No feasible venue (${excluded.length} excluded).`
    : `${selected?.venueName} selected by ${describePolicy(policy.type).label}.`;

  const decision: RoutingDecision = {
    selectedVenueId: ok ? selected?.venueId : undefined,
    selectedVenueName: ok ? selected?.venueName : undefined,
    policyType: policy.type,
    strategy: strategyFor(policy.type),
    ranked,
    fallbackVenueId: ok ? fallback?.venueId : undefined,
    feasibleCount: feasible.length,
    policyEvaluations: request.policies
      .filter((p) => p.enabled)
      .map((p) => ({
        type: p.type,
        allow: ok || p.type !== 'MANUAL_OVERRIDE',
        decision: describePolicy(p.type).dimension,
        detail: `${feasible.length} feasible venue(s).`,
      })),
    reason,
    decidedAt: at,
  };
  return {
    decision,
    ranked,
    excluded,
    candidateVenueIds: candidates.map((v) => v.id),
    feasibleCount: feasible.length,
    ok,
  };
}
