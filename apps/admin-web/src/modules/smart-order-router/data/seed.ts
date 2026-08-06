/**
 * Deterministic seed routings spanning the lifecycle (UI mock DATA only). Each routing walks a legal
 * status path — so its event log, state history and audit trail are internally consistent and
 * replay-consistent — with a genuine decision computed by the UI-local routing preview. NO exchange/
 * broker/FIX, NO connectivity, no persistence. Timestamps are fixed strings (no wall-clock).
 */
import {
  VENUES,
  type ExecutionMode,
  type Routing,
  type RoutingAudit,
  type RoutingDecision,
  type RoutingEvent,
  type RoutingEventType,
  type RoutingPolicy,
  type RoutingPolicyType,
  type RoutingRequest,
  type RoutingState,
  type RoutingStatus,
  type ValidationStatus,
} from '@platform/sor-sdk';
import { previewRoute } from './rules';

const EVENT_FOR: Record<RoutingStatus, RoutingEventType> = {
  EXECUTION_REQUEST: 'REQUEST_RECEIVED',
  VENUE_DISCOVERY: 'VENUES_DISCOVERED',
  VENUE_FILTERING: 'VENUES_FILTERED',
  POLICY_EVALUATION: 'POLICIES_EVALUATED',
  VENUE_RANKING: 'VENUES_RANKED',
  ROUTE_SELECTION: 'ROUTE_SELECTED',
  ROUTE_VALIDATION: 'ROUTE_VALIDATED',
  ROUTE_CONFIRMED: 'ROUTE_CONFIRMED',
  EXECUTION_READY: 'EXECUTION_READY',
  ROUTING_FAILED: 'ROUTING_FAILED',
};

function at(minute: number): string {
  const hour = 15 + Math.floor(minute / 60);
  return `2026-08-01T${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00.000Z`;
}
const pad = (n: number) => n.toString().padStart(3, '0');
const policy = (type: RoutingPolicyType, extra: Partial<RoutingPolicy> = {}): RoutingPolicy => ({
  type,
  enabled: true,
  ...extra,
});

const SUCCESS_PATH: readonly RoutingStatus[] = [
  'EXECUTION_REQUEST',
  'VENUE_DISCOVERY',
  'VENUE_FILTERING',
  'POLICY_EVALUATION',
  'VENUE_RANKING',
  'ROUTE_SELECTION',
  'ROUTE_VALIDATION',
  'ROUTE_CONFIRMED',
  'EXECUTION_READY',
];
const FAILURE_PATH: readonly RoutingStatus[] = [
  'EXECUTION_REQUEST',
  'VENUE_DISCOVERY',
  'VENUE_FILTERING',
  'ROUTING_FAILED',
];

interface Spec {
  readonly id: string;
  readonly seq: number;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly assetClass: string;
  readonly base: number;
  readonly mode?: ExecutionMode;
  readonly policies: readonly RoutingPolicy[];
  readonly preferredVenueId?: string;
  readonly blacklist?: readonly string[];
  readonly attempts?: number;
  readonly tags?: readonly string[];
}

function mkRequest(spec: Spec): RoutingRequest {
  return {
    id: spec.id,
    executionId: `EXE-${spec.seq.toString().padStart(4, '0')}`,
    orderId: `ORD-${spec.seq.toString().padStart(4, '0')}`,
    clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
    symbol: spec.symbol,
    side: spec.side,
    quantity: spec.quantity,
    assetClass: spec.assetClass,
    mode: spec.mode ?? 'SIMULATED',
    policies: spec.policies,
    preferredVenueId: spec.preferredVenueId,
    requestedBy: 'exec-router',
    requestedAt: at(spec.base),
    metadata: {
      source: 'execution-engine',
      executionId: `EXE-${spec.seq.toString().padStart(4, '0')}`,
      orderId: `ORD-${spec.seq.toString().padStart(4, '0')}`,
      clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
      portfolioId: 'pf-core',
      tags: spec.tags ?? ['systematic'],
      entries: [
        { key: 'team', value: 'Execution' },
        { key: 'desk', value: 'Systematic' },
      ],
    },
  };
}

