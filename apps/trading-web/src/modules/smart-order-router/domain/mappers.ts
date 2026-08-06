/**
 * DTO → view-model mappings for the SOR module. All presentation decisions live here so components
 * stay logic-free. Pure and deterministic. Status/policy/venue labels and the action predicates come
 * from `@platform/sor-sdk`; scores/prices are formatted, never computed (ranking comes from the SDK).
 */
import {
  ROUTING_POLICY_CATALOG,
  VENUE_TYPES,
  describePolicy,
  describeStatus,
  describeVenueType,
  describeAction,
  permittedActions,
  type ExecutionMode,
  type PolicyEvaluation,
  type RankedVenue,
  type Routing,
  type RoutingDecision,
  type RoutingMetrics,
  type RoutingStatus,
  type Venue,
  type VenueStatus,
} from '@platform/sor-sdk';
import {
  computeHealth,
  computeMetrics,
  replay,
  type HealthStatus,
  type ReplayResult,
  type RoutingHealth,
} from './derive';
import type { RoutePreview } from '../data/rules';
import type {
  ActionVm,
  CheckVm,
  DecisionRowVm,
  DecisionVm,
  EventVm,
  HealthVm,
  MetricsVm,
  PolicyDescriptorVm,
  RankedVenueVm,
  RoutePreviewVm,
  RoutingDetailVm,
  RoutingRowVm,
  SorSummaryVm,
  StatusBucketVm,
  StatusVm,
  Tone,
  VenueHealthVm,
  VenueTypeVm,
  VenueVm,
} from './view-model';

const STATUS_TONE: Record<RoutingStatus, Tone> = {
  EXECUTION_REQUEST: 'neutral',
  VENUE_DISCOVERY: 'info',
  VENUE_FILTERING: 'info',
  POLICY_EVALUATION: 'info',
  VENUE_RANKING: 'info',
  ROUTE_SELECTION: 'info',
  ROUTE_VALIDATION: 'warning',
  ROUTE_CONFIRMED: 'info',
  EXECUTION_READY: 'positive',
  ROUTING_FAILED: 'danger',
};
const MODE_TONE: Record<ExecutionMode, Tone> = {
  SIMULATED: 'info',
  PAPER: 'neutral',
  LIVE: 'danger',
};
const VENUE_STATUS_TONE: Record<VenueStatus, Tone> = {
  ONLINE: 'positive',
  DEGRADED: 'warning',
  OFFLINE: 'neutral',
  BLACKLISTED: 'danger',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  UNHEALTHY: 'danger',
};
const EVENT_TONE: Record<string, Tone> = {
  EXECUTION_READY: 'positive',
  ROUTING_FAILED: 'danger',
  ROUTE_SELECTED: 'info',
  VENUE_BLACKLISTED: 'warning',
  VENUE_RECOVERED: 'info',
};
const UPTIME: Record<VenueStatus, number> = {
  ONLINE: 0.999,
  DEGRADED: 0.95,
  OFFLINE: 0,
  BLACKLISTED: 0,
};
const ERROR_RATE: Record<VenueStatus, number> = {
  ONLINE: 0.001,
  DEGRADED: 0.05,
  OFFLINE: 1,
  BLACKLISTED: 1,
};

