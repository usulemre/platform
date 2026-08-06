/**
 * The **routing engine** (routing services) — the REAL, deterministic routing decision pipeline:
 * discover candidate venues, filter by feasibility, evaluate the routing policies, rank the feasible
 * venues (via the SDK ranking framework), and select the route (with a fallback). Produces a
 * `RoutingDecision`. Pure and deterministic; no IO, no connectivity, no execution.
 */
import {
  describePolicy,
  infeasibleReason,
  isVenueFeasible,
  rankVenues,
  type PolicyEvaluation,
  type RankedVenue,
  type RoutingDecision,
  type RoutingPolicy,
  type RoutingPolicyType,
  type RoutingRequest,
  type RoutingStrategy,
  type Venue,
} from '@platform/sor-sdk';
import { evaluateRoutingPolicies, type PolicyContext } from './policy-evaluators';

/** The candidate venues for a request (those whose capability lists the asset class). */
export function discoverVenues(request: RoutingRequest, venues: readonly Venue[]): Venue[] {
  return venues.filter((venue) => venue.capability.assetClasses.includes(request.assetClass));
}

export interface FilterResult {
  readonly feasible: readonly Venue[];
  readonly excluded: readonly { readonly venueId: string; readonly reason: string }[];
}

/** Filter candidate venues by feasibility (capability, status, blacklist). */
export function filterVenues(
  candidates: readonly Venue[],
  request: RoutingRequest,
  blacklisted: readonly string[],
): FilterResult {
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
  return { feasible, excluded };
}

/** The deciding policy: a MANUAL_OVERRIDE takes precedence, else the first enabled non-placeholder, else BEST_AVAILABLE. */
export function primaryPolicy(request: RoutingRequest): RoutingPolicy {
  const enabled = request.policies.filter((policy) => policy.enabled);
  const override = enabled.find((policy) => policy.type === 'MANUAL_OVERRIDE');
  if (override) return override;
  const concrete = enabled.find((policy) => !describePolicy(policy.type).placeholder);
  return concrete ?? enabled[0] ?? { type: 'BEST_AVAILABLE', enabled: true };
}

function strategyFor(policyType: RoutingPolicyType): RoutingStrategy {
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

export interface RoutingComputation {
  readonly candidateVenueIds: readonly string[];
  readonly feasible: readonly Venue[];
  readonly excluded: readonly { readonly venueId: string; readonly reason: string }[];
  readonly evaluations: readonly PolicyEvaluation[];
  readonly ranked: readonly RankedVenue[];
  readonly decision: RoutingDecision;
  readonly ok: boolean;
}

/** Run the full routing decision pipeline for a request (deterministic). */
export function routeRequest(
  request: RoutingRequest,
  venues: readonly Venue[],
  blacklisted: readonly string[],
  at: string,
): RoutingComputation {
  const candidates = discoverVenues(request, venues);
  const { feasible, excluded } = filterVenues(candidates, request, blacklisted);

  const policy = primaryPolicy(request);
  const preferredVenueId = policy.preferredVenueId ?? request.preferredVenueId;
  const preferredVenueFeasible =
    preferredVenueId !== undefined && feasible.some((venue) => venue.id === preferredVenueId);
  const ctx: PolicyContext = {
    feasibleCount: feasible.length,
    preferredVenueFeasible,
    preferredVenueId,
  };
  const evaluations = evaluateRoutingPolicies(request.policies, ctx);

  const ranked = rankVenues(feasible, policy.type, { weights: policy.weights, preferredVenueId });
  const selected = ranked.find((venue) => venue.selected);
  const fallback = ranked.find((venue) => venue.fallback);

  // Manual override that is infeasible fails routing; no feasible venue fails routing.
  const overrideBlocked = policy.type === 'MANUAL_OVERRIDE' && !preferredVenueFeasible;
  const ok = feasible.length > 0 && !overrideBlocked;

  const reason = !ok
    ? overrideBlocked
      ? `Manual override venue ${preferredVenueId} is infeasible.`
      : `No feasible venue for ${request.symbol} (${excluded.length} excluded).`
    : `${selected?.venueName} selected by ${describePolicy(policy.type).label}${fallback ? ` (fallback ${fallback.venueName})` : ''}.`;

  const decision: RoutingDecision = {
    selectedVenueId: ok ? selected?.venueId : undefined,
    selectedVenueName: ok ? selected?.venueName : undefined,
    policyType: policy.type,
    strategy: strategyFor(policy.type),
    ranked,
    fallbackVenueId: ok ? fallback?.venueId : undefined,
    feasibleCount: feasible.length,
    policyEvaluations: evaluations,
    reason,
    decidedAt: at,
  };

  return {
    candidateVenueIds: candidates.map((v) => v.id),
    feasible,
    excluded,
    evaluations,
    ranked,
    decision,
    ok,
  };
}
