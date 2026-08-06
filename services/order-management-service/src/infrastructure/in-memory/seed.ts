/**
 * Deterministic seed orders spanning the full lifecycle (development/test only). Each order is built
 * by applying the REAL domain lifecycle functions to an order request, so its event log, state
 * history and audit trail are genuine (and replay-consistent) — NOT hand-faked. Mock DATA only; no
 * broker/exchange/FIX. Timestamps are fixed strings (no wall-clock).
 */
import type {
  ExecutionMode,
  Order,
  OrderFill,
  OrderRequest,
  OrderSide,
  OrderType,
  TimeInForce,
} from '@platform/order-sdk';
import { validateOrderRequest } from '../../domain/validation';
import {
  acceptOrder,
  applyAction,
  createOrder,
  decideApproval,
  defaultRoute,
  expireOrder,
  queueOrder,
  recordFill,
  requestApproval,
  submitOrder,
  validateOrder,
  type LifecycleResult,
} from '../../domain/lifecycle';

function unwrap(result: LifecycleResult): Order {
  if (!result.ok) throw new Error(`seed lifecycle error: ${result.reason}`);
  return result.order;
}

function at(minute: number): string {
  return `2026-08-01T09:${String(minute).padStart(2, '0')}:00.000Z`;
}

interface RequestOpts {
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly trailingAmount?: number;
  readonly displayQuantity?: number;
  readonly timeInForce?: TimeInForce;
  readonly mode?: ExecutionMode;
  readonly strategyId?: string;
  readonly portfolioId?: string;
  readonly signalId?: string;
  readonly tags?: readonly string[];
  readonly requestedBy?: string;
}

function mkRequest(
  id: string,
  seq: number,
  symbol: string,
  side: OrderSide,
  type: OrderType,
  quantity: number,
  opts: RequestOpts = {},
): OrderRequest {
  return {
    id,
    clientOrderId: `OMS-${seq.toString().padStart(6, '0')}`,
    symbol,
    side,
    type,
    quantity,
    limitPrice: opts.limitPrice,
    stopPrice: opts.stopPrice,
    trailingAmount: opts.trailingAmount,
    displayQuantity: opts.displayQuantity,
    timeInForce: opts.timeInForce ?? 'DAY',
    account: 'ACC-SYSTEMATIC-1',
    mode: opts.mode ?? 'PAPER',
    requestedBy: opts.requestedBy ?? 'oms-router',
    requestedAt: at(0),
    metadata: {
      source: 'portfolio-optimization',
      strategyId: opts.strategyId ?? 'strat-equity-mn',
      portfolioId: opts.portfolioId ?? 'pf-core',
      signalId: opts.signalId ?? 'sig-momentum',
      optimizationRunId: 'opt-run-2201',
      tags: opts.tags ?? ['systematic'],
      entries: [
        { key: 'team', value: 'Systematic Trading' },
        { key: 'desk', value: 'Equities' },
      ],
    },
  };
}

const fill = (
  id: string,
  quantity: number,
  price: number,
  minute: number,
  venue = 'paper-venue',
): OrderFill => ({ id, quantity, price, liquidity: 'TAKER', venue, at: at(minute) });

/** Create → validated, given the request passes validation. */
function created(request: OrderRequest, minute: number): Order {
  const order = createOrder(request, at(minute));
  return unwrap(
    validateOrder(
      order,
      validateOrderRequest(request, at(minute)),
      request.requestedBy,
      at(minute + 1),
    ),
  );
}

/** Drive a validated order through approval → queued → submitted → accepted. */
function accepted(request: OrderRequest, base: number): Order {
  let order = created(request, base);
  order = unwrap(requestApproval(order, 'oms-router', at(base + 2)));
  order = unwrap(decideApproval(order, true, 'Gita Governance', at(base + 3), 'Within mandate.'));
  order = unwrap(queueOrder(order, defaultRoute(order.mode), 'oms-router', at(base + 4)));
  order = unwrap(submitOrder(order, 'exec-gateway', at(base + 5)));
  return unwrap(acceptOrder(order, 'exec-gateway', at(base + 6)));
}

