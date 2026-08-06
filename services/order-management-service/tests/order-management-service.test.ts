import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  canApplyAction,
  canTransition,
  describeOrderType,
  happyPathNext,
  isTerminalStatus,
  permittedActions,
  averageFillPrice,
  type OrderFill,
  type OrderRequest,
} from '@platform/order-sdk';
import { validateOrderRequest } from '../src/domain/validation';
import {
  applyAction,
  createOrder,
  recordFill,
  transitionOrder,
  validateOrder,
} from '../src/domain/lifecycle';
import { applyOrderSearch } from '../src/domain/search';
import { computeOrderMetrics } from '../src/domain/metrics';
import { computeHealth } from '../src/domain/health';
import { replayOrder } from '../src/domain/replay';
import { ORDERS } from '../src/infrastructure/in-memory/seed';
import { createOrderManagementService } from '../src/composition';
import { summarize } from '../src/application/order-management-service';

const AT = '2026-08-04T00:00:00.000Z';

function req(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    id: 'ORD-TEST',
    clientOrderId: 'OMS-TEST',
    symbol: 'AAPL',
    side: 'BUY',
    type: 'MARKET',
    quantity: 100,
    timeInForce: 'DAY',
    account: 'ACC-1',
    mode: 'PAPER',
    requestedBy: 'tester',
    requestedAt: AT,
    metadata: { source: 'test', tags: ['t'], entries: [] },
    ...overrides,
  };
}

/* --------------------------------- unit --------------------------------- */

describe('order lifecycle state machine (@platform/order-sdk)', () => {
  it('defines 12 ordered statuses and legal transitions', () => {
    expect(ORDER_STATUSES).toHaveLength(12);
    expect(ORDER_STATUSES[0]).toBe('CREATED');
    expect(ORDER_STATUSES[11]).toBe('EXPIRED');
    expect(canTransition('CREATED', 'VALIDATED')).toBe(true);
    expect(canTransition('CREATED', 'FILLED')).toBe(false);
    expect(canTransition('ACCEPTED', 'FILLED')).toBe(true);
    expect(canTransition('REJECTED', 'QUEUED')).toBe(true); // retry path
    expect(ORDER_TRANSITIONS.FILLED).toHaveLength(0);
    expect(happyPathNext('SUBMITTED')).toBe('ACCEPTED');
    expect(isTerminalStatus('FILLED')).toBe(true);
    expect(isTerminalStatus('ACCEPTED')).toBe(false);
  });

  it('gates actions by status and suspension', () => {
    expect(permittedActions('ACCEPTED', false).sort()).toEqual([
      'amend',
      'cancel',
      'replace',
      'suspend',
    ]);
    expect(permittedActions('ACCEPTED', true).sort()).toEqual(['cancel', 'resume']); // a suspended order can still be cancelled
    expect(permittedActions('REJECTED', false)).toEqual(['retry']);
    expect(permittedActions('FILLED', false)).toEqual([]);
    expect(canApplyAction('QUEUED', false, 'cancel')).toBe(true);
    expect(canApplyAction('FILLED', false, 'cancel')).toBe(false);
  });
});

describe('validation (real structural checks)', () => {
  it('rejects a limit order without a limit price and passes a valid one', () => {
    expect(validateOrderRequest(req({ type: 'LIMIT' }), AT).status).toBe('FAILED');
    expect(validateOrderRequest(req({ type: 'LIMIT', limitPrice: 10 }), AT).status).toBe('PASSED');
    expect(validateOrderRequest(req({ quantity: 0 }), AT).status).toBe('FAILED');
    expect(describeOrderType('STOP_LIMIT').requiresStopPrice).toBe(true);
  });
});

describe('lifecycle application (real, immutable)', () => {
  it('refuses an illegal transition', () => {
    const order = createOrder(req(), AT);
    expect(
      transitionOrder(order, { to: 'FILLED', type: 'FILL', actor: 'x', at: AT, message: 'nope' })
        .ok,
    ).toBe(false);
  });

  it('computes fill bookkeeping and completes the order', () => {
    let order = createOrder(req({ quantity: 100 }), AT);
    order = expectOk(validateOrder(order, validateOrderRequest(req(), AT), 'x', AT));
    // drive to ACCEPTED
    order = expectOk(
      transitionOrder(order, {
        to: 'PENDING_APPROVAL',
        type: 'APPROVAL_REQUESTED',
        actor: 'x',
        at: AT,
        message: 'a',
      }),
    );
    order = expectOk(
      transitionOrder(order, {
        to: 'APPROVED',
        type: 'APPROVED',
        actor: 'x',
        at: AT,
        message: 'a',
      }),
    );
    order = expectOk(
      transitionOrder(order, { to: 'QUEUED', type: 'QUEUED', actor: 'x', at: AT, message: 'a' }),
    );
    order = expectOk(
      transitionOrder(order, {
        to: 'SUBMITTED',
        type: 'SUBMITTED',
        actor: 'x',
        at: AT,
        message: 'a',
      }),
    );
    order = expectOk(
      transitionOrder(order, {
        to: 'ACCEPTED',
        type: 'ACCEPTED',
        actor: 'x',
        at: AT,
        message: 'a',
      }),
    );
    const f1: OrderFill = {
      id: 'f1',
      quantity: 40,
      price: 10,
      liquidity: 'TAKER',
      venue: 'v',
      at: AT,
    };
    const f2: OrderFill = {
      id: 'f2',
      quantity: 60,
      price: 12,
      liquidity: 'TAKER',
      venue: 'v',
      at: AT,
    };
    order = expectOk(recordFill(order, f1, 'x', AT));
    expect(order.status).toBe('PARTIALLY_FILLED');
    order = expectOk(recordFill(order, f2, 'x', AT));
    expect(order.status).toBe('FILLED');
    expect(order.execution.filledQuantity).toBe(100);
    expect(order.execution.averagePrice).toBeCloseTo(averageFillPrice([f1, f2])!, 9);
    expect(order.execution.remainingQuantity).toBe(0);
  });

  it('suspends and blocks amend while suspended, then resumes', () => {
    const accepted = seedById('ORD-0003'); // ACCEPTED
    const suspended = expectOk(applyAction(accepted, 'suspend', 'x', AT));
    expect(suspended.suspended).toBe(true);
    expect(applyAction(suspended, 'amend', 'x', AT, { quantity: 10 }).ok).toBe(false);
    const resumed = expectOk(applyAction(suspended, 'resume', 'x', AT));
    expect(resumed.suspended).toBe(false);
  });
});

