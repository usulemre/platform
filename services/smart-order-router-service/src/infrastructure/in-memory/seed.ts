/**
 * Deterministic seed routings spanning the lifecycle (development/test only). Each routing is built
 * by applying the REAL domain lifecycle — createRouting → runRouting over the canonical venues — so
 * its decision, event log, state history and audit trail are genuine (and replay-consistent), NOT
 * hand-faked. Mock DATA only; no exchange/broker/FIX. Timestamps are fixed strings (no wall-clock).
 */
import {
  VENUES,
  type ExecutionMode,
  type Routing,
  type RoutingPolicy,
  type RoutingPolicyType,
  type RoutingRequest,
} from '@platform/sor-sdk';
import {
  applyAction,
  createRouting,
  runRouting,
  type LifecycleResult,
} from '../../domain/lifecycle';

function unwrap(result: LifecycleResult): Routing {
  if (!result.ok) throw new Error(`seed lifecycle error: ${result.reason}`);
  return result.routing;
}

function at(minute: number): string {
  const hour = 15 + Math.floor(minute / 60);
  return `2026-08-01T${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00.000Z`;
}

const policy = (type: RoutingPolicyType, extra: Partial<RoutingPolicy> = {}): RoutingPolicy => ({
  type,
  enabled: true,
  ...extra,
});

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
  readonly reroute?: boolean;
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

function build(spec: Spec): Routing {
  const created = createRouting(mkRequest(spec), at(spec.base));
  const withBlacklist: Routing = spec.blacklist
    ? { ...created, blacklistedVenueIds: spec.blacklist }
    : created;
  let routing = unwrap(runRouting(withBlacklist, VENUES, at(spec.base + 1)));
  if (spec.reroute && routing.status === 'EXECUTION_READY') {
    routing = unwrap(applyAction(routing, 'reroute', 'Dana Ops', at(spec.base + 3)));
    routing = unwrap(runRouting(routing, VENUES, at(spec.base + 4)));
  }
  return routing;
}

export const ROUTINGS: readonly Routing[] = [
  build({
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
  build({
    id: 'RTR-0002',
    seq: 2,
    symbol: 'MSFT',
    side: 'BUY',
    quantity: 800,
    assetClass: 'EQUITY',
    base: 5,
    policies: [policy('LOWEST_COST')],
  }),
  build({
    id: 'RTR-0003',
    seq: 3,
    symbol: 'NVDA',
    side: 'SELL',
    quantity: 500,
    assetClass: 'EQUITY',
    base: 8,
    policies: [policy('LOWEST_LATENCY')],
  }),
  build({
    id: 'RTR-0004',
    seq: 4,
    symbol: 'BTCUSD',
    side: 'BUY',
    quantity: 5,
    assetClass: 'CRYPTO',
    mode: 'LIVE',
    base: 11,
    policies: [policy('HIGHEST_LIQUIDITY')],
  }),
  build({
    id: 'RTR-0005',
    seq: 5,
    symbol: 'GOOGL',
    side: 'BUY',
    quantity: 250,
    assetClass: 'EQUITY',
    base: 14,
    policies: [policy('PREFERRED_VENUE', { preferredVenueId: 'nasdaq' })],
    preferredVenueId: 'nasdaq',
  }),
  build({
    id: 'RTR-0006',
    seq: 6,
    symbol: 'TSLA',
    side: 'SELL',
    quantity: 150,
    assetClass: 'EQUITY',
    base: 17,
    policies: [policy('WEIGHTED', { weights: { cost: 2, latency: 1, liquidity: 3, fill: 1 } })],
  }),
  build({
    id: 'RTR-0007',
    seq: 7,
    symbol: 'ETHUSD',
    side: 'BUY',
    quantity: 10,
    assetClass: 'CRYPTO',
    base: 20,
    policies: [policy('BEST_AVAILABLE')],
    blacklist: ['binance', 'coinbase'],
    tags: ['systematic', 'failed'],
  }),
  build({
    id: 'RTR-0008',
    seq: 8,
    symbol: 'JPM',
    side: 'SELL',
    quantity: 600,
    assetClass: 'EQUITY',
    base: 23,
    policies: [policy('MANUAL_OVERRIDE', { preferredVenueId: 'sigma-x' })],
    preferredVenueId: 'sigma-x',
    tags: ['systematic', 'override'],
  }),
  build({
    id: 'RTR-0009',
    seq: 9,
    symbol: 'AMZN',
    side: 'BUY',
    quantity: 400,
    assetClass: 'EQUITY',
    base: 26,
    policies: [policy('FAILOVER')],
  }),
  build({
    id: 'RTR-0010',
    seq: 10,
    symbol: 'META',
    side: 'BUY',
    quantity: 300,
    assetClass: 'EQUITY',
    base: 29,
    policies: [policy('BEST_AVAILABLE')],
    reroute: true,
    tags: ['systematic', 'rerouted'],
  }),
];

export { VENUES };
