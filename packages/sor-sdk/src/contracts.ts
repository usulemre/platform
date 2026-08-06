/**
 * The canonical **Smart Order Router domain models** — the single source of truth for the shapes the
 * SOR service and its UIs exchange, plus the canonical venue catalog. Immutable, provenance-bearing
 * data shapes. Venue metrics (fees, latency, liquidity, fill probability) are inert reference data
 * used deterministically by the ranking framework; NO market data feed, NO exchange/broker/FIX.
 */
import type { RoutingAction, RoutingEventType, RoutingStatus } from './lifecycle';
import type {
  PolicyEvaluation,
  RoutingPolicyType,
  RoutingStrategy,
  VenueStatus,
  VenueType,
} from './policies';

export type ValidationStatus = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type ExecutionMode = 'SIMULATED' | 'PAPER' | 'LIVE';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

/** Inert venue reference metrics used by the ranking framework. */
export interface VenueMetrics {
  /** Trading fee in basis points (lower is cheaper). */
  readonly feeBps: number;
  readonly latencyMedianMs: number;
  readonly latencyP99Ms: number;
  /** Relative liquidity depth in `[0, 1]`. */
  readonly liquidityScore: number;
  /** Historical fill probability in `[0, 1]`. */
  readonly fillProbability: number;
  /** Operator preference rank (lower is more preferred). */
  readonly preference: number;
}

/** A venue capability profile. */
export interface VenueCapability {
  readonly assetClasses: readonly string[];
  readonly orderTypes: readonly string[];
  readonly supportsShort: boolean;
  readonly minQuantity: number;
  readonly maxQuantity: number;
}

/** A canonical venue (an abstraction — never a real exchange/broker endpoint). */
export interface Venue {
  readonly id: string;
  readonly name: string;
  readonly type: VenueType;
  readonly status: VenueStatus;
  readonly region: string;
  readonly description: string;
  readonly capability: VenueCapability;
  readonly metrics: VenueMetrics;
}

/** Venue latency detail. */
export interface VenueLatency {
  readonly venueId: string;
  readonly medianMs: number;
  readonly p99Ms: number;
}

/** Venue health detail. */
export interface VenueHealth {
  readonly venueId: string;
  readonly status: VenueStatus;
  readonly uptime: number;
  readonly errorRate: number;
  readonly checkedAt: string;
  readonly note: string;
}

/** The score breakdown for one venue under a policy (each dimension in `[0, 1]`). */
export interface VenueScore {
  readonly cost: number;
  readonly latency: number;
  readonly liquidity: number;
  readonly fill: number;
  readonly preference: number;
  readonly composite: number;
}

/** A ranked candidate venue. */
export interface RankedVenue {
  readonly rank: number;
  readonly venueId: string;
  readonly venueName: string;
  readonly venueType: VenueType;
  readonly score: number;
  readonly breakdown: VenueScore;
  readonly feasible: boolean;
  readonly selected: boolean;
  readonly fallback: boolean;
}

/** A configured routing policy on a request. */
export interface RoutingPolicy {
  readonly type: RoutingPolicyType;
  readonly enabled: boolean;
  /** Dimension weights (for the WEIGHTED policy). */
  readonly weights?: Readonly<Record<string, number>>;
  readonly preferredVenueId?: string;
}

/** Provenance + free-form metadata. */
export interface RoutingMetadata {
  readonly source: string;
  readonly executionId: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly portfolioId?: string;
  readonly tags: readonly string[];
  readonly entries: readonly MetadataEntry[];
}

/** A validation check. */
export interface ValidationCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
}
export interface RoutingValidation {
  readonly status: ValidationStatus;
  readonly checks: readonly ValidationCheck[];
  readonly validatedAt?: string;
}

/** The routing request received from the Execution Engine. */
export interface RoutingRequest {
  readonly id: string;
  readonly executionId: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly assetClass: string;
  readonly mode: ExecutionMode;
  readonly policies: readonly RoutingPolicy[];
  readonly preferredVenueId?: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly metadata: RoutingMetadata;
}

/** The deterministic routing decision. */
export interface RoutingDecision {
  readonly selectedVenueId?: string;
  readonly selectedVenueName?: string;
  readonly policyType: RoutingPolicyType;
  readonly strategy: RoutingStrategy;
  readonly ranked: readonly RankedVenue[];
  readonly fallbackVenueId?: string;
  readonly feasibleCount: number;
  readonly policyEvaluations: readonly PolicyEvaluation[];
  readonly reason: string;
  readonly decidedAt: string;
}

/** A lifecycle event on the routing timeline. */
export interface RoutingEvent {
  readonly id: string;
  readonly type: RoutingEventType;
  readonly status?: RoutingStatus;
  readonly action?: RoutingAction;
  readonly message: string;
  readonly actor: string;
  readonly at: string;
  readonly detail?: string;
}

export interface RoutingState {
  readonly status: RoutingStatus;
  readonly at: string;
  readonly note: string;
}

export interface RoutingAudit {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly at: string;
}

export interface RoutingHistory {
  readonly routingId: string;
  readonly states: readonly RoutingState[];
  readonly events: readonly RoutingEvent[];
}

export interface RoutingOwner {
  readonly owner: string;
  readonly team: string;
  readonly desk: string;
}

