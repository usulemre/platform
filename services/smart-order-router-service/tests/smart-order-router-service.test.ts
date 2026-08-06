import { describe, it, expect } from 'vitest';
import {
  ROUTING_POLICY_CATALOG,
  ROUTING_STATUSES,
  ROUTING_TRANSITIONS,
  VENUES,
  VENUE_TYPES,
  canApplyAction,
  canTransition,
  isVenueFeasible,
  permittedActions,
  rankVenues,
  type RoutingPolicy,
  type RoutingRequest,
} from '@platform/sor-sdk';
import { evaluateRoutingPolicy, type PolicyContext } from '../src/domain/policy-evaluators';
import { discoverVenues, filterVenues, routeRequest } from '../src/domain/routing';
import { createRouting, runRouting, applyAction } from '../src/domain/lifecycle';
import { applyRoutingSearch } from '../src/domain/search';
import { computeRoutingMetrics } from '../src/domain/metrics';
import { computeHealth } from '../src/domain/health';
import { replayRouting } from '../src/domain/replay';
import { ROUTINGS } from '../src/infrastructure/in-memory/seed';
import { createSmartOrderRouterService } from '../src/composition';

const AT = '2026-08-04T15:30:00.000Z';
const equityVenues = VENUES.filter(
  (v) => v.capability.assetClasses.includes('EQUITY') && v.status === 'ONLINE',
);

function policy(type: RoutingPolicy['type'], extra: Partial<RoutingPolicy> = {}): RoutingPolicy {
  return { type, enabled: true, ...extra };
}
function req(overrides: Partial<RoutingRequest> = {}): RoutingRequest {
  return {
    id: 'RTR-T',
    executionId: 'EXE-T',
    orderId: 'ORD-T',
    clientOrderId: 'OMS-T',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 100,
    assetClass: 'EQUITY',
    mode: 'SIMULATED',
    policies: [policy('BEST_AVAILABLE')],
    requestedBy: 'tester',
    requestedAt: AT,
    metadata: {
      source: 'test',
      executionId: 'EXE-T',
      orderId: 'ORD-T',
      clientOrderId: 'OMS-T',
      tags: ['t'],
      entries: [],
    },
    ...overrides,
  };
}

/* --------------------------------- unit --------------------------------- */

describe('routing lifecycle state machine (@platform/sor-sdk)', () => {
  it('defines 10 statuses and legal transitions', () => {
    expect(ROUTING_STATUSES).toHaveLength(10);
    expect(ROUTING_STATUSES[0]).toBe('EXECUTION_REQUEST');
    expect(canTransition('EXECUTION_REQUEST', 'VENUE_DISCOVERY')).toBe(true);
    expect(canTransition('EXECUTION_REQUEST', 'EXECUTION_READY')).toBe(false);
    expect(canTransition('ROUTE_CONFIRMED', 'EXECUTION_READY')).toBe(true);
    expect(canTransition('EXECUTION_READY', 'VENUE_DISCOVERY')).toBe(true); // reroute
    expect(ROUTING_TRANSITIONS.EXECUTION_READY).toEqual(['VENUE_DISCOVERY']);
  });

  it('gates actions by status', () => {
    expect(permittedActions('EXECUTION_READY').sort()).toEqual(['blacklist', 'recover', 'reroute']);
    expect(permittedActions('ROUTING_FAILED').sort()).toEqual([
      'blacklist',
      'fallback',
      'recover',
      'retry',
    ]);
    expect(canApplyAction('VENUE_RANKING', 'reroute')).toBe(false);
    expect(canApplyAction('VENUE_RANKING', 'blacklist')).toBe(true);
  });

  it('exposes 10 policies and 5 venue types', () => {
    expect(ROUTING_POLICY_CATALOG).toHaveLength(10);
    expect(VENUE_TYPES).toHaveLength(5);
    expect(VENUES.length).toBeGreaterThanOrEqual(5);
  });
});

describe('venue ranking framework (deterministic)', () => {
  it('ranks by the policy dimension', () => {
    expect(rankVenues(equityVenues, 'LOWEST_COST')[0]!.venueId).toBe('ib-smart'); // fee 1.5
    expect(rankVenues(equityVenues, 'LOWEST_LATENCY')[0]!.venueId).toBe('nasdaq'); // 6ms
    expect(rankVenues(equityVenues, 'HIGHEST_LIQUIDITY')[0]!.venueId).toBe('nyse'); // 0.95
    const ranked = rankVenues(equityVenues, 'BEST_AVAILABLE');
    expect(ranked[0]!.selected).toBe(true);
    expect(ranked[1]!.fallback).toBe(true);
    expect(ranked.every((r) => r.breakdown.composite >= 0 && r.breakdown.composite <= 1)).toBe(
      true,
    );
  });

  it('honors a preferred / manual venue', () => {
    expect(
      rankVenues(equityVenues, 'PREFERRED_VENUE', { preferredVenueId: 'nasdaq' })[0]!.venueId,
    ).toBe('nasdaq');
    expect(
      rankVenues(equityVenues, 'MANUAL_OVERRIDE', { preferredVenueId: 'ib-smart' })[0]!.venueId,
    ).toBe('ib-smart');
  });
});

