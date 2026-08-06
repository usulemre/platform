/**
 * Routing policy & venue vocabulary — the 10 canonical routing policy types, the routing strategies,
 * the venue types and venue status. Pure metadata + the policy-evaluation result shape. The policy
 * *framework* (the deterministic evaluators) and the venue *ranking* live in the sibling modules.
 * NO exchange/broker/FIX, NO transport.
 */

/** The 10 canonical routing policy types (MULTI_VENUE is a v1 placeholder). */
export type RoutingPolicyType =
  | 'BEST_AVAILABLE'
  | 'LOWEST_COST'
  | 'LOWEST_LATENCY'
  | 'HIGHEST_LIQUIDITY'
  | 'HIGHEST_FILL_PROBABILITY'
  | 'PREFERRED_VENUE'
  | 'MANUAL_OVERRIDE'
  | 'FAILOVER'
  | 'WEIGHTED'
  | 'MULTI_VENUE';

export type PolicyCategory =
  | 'COMPOSITE'
  | 'COST'
  | 'SPEED'
  | 'LIQUIDITY'
  | 'PREFERENCE'
  | 'RELIABILITY';

export interface RoutingPolicyDescriptor {
  readonly type: RoutingPolicyType;
  readonly label: string;
  readonly description: string;
  readonly category: PolicyCategory;
  /** The scoring dimension this policy emphasizes (for the ranking framework). */
  readonly dimension: 'composite' | 'cost' | 'latency' | 'liquidity' | 'fill' | 'preference';
  /** A v1 placeholder policy — declared but not fully scheduled. */
  readonly placeholder: boolean;
}

export const ROUTING_POLICY_CATALOG: readonly RoutingPolicyDescriptor[] = [
  {
    type: 'BEST_AVAILABLE',
    label: 'Best available venue',
    description: 'Composite score across cost, latency, liquidity and fill probability.',
    category: 'COMPOSITE',
    dimension: 'composite',
    placeholder: false,
  },
  {
    type: 'LOWEST_COST',
    label: 'Lowest cost',
    description: 'Prefer the venue with the lowest fees.',
    category: 'COST',
    dimension: 'cost',
    placeholder: false,
  },
  {
    type: 'LOWEST_LATENCY',
    label: 'Lowest latency',
    description: 'Prefer the fastest venue.',
    category: 'SPEED',
    dimension: 'latency',
    placeholder: false,
  },
  {
    type: 'HIGHEST_LIQUIDITY',
    label: 'Highest liquidity',
    description: 'Prefer the deepest venue.',
    category: 'LIQUIDITY',
    dimension: 'liquidity',
    placeholder: false,
  },
  {
    type: 'HIGHEST_FILL_PROBABILITY',
    label: 'Highest fill probability',
    description: 'Prefer the venue most likely to fill.',
    category: 'LIQUIDITY',
    dimension: 'fill',
    placeholder: false,
  },
  {
    type: 'PREFERRED_VENUE',
    label: 'Preferred venue',
    description: 'Prefer a configured venue when feasible.',
    category: 'PREFERENCE',
    dimension: 'preference',
    placeholder: false,
  },
  {
    type: 'MANUAL_OVERRIDE',
    label: 'Manual override',
    description: 'Force a specific venue (operator override).',
    category: 'PREFERENCE',
    dimension: 'preference',
    placeholder: false,
  },
  {
    type: 'FAILOVER',
    label: 'Failover routing',
    description: 'A prioritized venue list with automatic failover.',
    category: 'RELIABILITY',
    dimension: 'preference',
    placeholder: false,
  },
  {
    type: 'WEIGHTED',
    label: 'Weighted routing',
    description: 'A weighted blend of the scoring dimensions.',
    category: 'COMPOSITE',
    dimension: 'composite',
    placeholder: false,
  },
  {
    type: 'MULTI_VENUE',
    label: 'Multi-venue routing (placeholder)',
    description: 'Split across multiple venues — declared placeholder in v1.',
    category: 'COMPOSITE',
    dimension: 'composite',
    placeholder: true,
  },
];

export function describePolicy(type: RoutingPolicyType): RoutingPolicyDescriptor {
  return ROUTING_POLICY_CATALOG.find((policy) => policy.type === type)!;
}
export function isPlaceholderPolicy(type: RoutingPolicyType): boolean {
  return describePolicy(type).placeholder;
}

/** The result of evaluating one policy against the candidate venues (deterministic). */
export interface PolicyEvaluation {
  readonly type: RoutingPolicyType;
  readonly allow: boolean;
  readonly decision: string;
  readonly detail: string;
}

/** The routing strategy chosen for a request. */
export type RoutingStrategy = 'SINGLE_VENUE' | 'FAILOVER' | 'WEIGHTED' | 'MANUAL' | 'MULTI_VENUE';

/* --------------------------------- venues ---------------------------------- */

/** Canonical venue types (dark pool / internal crossing are v1 placeholders). */
export type VenueType =
  | 'CRYPTO_EXCHANGE'
  | 'STOCK_EXCHANGE'
  | 'BROKER'
  | 'DARK_POOL'
  | 'INTERNAL_CROSSING';

export type VenueStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'BLACKLISTED';

export interface VenueTypeDescriptor {
  readonly type: VenueType;
  readonly label: string;
  readonly description: string;
  readonly placeholder: boolean;
}

export const VENUE_TYPES: readonly VenueTypeDescriptor[] = [
  {
    type: 'CRYPTO_EXCHANGE',
    label: 'Crypto exchange',
    description: 'A centralized crypto exchange venue abstraction.',
    placeholder: false,
  },
  {
    type: 'STOCK_EXCHANGE',
    label: 'Stock exchange',
    description: 'A regulated equities exchange venue abstraction.',
    placeholder: false,
  },
  {
    type: 'BROKER',
    label: 'Broker',
    description: 'A broker/smart-routing venue abstraction.',
    placeholder: false,
  },
  {
    type: 'DARK_POOL',
    label: 'Dark pool (placeholder)',
    description: 'A non-displayed liquidity venue — declared placeholder in v1.',
    placeholder: true,
  },
  {
    type: 'INTERNAL_CROSSING',
    label: 'Internal crossing (placeholder)',
    description: 'Internal crossing network — declared placeholder in v1.',
    placeholder: true,
  },
];

export function describeVenueType(type: VenueType): VenueTypeDescriptor {
  return VENUE_TYPES.find((venue) => venue.type === type)!;
}
export function isPlaceholderVenueType(type: VenueType): boolean {
  return describeVenueType(type).placeholder;
}