/** The routing aggregate — the complete lifecycle state of one routing request. */
export interface Routing {
  readonly id: string;
  readonly requestId: string;
  readonly executionId: string;
  readonly orderId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly assetClass: string;
  readonly mode: ExecutionMode;
  readonly status: RoutingStatus;
  readonly policies: readonly RoutingPolicy[];
  readonly preferredVenueId?: string;
  readonly candidateVenueIds: readonly string[];
  readonly blacklistedVenueIds: readonly string[];
  readonly decision?: RoutingDecision;
  readonly validation: RoutingValidation;
  readonly attempts: number;
  readonly events: readonly RoutingEvent[];
  readonly states: readonly RoutingState[];
  readonly audit: readonly RoutingAudit[];
  readonly metadata: RoutingMetadata;
  readonly tags: readonly string[];
  readonly owner: RoutingOwner;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Aggregate routing metrics (a computed shape). */
export interface RoutingMetrics {
  readonly total: number;
  readonly active: number;
  readonly ready: number;
  readonly failed: number;
  readonly rerouted: number;
  readonly readyRate: number;
  readonly failRate: number;
  readonly averageCandidates: number;
  readonly byStatus: readonly { readonly status: RoutingStatus; readonly count: number }[];
  readonly byVenue: readonly { readonly venueId: string; readonly count: number }[];
  readonly byPolicy: readonly { readonly policyType: RoutingPolicyType; readonly count: number }[];
}

/* --------------------------- canonical venue catalog --------------------------- */

const equities: VenueCapability = {
  assetClasses: ['EQUITY'],
  orderTypes: ['MARKET', 'LIMIT'],
  supportsShort: true,
  minQuantity: 1,
  maxQuantity: 1_000_000,
};
const crypto: VenueCapability = {
  assetClasses: ['CRYPTO'],
  orderTypes: ['MARKET', 'LIMIT'],
  supportsShort: true,
  minQuantity: 0.0001,
  maxQuantity: 5_000,
};

/** The canonical venue catalog (abstractions only; routed to downstream, never contacted here). */
export const VENUES: readonly Venue[] = [
  {
    id: 'nyse',
    name: 'NYSE',
    type: 'STOCK_EXCHANGE',
    status: 'ONLINE',
    region: 'US',
    description: 'US primary equities exchange (abstraction).',
    capability: equities,
    metrics: {
      feeBps: 2.0,
      latencyMedianMs: 8,
      latencyP99Ms: 20,
      liquidityScore: 0.95,
      fillProbability: 0.97,
      preference: 1,
    },
  },
  {
    id: 'nasdaq',
    name: 'NASDAQ',
    type: 'STOCK_EXCHANGE',
    status: 'ONLINE',
    region: 'US',
    description: 'US electronic equities exchange (abstraction).',
    capability: equities,
    metrics: {
      feeBps: 2.5,
      latencyMedianMs: 6,
      latencyP99Ms: 15,
      liquidityScore: 0.93,
      fillProbability: 0.96,
      preference: 2,
    },
  },
  {
    id: 'ib-smart',
    name: 'Interactive Brokers SMART',
    type: 'BROKER',
    status: 'ONLINE',
    region: 'US',
    description: 'Broker smart-routing venue (abstraction).',
    capability: equities,
    metrics: {
      feeBps: 1.5,
      latencyMedianMs: 25,
      latencyP99Ms: 80,
      liquidityScore: 0.9,
      fillProbability: 0.95,
      preference: 3,
    },
  },
  {
    id: 'binance',
    name: 'Binance',
    type: 'CRYPTO_EXCHANGE',
    status: 'ONLINE',
    region: 'GLOBAL',
    description: 'Crypto exchange (abstraction).',
    capability: crypto,
    metrics: {
      feeBps: 10,
      latencyMedianMs: 40,
      latencyP99Ms: 120,
      liquidityScore: 0.98,
      fillProbability: 0.98,
      preference: 1,
    },
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    type: 'CRYPTO_EXCHANGE',
    status: 'DEGRADED',
    region: 'US',
    description: 'Crypto exchange (abstraction).',
    capability: crypto,
    metrics: {
      feeBps: 25,
      latencyMedianMs: 60,
      latencyP99Ms: 200,
      liquidityScore: 0.85,
      fillProbability: 0.9,
      preference: 2,
    },
  },
  {
    id: 'sigma-x',
    name: 'Sigma X (dark)',
    type: 'DARK_POOL',
    status: 'OFFLINE',
    region: 'US',
    description: 'Dark pool venue — v1 placeholder.',
    capability: equities,
    metrics: {
      feeBps: 1.0,
      latencyMedianMs: 30,
      latencyP99Ms: 90,
      liquidityScore: 0.6,
      fillProbability: 0.7,
      preference: 5,
    },
  },
  {
    id: 'internal-cross',
    name: 'Internal crossing',
    type: 'INTERNAL_CROSSING',
    status: 'OFFLINE',
    region: 'INTERNAL',
    description: 'Internal crossing network — v1 placeholder.',
    capability: equities,
    metrics: {
      feeBps: 0.0,
      latencyMedianMs: 2,
      latencyP99Ms: 5,
      liquidityScore: 0.4,
      fillProbability: 0.5,
      preference: 4,
    },
  },
];

export function describeVenue(id: string): Venue | undefined {
  return VENUES.find((venue) => venue.id === id);
}