describe('policy framework & routing pipeline', () => {
  it('evaluates and blocks a manual override to an infeasible venue', () => {
    const ctx: PolicyContext = {
      feasibleCount: 3,
      preferredVenueFeasible: false,
      preferredVenueId: 'sigma-x',
    };
    expect(
      evaluateRoutingPolicy(policy('MANUAL_OVERRIDE', { preferredVenueId: 'sigma-x' }), ctx).allow,
    ).toBe(false);
    expect(evaluateRoutingPolicy(policy('BEST_AVAILABLE'), ctx).allow).toBe(true);
  });

  it('discovers, filters and routes deterministically', () => {
    const candidates = discoverVenues(req(), VENUES);
    expect(candidates.every((v) => v.capability.assetClasses.includes('EQUITY'))).toBe(true);
    const { feasible } = filterVenues(candidates, req(), []);
    expect(feasible.every((v) => isVenueFeasible(v, req(), []))).toBe(true);
    const computation = routeRequest(req(), VENUES, [], AT);
    expect(computation.ok).toBe(true);
    expect(computation.decision.selectedVenueId).toBeDefined();
    // crypto with the only feasible venues blacklisted → fails
    const crypto = req({ symbol: 'BTCUSD', assetClass: 'CRYPTO', quantity: 5 });
    expect(routeRequest(crypto, VENUES, ['binance', 'coinbase'], AT).ok).toBe(false);
  });
});

describe('lifecycle application & replay', () => {
  it('runs the pipeline to EXECUTION_READY', () => {
    const routing = createRouting(req(), AT);
    const result = runRouting(routing, VENUES, AT);
    expect(result.ok && result.routing.status).toBe('EXECUTION_READY');
    if (result.ok) expect(result.routing.decision?.selectedVenueId).toBeDefined();
  });

  it('fails routing when no venue is feasible', () => {
    const routing = {
      ...createRouting(req({ symbol: 'BTCUSD', assetClass: 'CRYPTO', quantity: 5 }), AT),
      blacklistedVenueIds: ['binance', 'coinbase'],
    };
    const result = runRouting(routing, VENUES, AT);
    expect(result.ok && result.routing.status).toBe('ROUTING_FAILED');
  });

  it('re-routes a completed routing', () => {
    const ready = (
      runRouting(createRouting(req(), AT), VENUES, AT) as {
        ok: true;
        routing: import('@platform/sor-sdk').Routing;
      }
    ).routing;
    const rerouted = applyAction(ready, 'reroute', 'x', AT);
    expect(rerouted.ok && rerouted.routing.status).toBe('VENUE_DISCOVERY');
  });

  it('every seed routing replays consistently', () => {
    for (const routing of ROUTINGS) {
      const result = replayRouting(routing);
      expect(result.reconstructedStatus).toBe(routing.status);
      expect(result.consistent).toBe(true);
    }
  });
});

describe('search, metrics, health (pure)', () => {
  it('scopes and aggregates deterministically', () => {
    expect(
      applyRoutingSearch(ROUTINGS, { scope: 'READY' }).every((r) => r.status === 'EXECUTION_READY'),
    ).toBe(true);
    const metrics = computeRoutingMetrics(ROUTINGS);
    expect(metrics.total).toBe(ROUTINGS.length);
    expect(metrics.ready).toBe(8);
    expect(metrics.failed).toBe(2);
    expect(metrics.byVenue.length).toBeGreaterThan(0);
    const health = computeHealth(ROUTINGS, VENUES, AT);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBe(4);
  });
});

/* ------------------------------ integration ------------------------------ */

describe('SmartOrderRouterService (integration over in-memory ports)', () => {
  it('submits an equity request and reaches EXECUTION_READY', async () => {
    const service = createSmartOrderRouterService();
    const routing = await service.submitRoutingRequest(req({ id: 'RTR-INT-1' }), AT);
    expect(routing.status).toBe('EXECUTION_READY');
    expect(routing.decision?.selectedVenueId).toBeDefined();
    expect((await service.readyRoutings()).some((r) => r.id === 'ROU-INT-1')).toBe(true);
  });

  it('fails a crypto request when its venues are blacklisted', async () => {
    const service = createSmartOrderRouterService();
    await service.blacklistVenue('binance');
    await service.blacklistVenue('coinbase');
    const routing = await service.submitRoutingRequest(
      req({ id: 'RTR-INT-2', symbol: 'BTCUSD', assetClass: 'CRYPTO', quantity: 5 }),
      AT,
    );
    expect(routing.status).toBe('ROUTING_FAILED');
  });

  it('previews a decision, applies actions and serves views', async () => {
    const service = createSmartOrderRouterService();
    const preview = await service.previewRoute(req({ policies: [policy('LOWEST_COST')] }), AT);
    expect(preview.ok).toBe(true);
    expect(preview.decision.selectedVenueId).toBe('ib-smart');
    expect((await service.applyAction('ROU-0001', 'reroute', 'Dana', AT)).ok).toBe(true); // READY → re-run
    expect((await service.applyAction('ROU-0007', 'retry', 'Dana', AT)).ok).toBe(true); // FAILED → re-run
    expect((await service.applyAction('ROU-0003', 'reroute', 'Dana', AT)).ok).toBe(true);
    expect((await service.replay('ROU-0001'))?.consistent).toBe(true);
    expect(service.listPolicies()).toHaveLength(10);
    expect((await service.listVenues()).length).toBeGreaterThanOrEqual(5);
    expect((await service.venueHealthList(AT)).length).toBeGreaterThan(0);
  });
});
