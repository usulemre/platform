/**
 * SOR view models — UI-facing, pre-formatted shapes produced by the mappers so components carry no
 * logic. Inert presentation data only; the routing lifecycle/ranking logic lives in the SOR service /
 * `@platform/sor-sdk`. No exchange/broker/FIX.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}
export interface MetaRowVm {
  readonly label: string;
  readonly value: string;
}

export interface RoutingRowVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly quantity: string;
  readonly assetClass: string;
  readonly status: StatusVm;
  readonly venue: string;
  readonly mode: StatusVm;
  readonly updatedLabel: string;
}

export interface RankedVenueVm {
  readonly rank: number;
  readonly venueId: string;
  readonly venueName: string;
  readonly venueType: string;
  readonly scorePct: string;
  readonly cost: string;
  readonly latency: string;
  readonly liquidity: string;
  readonly fill: string;
  readonly preference: string;
  readonly selected: boolean;
  readonly fallback: boolean;
}
export interface PolicyEvalVm {
  readonly type: string;
  readonly allow: boolean;
  readonly decision: string;
  readonly detail: string;
}
export interface DecisionVm {
  readonly selectedVenue?: string;
  readonly policyType: string;
  readonly strategy: string;
  readonly feasibleCount: number;
  readonly fallbackVenue?: string;
  readonly reason: string;
  readonly ranked: readonly RankedVenueVm[];
  readonly evaluations: readonly PolicyEvalVm[];
}
export interface VenueVm {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: StatusVm;
  readonly region: string;
  readonly feeBps: string;
  readonly latency: string;
  readonly liquidity: string;
  readonly fill: string;
  readonly assetClasses: readonly string[];
  readonly description: string;
}
export interface VenueHealthVm {
  readonly venueId: string;
  readonly name: string;
  readonly status: StatusVm;
  readonly uptime: string;
  readonly errorRate: string;
  readonly note: string;
}
export interface PolicyDescriptorVm {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly category: string;
  readonly dimension: string;
  readonly placeholder: boolean;
}
export interface VenueTypeVm {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly placeholder: boolean;
}

export interface CheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}
export interface EventVm {
  readonly id: string;
  readonly type: string;
  readonly status?: StatusVm;
  readonly message: string;
  readonly actor: string;
  readonly atLabel: string;
  readonly tone: Tone;
}
export interface StateVm {
  readonly status: StatusVm;
  readonly atLabel: string;
  readonly note: string;
}
export interface AuditVm {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly atLabel: string;
}
export interface ActionVm {
  readonly action: string;
  readonly label: string;
  readonly permitted: boolean;
}

export interface RoutingDetailVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly executionId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly status: StatusVm;
  readonly mode: StatusVm;
  readonly quantity: string;
  readonly assetClass: string;
  readonly attempts: number;
  readonly validation: StatusVm;
  readonly validationChecks: readonly CheckVm[];
  readonly decision?: DecisionVm;
  readonly candidateVenueIds: readonly string[];
  readonly blacklistedVenueIds: readonly string[];
  readonly events: readonly EventVm[];
  readonly states: readonly StateVm[];
  readonly audit: readonly AuditVm[];
  readonly actions: readonly ActionVm[];
  readonly metadata: readonly MetaRowVm[];
  readonly tags: readonly string[];
  readonly createdLabel: string;
  readonly updatedLabel: string;
}

export interface StatusBucketVm {
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}
export interface MetricsVm {
  readonly total: number;
  readonly active: number;
  readonly ready: number;
  readonly failed: number;
  readonly rerouted: number;
  readonly readyRate: string;
  readonly failRate: string;
  readonly averageCandidates: string;
  readonly byStatus: readonly StatusBucketVm[];
  readonly byVenue: readonly { readonly venueId: string; readonly count: number }[];
  readonly byPolicy: readonly { readonly policyType: string; readonly count: number }[];
}
export interface HealthCheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}
export interface HealthVm {
  readonly status: StatusVm;
  readonly checks: readonly HealthCheckVm[];
}
export interface ReplayStepVm {
  readonly index: number;
  readonly type: string;
  readonly from: StatusVm;
  readonly to: StatusVm;
  readonly legal: boolean;
  readonly actor: string;
  readonly atLabel: string;
  readonly message: string;
}
export interface ReplayVm {
  readonly routingId: string;
  readonly clientOrderId: string;
  readonly reconstructedStatus: StatusVm;
  readonly recordedStatus: StatusVm;
  readonly consistent: boolean;
  readonly steps: readonly ReplayStepVm[];
}
export interface TimelineRowVm extends EventVm {
  readonly routingId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
}
export interface AuditRowVm extends AuditVm {
  readonly routingId: string;
  readonly clientOrderId: string;
}
export interface DecisionRowVm {
  readonly routingId: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: StatusVm;
  readonly policyType: string;
  readonly selectedVenue: string;
  readonly fallbackVenue: string;
  readonly feasibleCount: number;
  readonly reason: string;
}
export interface SorSummaryVm {
  readonly total: number;
  readonly active: number;
  readonly ready: number;
  readonly failed: number;
  readonly venues: number;
  readonly onlineVenues: number;
  readonly byStatus: readonly StatusBucketVm[];
}
export interface RoutePreviewVm {
  readonly decision: DecisionVm;
  readonly excluded: readonly { readonly venueId: string; readonly reason: string }[];
  readonly candidateCount: number;
  readonly feasibleCount: number;
  readonly ok: boolean;
}