describe('replay (event-sourced reconstruction)', () => {
  it('every seed order replays consistently with its recorded status', () => {
    for (const order of ORDERS) {
      const replay = replayOrder(order);
      expect(replay.reconstructedStatus).toBe(order.status);
      expect(replay.consistent).toBe(true);
    }
  });
});

describe('search, metrics, health (pure)', () => {
  it('scopes and filters the blotter', () => {
    expect(
      applyOrderSearch(ORDERS, { scope: 'COMPLETED' }).every((o) => isTerminalStatus(o.status)),
    ).toBe(true);
    expect(applyOrderSearch(ORDERS, { status: 'FILLED' })).toHaveLength(1);
    expect(applyOrderSearch(ORDERS, { side: 'SELL' }).every((o) => o.side === 'SELL')).toBe(true);
    expect(applyOrderSearch(ORDERS, { text: 'AAPL' }).length).toBeGreaterThan(0);
  });

  it('aggregates metrics and health deterministically', () => {
    const metrics = computeOrderMetrics(ORDERS);
    expect(metrics.total).toBe(ORDERS.length);
    expect(metrics.filled).toBe(1);
    expect(metrics.rejected).toBe(1);
    expect(metrics.byStatus.reduce((sum, s) => sum + s.count, 0)).toBe(ORDERS.length);
    const health = computeHealth(ORDERS, AT);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBeGreaterThan(0);
  });
});

/* ------------------------------ integration ------------------------------ */

describe('OrderManagementService (integration over in-memory ports)', () => {
  it('submits, advances through the lifecycle, fills, and reaches FILLED', async () => {
    const service = createOrderManagementService();
    const order = await service.submitOrderRequest(
      req({ id: 'ORD-INT-1', type: 'MARKET', quantity: 50 }),
      AT,
    );
    expect(order.status).toBe('VALIDATED');
    expect((await service.advance('ORD-INT-1', 'x', AT)).ok).toBe(true); // → PENDING_APPROVAL
    expect((await service.advance('ORD-INT-1', 'x', AT)).ok).toBe(true); // → APPROVED
    expect((await service.advance('ORD-INT-1', 'x', AT)).ok).toBe(true); // → QUEUED
    expect((await service.advance('ORD-INT-1', 'x', AT)).ok).toBe(true); // → SUBMITTED
    expect((await service.advance('ORD-INT-1', 'x', AT)).ok).toBe(true); // → ACCEPTED
    const fill: OrderFill = {
      id: 'if1',
      quantity: 50,
      price: 100,
      liquidity: 'TAKER',
      venue: 'v',
      at: AT,
    };
    const filled = await service.recordFill('ORD-INT-1', fill, 'x', AT);
    expect(filled.ok && filled.order.status).toBe('FILLED');
  });

  it('rejects an invalid submission at validation', async () => {
    const service = createOrderManagementService();
    const order = await service.submitOrderRequest(req({ id: 'ORD-INT-2', type: 'LIMIT' }), AT);
    expect(order.status).toBe('REJECTED');
  });

  it('applies actions only when permitted and cancels working orders', async () => {
    const service = createOrderManagementService();
    expect((await service.applyAction('ORD-0003', 'cancel', 'Dana', AT)).ok).toBe(true); // ACCEPTED → CANCELLED
    expect((await service.applyAction('ORD-0001', 'cancel', 'Dana', AT)).ok).toBe(false); // FILLED
    const retry = await service.applyAction('ORD-0007', 'retry', 'Dana', AT); // REJECTED → QUEUED
    expect(retry.ok && retry.order.status).toBe('QUEUED');
    expect((await service.applyAction('nope', 'cancel', 'Dana', AT)).ok).toBe(false);
  });

  it('serves scopes, timeline, audit, history, replay and summary', async () => {
    const service = createOrderManagementService();
    expect((await service.completedOrders()).every((o) => isTerminalStatus(o.status))).toBe(true);
    expect((await service.orderTimeline('ORD-0001')).length).toBeGreaterThan(0);
    expect((await service.orderAudit('ORD-0001')).length).toBeGreaterThan(0);
    expect((await service.orderHistory('ORD-0001'))?.states.length).toBeGreaterThan(0);
    expect((await service.replay('ORD-0001'))?.consistent).toBe(true);
    const summary = summarize(await service.listOrders());
    expect(summary.total).toBe(ORDERS.length);
    expect(summary.filled).toBe(1);
  });
});

function expectOk(result: {
  ok: boolean;
  order?: unknown;
  reason?: string;
}): import('@platform/order-sdk').Order {
  if (!result.ok) throw new Error(result.reason);
  return result.order as import('@platform/order-sdk').Order;
}

function seedById(id: string): import('@platform/order-sdk').Order {
  const order = ORDERS.find((o) => o.id === id);
  if (!order) throw new Error(`no seed order ${id}`);
  return order;
}