function num(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}
function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}
function dt(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

export function statusVm(status: RoutingStatus): StatusVm {
  return { value: status, label: describeStatus(status).label, tone: STATUS_TONE[status] };
}
function sideVm(side: Routing['side']): StatusVm {
  return {
    value: side,
    label: side === 'BUY' ? 'Buy' : 'Sell',
    tone: side === 'BUY' ? 'positive' : 'danger',
  };
}
function modeVm(mode: ExecutionMode): StatusVm {
  return {
    value: mode,
    label: mode.charAt(0) + mode.slice(1).toLowerCase(),
    tone: MODE_TONE[mode],
  };
}
function venueStatusVm(status: VenueStatus): StatusVm {
  return {
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    tone: VENUE_STATUS_TONE[status],
  };
}

export function toRowVm(routing: Routing): RoutingRowVm {
  return {
    id: routing.id,
    clientOrderId: routing.clientOrderId,
    symbol: routing.symbol,
    side: sideVm(routing.side),
    quantity: num(routing.quantity),
    assetClass: routing.assetClass,
    status: statusVm(routing.status),
    venue: routing.decision?.selectedVenueName ?? '—',
    mode: modeVm(routing.mode),
    updatedLabel: dt(routing.updatedAt),
  };
}

function rankedVm(ranked: RankedVenue): RankedVenueVm {
  return {
    rank: ranked.rank,
    venueId: ranked.venueId,
    venueName: ranked.venueName,
    venueType: describeVenueType(ranked.venueType).label,
    scorePct: pct(ranked.score),
    cost: pct(ranked.breakdown.cost),
    latency: pct(ranked.breakdown.latency),
    liquidity: pct(ranked.breakdown.liquidity),
    fill: pct(ranked.breakdown.fill),
    preference: pct(ranked.breakdown.preference),
    selected: ranked.selected,
    fallback: ranked.fallback,
  };
}
function evalVm(evaluation: PolicyEvaluation) {
  return {
    type: evaluation.type,
    allow: evaluation.allow,
    decision: evaluation.decision,
    detail: evaluation.detail,
  };
}
function decisionVm(decision: RoutingDecision): DecisionVm {
  return {
    selectedVenue: decision.selectedVenueName,
    policyType: describePolicy(decision.policyType).label,
    strategy: decision.strategy,
    feasibleCount: decision.feasibleCount,
    fallbackVenue: decision.fallbackVenueId,
    reason: decision.reason,
    ranked: decision.ranked.map(rankedVm),
    evaluations: decision.policyEvaluations.map(evalVm),
  };
}

export function toVenueVm(venue: Venue): VenueVm {
  return {
    id: venue.id,
    name: venue.name,
    type: describeVenueType(venue.type).label,
    status: venueStatusVm(venue.status),
    region: venue.region,
    feeBps: `${venue.metrics.feeBps} bps`,
    latency: `${venue.metrics.latencyMedianMs} ms`,
    liquidity: pct(venue.metrics.liquidityScore),
    fill: pct(venue.metrics.fillProbability),
    assetClasses: venue.capability.assetClasses,
    description: venue.description,
  };
}
export function toVenueHealthVm(venue: Venue): VenueHealthVm {
  return {
    venueId: venue.id,
    name: venue.name,
    status: venueStatusVm(venue.status),
    uptime: pct(UPTIME[venue.status]),
    errorRate: pct(ERROR_RATE[venue.status]),
    note:
      venue.status === 'ONLINE'
        ? 'Healthy.'
        : venue.status === 'DEGRADED'
          ? 'Degraded — elevated error rate.'
          : venue.status === 'OFFLINE'
            ? 'Offline — not routable.'
            : 'Blacklisted — excluded.',
  };
}

function toEventVm(event: Routing['events'][number]): EventVm {
  return {
    id: event.id,
    type: event.type.replace(/_/g, ' '),
    status: event.status ? statusVm(event.status) : undefined,
    message: event.message,
    actor: event.actor,
    atLabel: dt(event.at),
    tone: EVENT_TONE[event.type] ?? 'info',
  };
}
function toCheckVm(check: { id: string; label: string; passed: boolean; detail: string }): CheckVm {
  return {
    id: check.id,
    label: check.label,
    status: {
      value: String(check.passed),
      label: check.passed ? 'Pass' : 'Fail',
      tone: check.passed ? 'positive' : 'danger',
    },
    detail: check.detail,
  };
}
function toActionVms(routing: Routing): ActionVm[] {
  const permitted = new Set(permittedActions(routing.status));
  return (['reroute', 'fallback', 'retry', 'blacklist', 'recover'] as const).map((action) => ({
    action,
    label: describeAction(action).label,
    permitted: permitted.has(action),
  }));
}

export function toDetailVm(routing: Routing): RoutingDetailVm {
  return {
    id: routing.id,
    clientOrderId: routing.clientOrderId,
    executionId: routing.executionId,
    symbol: routing.symbol,
    side: sideVm(routing.side),
    status: statusVm(routing.status),
    mode: modeVm(routing.mode),
    quantity: num(routing.quantity),
    assetClass: routing.assetClass,
    attempts: routing.attempts,
    validation: {
      value: routing.validation.status,
      label: routing.validation.status.replace('_', ' '),
      tone:
        routing.validation.status === 'PASSED'
          ? 'positive'
          : routing.validation.status === 'FAILED'
            ? 'danger'
            : routing.validation.status === 'PENDING'
              ? 'warning'
              : 'neutral',
    },
    validationChecks: routing.validation.checks.map(toCheckVm),
    decision: routing.decision ? decisionVm(routing.decision) : undefined,
    candidateVenueIds: routing.candidateVenueIds,
    blacklistedVenueIds: routing.blacklistedVenueIds,
    events: routing.events.map(toEventVm),
    states: routing.states.map((s) => ({
      status: statusVm(s.status),
      atLabel: dt(s.at),
      note: s.note,
    })),
    audit: [...routing.audit]
      .reverse()
      .map((entry) => ({
        id: entry.id,
        actor: entry.actor,
        action: entry.action.replace(/_/g, ' '),
        detail: entry.detail,
        atLabel: dt(entry.at),
      })),
    actions: toActionVms(routing),
    metadata: [
      { label: 'Execution', value: routing.executionId },
      { label: 'Order', value: routing.orderId },
      { label: 'Client id', value: routing.clientOrderId },
      { label: 'Asset class', value: routing.assetClass },
      { label: 'Source', value: routing.metadata.source },
      { label: 'Attempts', value: String(routing.attempts) },
      ...routing.metadata.entries.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
    tags: routing.tags,
    createdLabel: dt(routing.createdAt),
    updatedLabel: dt(routing.updatedAt),
  };
}

function bucket(status: RoutingStatus, count: number): StatusBucketVm {
  return { label: describeStatus(status).label, count, tone: STATUS_TONE[status] };
}
export function toMetricsVm(metrics: RoutingMetrics): MetricsVm {
  return {
    total: metrics.total,
    active: metrics.active,
    ready: metrics.ready,
    failed: metrics.failed,
    rerouted: metrics.rerouted,
    readyRate: `${(metrics.readyRate * 100).toFixed(1)}%`,
    failRate: `${(metrics.failRate * 100).toFixed(1)}%`,
    averageCandidates: metrics.averageCandidates.toFixed(1),
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
    byVenue: metrics.byVenue.map((entry) => ({ venueId: entry.venueId, count: entry.count })),
    byPolicy: metrics.byPolicy.map((entry) => ({
      policyType: describePolicy(entry.policyType).label,
      count: entry.count,
    })),
  };
}
export function toHealthVm(health: RoutingHealth): HealthVm {
  const s = (status: HealthStatus): StatusVm => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
    tone: HEALTH_TONE[status],
  });
  return {
    status: s(health.status),
    checks: health.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: s(check.status),
      detail: check.detail,
    })),
  };
}
export function toReplayVm(routing: Routing, result: ReplayResult) {
  return {
    routingId: routing.id,
    clientOrderId: routing.clientOrderId,
    reconstructedStatus: statusVm(result.reconstructedStatus),
    recordedStatus: statusVm(result.recordedStatus),
    consistent: result.consistent,
    steps: result.steps.map((step) => ({
      index: step.index,
      type: step.type.replace(/_/g, ' '),
      from: statusVm(step.from),
      to: statusVm(step.to),
      legal: step.legal,
      actor: step.actor,
      atLabel: dt(step.at),
      message: step.message,
    })),
  };
}
export function toDecisionRowVm(routing: Routing): DecisionRowVm {
  return {
    routingId: routing.id,
    clientOrderId: routing.clientOrderId,
    symbol: routing.symbol,
    status: statusVm(routing.status),
    policyType: routing.decision ? describePolicy(routing.decision.policyType).label : '—',
    selectedVenue: routing.decision?.selectedVenueName ?? '—',
    fallbackVenue: routing.decision?.fallbackVenueId ?? '—',
    feasibleCount: routing.decision?.feasibleCount ?? 0,
    reason: routing.decision?.reason ?? '—',
  };
}
export function toSummaryVm(routings: readonly Routing[], venues: readonly Venue[]): SorSummaryVm {
  const metrics = computeMetrics(routings);
  return {
    total: metrics.total,
    active: metrics.active,
    ready: metrics.ready,
    failed: metrics.failed,
    venues: venues.length,
    onlineVenues: venues.filter((v) => v.status === 'ONLINE').length,
    byStatus: metrics.byStatus.map((entry) => bucket(entry.status, entry.count)),
  };
}
export function policyCatalogVms(): PolicyDescriptorVm[] {
  return ROUTING_POLICY_CATALOG.map((policy) => ({
    type: policy.type,
    label: policy.label,
    description: policy.description,
    category: policy.category,
    dimension: policy.dimension,
    placeholder: policy.placeholder,
  }));
}
export function venueTypeVms(): VenueTypeVm[] {
  return VENUE_TYPES.map((venue) => ({
    type: venue.type,
    label: venue.label,
    description: venue.description,
    placeholder: venue.placeholder,
  }));
}
export function toRoutePreviewVm(preview: RoutePreview): RoutePreviewVm {
  return {
    decision: decisionVm(preview.decision),
    excluded: preview.excluded,
    candidateCount: preview.candidateVenueIds.length,
    feasibleCount: preview.feasibleCount,
    ok: preview.ok,
  };
}

export { computeMetrics, computeHealth, replay };