function buildOrders(): Order[] {
  const orders: Order[] = [];

  // 1) FILLED — full lifecycle with two fills.
  let filled = accepted(
    mkRequest('ORD-0001', 1, 'AAPL', 'BUY', 'LIMIT', 1000, {
      limitPrice: 187.5,
      mode: 'SIMULATED',
    }),
    0,
  );
  filled = unwrap(
    recordFill(
      filled,
      fill('ORD-0001:F1', 400, 187.42, 7, 'execution-simulator'),
      'exec-gateway',
      at(7),
    ),
  );
  filled = unwrap(
    recordFill(
      filled,
      fill('ORD-0001:F2', 600, 187.48, 8, 'execution-simulator'),
      'exec-gateway',
      at(8),
    ),
  );
  orders.push(filled);

  // 2) PARTIALLY_FILLED — working with one fill.
  let partial = accepted(
    mkRequest('ORD-0002', 2, 'MSFT', 'BUY', 'LIMIT', 800, { limitPrice: 421.0 }),
    10,
  );
  partial = unwrap(
    recordFill(partial, fill('ORD-0002:F1', 300, 420.95, 17), 'exec-gateway', at(17)),
  );
  orders.push(partial);

  // 3) ACCEPTED — working, no fills.
  orders.push(
    accepted(mkRequest('ORD-0003', 3, 'NVDA', 'SELL', 'MARKET', 500, { mode: 'LIVE' }), 20),
  );

  // 4) SUBMITTED.
  {
    let order = created(
      mkRequest('ORD-0004', 4, 'GOOGL', 'BUY', 'STOP_LIMIT', 250, {
        stopPrice: 180,
        limitPrice: 181,
      }),
      27,
    );
    order = unwrap(requestApproval(order, 'oms-router', at(29)));
    order = unwrap(decideApproval(order, true, 'Gita Governance', at(30)));
    order = unwrap(queueOrder(order, defaultRoute(order.mode), 'oms-router', at(31)));
    orders.push(unwrap(submitOrder(order, 'exec-gateway', at(32))));
  }

  // 5) QUEUED — approved and routed.
  {
    let order = created(
      mkRequest('ORD-0005', 5, 'TSLA', 'SELL', 'TRAILING_STOP', 150, { trailingAmount: 5 }),
      34,
    );
    order = unwrap(requestApproval(order, 'oms-router', at(36)));
    order = unwrap(decideApproval(order, true, 'Gita Governance', at(37)));
    orders.push(unwrap(queueOrder(order, defaultRoute(order.mode), 'oms-router', at(38))));
  }

  // 6) PENDING_APPROVAL.
  {
    const order = created(
      mkRequest('ORD-0006', 6, 'AMZN', 'BUY', 'ICEBERG', 2000, {
        limitPrice: 178,
        displayQuantity: 200,
      }),
      40,
    );
    orders.push(unwrap(requestApproval(order, 'oms-router', at(42))));
  }

  // 7) REJECTED — validation fails (a LIMIT order with no limit price).
  {
    const request = mkRequest('ORD-0007', 7, 'META', 'BUY', 'LIMIT', 300);
    const order = createOrder(request, at(44));
    orders.push(
      unwrap(
        validateOrder(order, validateOrderRequest(request, at(45)), request.requestedBy, at(45)),
      ),
    );
  }

  // 8) CANCELLED — cancelled while working.
  orders.push(
    unwrap(
      applyAction(
        accepted(mkRequest('ORD-0008', 8, 'JPM', 'SELL', 'LIMIT', 600, { limitPrice: 205 }), 46),
        'cancel',
        'Dana Ops',
        at(54),
      ),
    ),
  );

  // 9) EXPIRED — expired while working.
  orders.push(
    unwrap(
      expireOrder(
        accepted(
          mkRequest('ORD-0009', 9, 'XOM', 'BUY', 'LIMIT', 900, {
            limitPrice: 112,
            timeInForce: 'GTD',
          }),
          0,
        ),
        'oms-clock',
        at(9),
      ),
    ),
  );

  // 10) APPROVED — approved, not yet queued.
  {
    let order = created(mkRequest('ORD-0010', 10, 'V', 'BUY', 'MARKET', 400), 12);
    order = unwrap(requestApproval(order, 'oms-router', at(14)));
    orders.push(unwrap(decideApproval(order, true, 'Gita Governance', at(15))));
  }

  // 11) Suspended working order (ACCEPTED + suspend).
  orders.push(
    unwrap(
      applyAction(
        accepted(mkRequest('ORD-0011', 11, 'BAC', 'BUY', 'LIMIT', 1200, { limitPrice: 39.5 }), 20),
        'suspend',
        'Dana Ops',
        at(28),
      ),
    ),
  );

  return orders;
}

export const ORDERS: readonly Order[] = buildOrders();
