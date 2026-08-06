import { describe, it, expect } from 'vitest';
import { VENUES, isTerminalStatus, rankVenues } from '@platform/sor-sdk';
import { applyRoutingQuery } from '../src/modules/smart-order-router/domain/query';
import {
  computeMetrics,
  computeHealth,
  replay,
} from '../src/modules/smart-order-router/domain/derive';
import { toRowVm, toDetailVm, toSummaryVm } from '../src/modules/smart-order-router/domain/mappers';
import { previewRoute } from '../src/modules/smart-order-router/data/rules';
import { ROUTINGS } from '../src/modules/smart-order-router/data/seed';

const equityVenues = VENUES.filter(
  (v) => v.capability.assetClasses.includes('EQUITY') && v.status === 'ONLINE',
);

describe('SOR module — seed integrity', () => {
  it('seeds 10 routings spanning the lifecycle', () => {
    expect(ROUTINGS).toHaveLength(10);
    expect(ROUTINGS.filter((r) => r.status === 'EXECUTION_READY').length).toBeGreaterThanOrEqual(6);
    expect(ROUTINGS.filter((r) => r.status === 'ROUTING_FAILED')).toHaveLength(2);
  });

  it('every seed routing replays consistently', () => {
    for (const routing of ROUTINGS) {
      const result = replay(routing);
      expect(result.reconstructedStatus).toBe(routing.status);
      expect(result.consistent).toBe(true);
    }
  });
});

describe('SOR module — ranking, query, derivations & preview', () => {
  it('ranks venues by the policy dimension', () => {
    expect(rankVenues(equityVenues, 'LOWEST_COST')[0]!.venueId).toBe('ib-smart');
    expect(rankVenues(equityVenues, 'LOWEST_LATENCY')[0]!.venueId).toBe('nasdaq');
    expect(rankVenues(equityVenues, 'HIGHEST_LIQUIDITY')[0]!.venueId).toBe('nyse');
  });

  it('scopes and aggregates deterministically', () => {
    expect(
      applyRoutingQuery(ROUTINGS, { scope: 'READY' }).every((r) => r.status === 'EXECUTION_READY'),
    ).toBe(true);
    const metrics = computeMetrics(ROUTINGS);
    expect(metrics.total).toBe(ROUTINGS.length);
    expect(metrics.byStatus.reduce((sum, s) => sum + s.count, 0)).toBe(ROUTINGS.length);
    const health = computeHealth(ROUTINGS, VENUES);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBe(4);
  });

  it('previews a routing decision and blocks a manual override to an offline venue', () => {
    const request = {
      id: 'P',
      executionId: 'P',
      orderId: 'P',
      clientOrderId: 'P',
      symbol: 'AAPL',
      side: 'BUY' as const,
      quantity: 100,
      assetClass: 'EQUITY',
      mode: 'SIMULATED' as const,
      policies: [{ type: 'LOWEST_COST' as const, enabled: true }],
      requestedBy: 'op',
      requestedAt: '2026-08-04T15:30:00.000Z',
      metadata: {
        source: 'p',
        executionId: 'P',
        orderId: 'P',
        clientOrderId: 'P',
        tags: [],
        entries: [],
      },
    };
    const preview = previewRoute(request, VENUES, [], '2026-08-04T15:30:00.000Z');
    expect(preview.ok).toBe(true);
    expect(preview.decision.selectedVenueId).toBe('ib-smart');
    const override = previewRoute(
      {
        ...request,
        policies: [{ type: 'MANUAL_OVERRIDE', enabled: true, preferredVenueId: 'sigma-x' }],
        preferredVenueId: 'sigma-x',
      },
      VENUES,
      [],
      '2026-08-04T15:30:00.000Z',
    );
    expect(override.ok).toBe(false);
  });
});

describe('SOR module — mappers', () => {
  it('maps rows, detail and summary to view models', () => {
    const ready = ROUTINGS.find((r) => r.status === 'EXECUTION_READY')!;
    expect(toRowVm(ready).status.label).toBe('Execution ready');
    const detail = toDetailVm(ready);
    expect(detail.decision?.ranked.length).toBeGreaterThan(0);
    expect(detail.actions.length).toBe(5);
    const summary = toSummaryVm(ROUTINGS, VENUES);
    expect(summary.total).toBe(ROUTINGS.length);
    expect(isTerminalStatus('EXECUTION_READY')).toBe(true);
  });
});
