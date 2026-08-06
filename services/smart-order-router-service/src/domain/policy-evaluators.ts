/**
 * The **routing policy framework** — REAL, deterministic policy evaluators, one per routing policy
 * type. Each evaluates a configured `RoutingPolicy` against the routing context (feasible venue set,
 * preferred-venue feasibility) and returns a `PolicyEvaluation` (whether it permits routing, and its
 * decision). Pure and deterministic. No IO, no connectivity.
 */
import { describePolicy, type PolicyEvaluation, type RoutingPolicy } from '@platform/sor-sdk';

export interface PolicyContext {
  readonly feasibleCount: number;
  readonly preferredVenueFeasible: boolean;
  readonly preferredVenueId?: string;
}

export function evaluateRoutingPolicy(policy: RoutingPolicy, ctx: PolicyContext): PolicyEvaluation {
  const descriptor = describePolicy(policy.type);
  const haveVenues = ctx.feasibleCount > 0;
  switch (policy.type) {
    case 'BEST_AVAILABLE':
    case 'LOWEST_COST':
    case 'LOWEST_LATENCY':
    case 'HIGHEST_LIQUIDITY':
    case 'HIGHEST_FILL_PROBABILITY':
      return {
        type: policy.type,
        allow: haveVenues,
        decision: descriptor.dimension,
        detail: `${ctx.feasibleCount} feasible venue(s); optimize ${descriptor.dimension}.`,
      };
    case 'PREFERRED_VENUE':
      return {
        type: policy.type,
        allow: haveVenues,
        decision: ctx.preferredVenueFeasible ? 'preferred-feasible' : 'preferred-unavailable',
        detail: ctx.preferredVenueFeasible
          ? `Preferred venue ${ctx.preferredVenueId} is feasible.`
          : 'Preferred venue unavailable; falls back to best available.',
      };
    case 'MANUAL_OVERRIDE':
      return {
        type: policy.type,
        allow: ctx.preferredVenueFeasible,
        decision: ctx.preferredVenueFeasible ? 'override-feasible' : 'override-blocked',
        detail: ctx.preferredVenueFeasible
          ? `Forced venue ${ctx.preferredVenueId}.`
          : `Forced venue ${ctx.preferredVenueId} is infeasible — routing blocked.`,
      };
    case 'FAILOVER':
      return {
        type: policy.type,
        allow: haveVenues,
        decision: 'failover-order',
        detail: `Prioritized failover across ${ctx.feasibleCount} venue(s).`,
      };
    case 'WEIGHTED':
      return {
        type: policy.type,
        allow: haveVenues,
        decision: 'weighted-blend',
        detail: `Weighted blend across ${ctx.feasibleCount} venue(s).`,
      };
    case 'MULTI_VENUE':
      return {
        type: policy.type,
        allow: haveVenues,
        decision: 'multi-venue (placeholder)',
        detail: 'Multi-venue split is a v1 placeholder; routed to the single best venue.',
      };
  }
}

export function evaluateRoutingPolicies(
  policies: readonly RoutingPolicy[],
  ctx: PolicyContext,
): PolicyEvaluation[] {
  return policies
    .filter((policy) => policy.enabled)
    .map((policy) => evaluateRoutingPolicy(policy, ctx));
}

export function policiesAllow(evaluations: readonly PolicyEvaluation[]): boolean {
  return evaluations.length === 0 ? false : evaluations.every((evaluation) => evaluation.allow);
}