function mk(spec: Spec): Routing {
  const request = mkRequest(spec);
  const blacklist = spec.blacklist ?? [];
  const preview = previewRoute(request, VENUES, blacklist, at(spec.base + 1));
  const path = preview.ok ? SUCCESS_PATH : FAILURE_PATH;

  const events: RoutingEvent[] = [];
  const states: RoutingState[] = [];
  const audit: RoutingAudit[] = [];
  path.forEach((status, i) => {
    const minute = spec.base + i;
    const type = EVENT_FOR[status];
    const actor = i === 0 ? 'exec-router' : 'sor-router';
    const message = `${type.replace(/_/g, ' ')} — ${spec.symbol} (${spec.assetClass})`;
    events.push({
      id: `${spec.id}:EVT:${pad(i + 1)}`,
      type,
      status,
      message,
      actor,
      at: at(minute),
    });
    states.push({ status, at: at(minute), note: message });
    audit.push({
      id: `${spec.id}:AUD:${pad(i + 1)}`,
      actor,
      action: type,
      detail: message,
      at: at(minute),
    });
  });

  const finalStatus = path[path.length - 1]!;
  const decision: RoutingDecision | undefined =
    path.includes('ROUTE_SELECTION') || finalStatus === 'ROUTING_FAILED'
      ? preview.decision
      : undefined;
  const validationStatus: ValidationStatus =
    finalStatus === 'EXECUTION_READY'
      ? 'PASSED'
      : finalStatus === 'ROUTING_FAILED'
        ? 'FAILED'
        : 'NOT_RUN';

  return {
    id: spec.id.replace(/^RTR-/, 'ROU-'),
    requestId: spec.id,
    executionId: request.executionId,
    orderId: request.orderId,
    clientOrderId: request.clientOrderId,
    symbol: spec.symbol,
    side: spec.side,
    quantity: spec.quantity,
    assetClass: spec.assetClass,
    mode: spec.mode ?? 'SIMULATED',
    status: finalStatus,
    policies: spec.policies,
    preferredVenueId: spec.preferredVenueId,
    candidateVenueIds: preview.candidateVenueIds,
    blacklistedVenueIds: blacklist,
    decision,
    validation: {
      status: validationStatus,
      checks: [
        {
          id: 'selected',
          label: 'A venue was selected',
          passed: preview.ok,
          detail: preview.decision.selectedVenueId ?? '(none)',
        },
        {
          id: 'feasible',
          label: 'Feasible venue exists',
          passed: preview.ok,
          detail: `${preview.feasibleCount} feasible`,
        },
      ],
      validatedAt:
        finalStatus === 'EXECUTION_READY' || finalStatus === 'ROUTING_FAILED'
          ? at(spec.base + path.length - 1)
          : undefined,
    },
    attempts: spec.attempts ?? 0,
    events,
    states,
    audit,
    metadata: request.metadata,
    tags: spec.tags ?? ['systematic'],
    owner: { owner: 'exec-router', team: 'Execution', desk: 'Systematic' },
    createdAt: at(spec.base),
    updatedAt: at(spec.base + path.length - 1),
  };
}

export const ROUTINGS: readonly Routing[] = [
  mk({
    id: 'RTR-0001',
    seq: 1,
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 1000,
    assetClass: 'EQUITY',
    base: 0,
    policies: [policy('BEST_AVAILABLE')],
    tags: ['systematic', 'core'],
  }),
  mk({
    id: 'RTR-0002',
    seq: 2,
    symbol: 'MSFT',
    side: 'BUY',
    quantity: 800,
    assetClass: 'EQUITY',
    base: 6,
    policies: [policy('LOWEST_COST')],
  }),
  mk({
    id: 'RTR-0003',
    seq: 3,
    symbol: 'NVDA',
    side: 'SELL',
    quantity: 500,
    assetClass: 'EQUITY',
    base: 9,
    policies: [policy('LOWEST_LATENCY')],
  }),
  mk({
    id: 'RTR-0004',
    seq: 4,
    symbol: 'BTCUSD',
    side: 'BUY',
    quantity: 5,
    assetClass: 'CRYPTO',
    mode: 'LIVE',
    base: 12,
    policies: [policy('HIGHEST_LIQUIDITY')],
  }),
  mk({
    id: 'RTR-0005',
    seq: 5,
    symbol: 'GOOGL',
    side: 'BUY',
    quantity: 250,
    assetClass: 'EQUITY',
    base: 15,
    policies: [policy('PREFERRED_VENUE', { preferredVenueId: 'nasdaq' })],
    preferredVenueId: 'nasdaq',
  }),
  mk({
    id: 'RTR-0006',
    seq: 6,
    symbol: 'TSLA',
    side: 'SELL',
    quantity: 150,
    assetClass: 'EQUITY',
    base: 18,
    policies: [policy('WEIGHTED', { weights: { cost: 2, latency: 1, liquidity: 3, fill: 1 } })],
  }),
  mk({
    id: 'RTR-0007',
    seq: 7,
    symbol: 'ETHUSD',
    side: 'BUY',
    quantity: 10,
    assetClass: 'CRYPTO',
    base: 21,
    policies: [policy('BEST_AVAILABLE')],
    blacklist: ['binance', 'coinbase'],
    tags: ['systematic', 'failed'],
  }),
  mk({
    id: 'RTR-0008',
    seq: 8,
    symbol: 'JPM',
    side: 'SELL',
    quantity: 600,
    assetClass: 'EQUITY',
    base: 24,
    policies: [policy('MANUAL_OVERRIDE', { preferredVenueId: 'sigma-x' })],
    preferredVenueId: 'sigma-x',
    tags: ['systematic', 'override'],
  }),
  mk({
    id: 'RTR-0009',
    seq: 9,
    symbol: 'AMZN',
    side: 'BUY',
    quantity: 400,
    assetClass: 'EQUITY',
    base: 27,
    policies: [policy('FAILOVER')],
  }),
  mk({
    id: 'RTR-0010',
    seq: 10,
    symbol: 'META',
    side: 'BUY',
    quantity: 300,
    assetClass: 'EQUITY',
    base: 30,
    policies: [policy('BEST_AVAILABLE')],
    attempts: 1,
    tags: ['systematic', 'rerouted'],
  }),
];

export { VENUES };
