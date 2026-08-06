import { describe, it, expect } from 'vitest';
import { isTerminalStatus } from '@platform/order-sdk';
import { applyOrderQuery } from '../src/modules/orders/domain/query';
import { computeMetrics, computeHealth, replay } from '../src/modules/orders/domain/derive';
import { toRowVm, toDetailVm, toSummaryVm } from '../src/modules/orders/domain/mappers';
import { ORDERS } from '../src/modules/orders/data/seed';

describe('orders module — seed integrity', () => {
  it('seeds 11 orders spanning the lifecycle', () => {
    expect(ORDERS).toHaveLength(11);
    expect(ORDERS.filter((o) => o.status === 'FILLED')).toHaveLength(1);
    expect(ORDERS.filter((o) => o.status === 'REJECTED')).toHaveLength(1);
    expect(ORDERS.some((o) => o.suspended)).toBe(true);
  });

  it('every seed order replays consistently with its recorded status', () => {
    for (const order of ORDERS) {
      const result = replay(order);
      expect(result.reconstructedStatus).toBe(order.status);
      expect(result.consistent).toBe(true);
    }
  });

  it('the filled order has correct fill bookkeeping', () => {
    const filled = ORDERS.find((o) => o.id === 'ORD-0001')!;
    expect(filled.execution.filledQuantity).toBe(1000);
    expect(filled.execution.remainingQuantity).toBe(0);
    expect(filled.execution.averagePrice).toBeGreaterThan(0);
  });
});

describe('orders module — query & derivations', () => {
  it('scopes the blotter', () => {
    expect(
      applyOrderQuery(ORDERS, { scope: 'COMPLETED' }).every((o) => isTerminalStatus(o.status)),
    ).toBe(true);
    expect(applyOrderQuery(ORDERS, { status: 'FILLED' })).toHaveLength(1);
    expect(applyOrderQuery(ORDERS, { side: 'SELL' }).every((o) => o.side === 'SELL')).toBe(true);
    expect(applyOrderQuery(ORDERS, { text: 'aapl' }).length).toBeGreaterThan(0);
  });

  it('computes metrics and health deterministically', () => {
    const metrics = computeMetrics(ORDERS);
    expect(metrics.total).toBe(ORDERS.length);
    expect(metrics.byStatus.reduce((sum, s) => sum + s.count, 0)).toBe(ORDERS.length);
    const health = computeHealth(ORDERS);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBe(4);
  });
});

describe('orders module — mappers', () => {
  it('maps rows, detail and summary to view models', () => {
    const filled = ORDERS.find((o) => o.id === 'ORD-0001')!;
    const row = toRowVm(filled);
    expect(row.status.label).toBe('Filled');
    expect(row.side.label).toBe('Buy');
    const detail = toDetailVm(filled);
    expect(detail.fills.length).toBe(2);
    expect(detail.actions.length).toBe(6);
    expect(detail.validationChecks.length).toBeGreaterThan(0);
    const summary = toSummaryVm(ORDERS);
    expect(summary.total).toBe(ORDERS.length);
    expect(summary.filled).toBe(1);
  });
});
