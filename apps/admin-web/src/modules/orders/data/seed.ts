/**
 * Deterministic seed orders spanning the full lifecycle (UI mock DATA only). Each order is built by
 * walking a legal status path — so its event log, state history and audit trail are internally
 * consistent and replay-consistent — with genuine fill bookkeeping (filled/remaining/average from
 * the order's own fills). NO broker/exchange/FIX, NO execution, no persistence. Timestamps are fixed
 * strings (no wall-clock). This is the UI's own mock, independent of the service tier.
 */
import {
  averageFillPrice,
  remainingQuantity,
  totalFilledQuantity,
  type ExecutionMode,
  type Order,
  type OrderApproval,
  type OrderAudit,
  type OrderEvent,
  type OrderEventType,
  type OrderFill,
  type OrderRoute,
  type OrderSide,
  type OrderState,
  type OrderStatus,
  type OrderType,
  type OrderValidation,
  type TimeInForce,
  type ValidationCheck,
} from '@platform/order-sdk';

const EVENT_FOR: Record<OrderStatus, OrderEventType> = {
  CREATED: 'CREATED',
  VALIDATED: 'VALIDATED',
  PENDING_APPROVAL: 'APPROVAL_REQUESTED',
  APPROVED: 'APPROVED',
  QUEUED: 'QUEUED',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  PARTIALLY_FILLED: 'PARTIAL_FILL',
  FILLED: 'FILL',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const ACTOR_FOR: Partial<Record<OrderStatus, string>> = {
  CREATED: 'oms-router',
  VALIDATED: 'oms-validator',
  PENDING_APPROVAL: 'oms-router',
  APPROVED: 'Gita Governance',
  QUEUED: 'oms-router',
  SUBMITTED: 'exec-gateway',
  ACCEPTED: 'exec-gateway',
  PARTIALLY_FILLED: 'exec-gateway',
  FILLED: 'exec-gateway',
  CANCELLED: 'Dana Ops',
  REJECTED: 'oms-validator',
  EXPIRED: 'oms-clock',
};

function at(minute: number): string {
  const hour = 9 + Math.floor(minute / 60);
  return `2026-08-01T${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00.000Z`;
}

const pad = (n: number) => n.toString().padStart(3, '0');

interface Spec {
  readonly id: string;
  readonly seq: number;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly path: readonly OrderStatus[];
  readonly base: number;
  readonly mode?: ExecutionMode;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly trailingAmount?: number;
  readonly displayQuantity?: number;
  readonly timeInForce?: TimeInForce;
  readonly fills?: readonly OrderFill[];
  readonly suspended?: boolean;
  readonly validationFailed?: boolean;
  readonly strategyId?: string;
  readonly signalId?: string;
  readonly tags?: readonly string[];
}

function validationChecks(spec: Spec): ValidationCheck[] {
  return [
    {
      id: 'quantity',
      label: 'Quantity is positive',
      passed: true,
      detail: `quantity = ${spec.quantity}`,
    },
    { id: 'symbol', label: 'Symbol is present', passed: true, detail: spec.symbol },
    {
      id: 'limit_price',
      label: 'Limit price present when required',
      passed: !spec.validationFailed,
      detail: spec.validationFailed ? 'limit = (missing)' : 'ok',
    },
  ];
}

function mk(spec: Spec): Order {
  const events: OrderEvent[] = [];
  const states: OrderState[] = [];
  const audit: OrderAudit[] = [];
  spec.path.forEach((status, i) => {
    const minute = spec.base + i;
    const type = EVENT_FOR[status];
    const actor = ACTOR_FOR[status] ?? 'oms';
    const message = `${type.replace(/_/g, ' ')} — ${spec.side} ${spec.quantity} ${spec.symbol}`;
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

  let minuteCursor = spec.base + spec.path.length;
  if (spec.suspended) {
    const actor = 'Dana Ops';
    const status = spec.path[spec.path.length - 1]!;
    events.push({
      id: `${spec.id}:EVT:${pad(spec.path.length + 1)}`,
      type: 'SUSPENDED',
      status,
      action: 'suspend',
      message: 'Order suspended (held).',
      actor,
      at: at(minuteCursor),
    });
    states.push({ status, at: at(minuteCursor), note: 'Order suspended (held).' });
    audit.push({
      id: `${spec.id}:AUD:${pad(spec.path.length + 1)}`,
      actor,
      action: 'SUSPENDED',
      detail: 'Order suspended (held).',
      at: at(minuteCursor),
    });
    minuteCursor += 1;
  }

  const finalStatus = (
    spec.suspended ? spec.path[spec.path.length - 1] : spec.path[spec.path.length - 1]
  )!;
  const fills = spec.fills ?? [];
  const filled = totalFilledQuantity(fills);
  const remaining = remainingQuantity(spec.quantity, fills);
  const route: OrderRoute | undefined = spec.path.includes('QUEUED')
    ? {
        venue:
          spec.mode === 'LIVE'
            ? 'live-trading-gateway'
            : spec.mode === 'SIMULATED'
              ? 'execution-simulator'
              : 'paper-venue',
        destination: 'SMART',
        mode: spec.mode ?? 'PAPER',
        gatewayRef: `gw:${spec.id}`,
        routedAt: at(spec.base + spec.path.indexOf('QUEUED')),
      }
    : undefined;
  const validation: OrderValidation = spec.validationFailed
    ? { status: 'FAILED', checks: validationChecks(spec), validatedAt: at(spec.base + 1) }
    : spec.path.includes('VALIDATED')
      ? { status: 'PASSED', checks: validationChecks(spec), validatedAt: at(spec.base + 1) }
      : { status: 'NOT_RUN', checks: [] };
  const approvals: OrderApproval[] = spec.path.includes('PENDING_APPROVAL')
    ? [
        {
          id: `${spec.id}:APR:1`,
          role: 'trading-governance',
          status: spec.path.includes('APPROVED')
            ? 'APPROVED'
            : finalStatus === 'REJECTED'
              ? 'REJECTED'
              : 'PENDING',
          decidedBy: spec.path.includes('APPROVED') ? 'Gita Governance' : undefined,
          decidedAt: spec.path.includes('APPROVED')
            ? at(spec.base + spec.path.indexOf('APPROVED'))
            : undefined,
          rationale: spec.path.includes('APPROVED') ? 'Within mandate.' : undefined,
        },
      ]
    : [];

  return {
    id: spec.id,
    clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
    symbol: spec.symbol,
    side: spec.side,
    type: spec.type,
    quantity: spec.quantity,
    limitPrice: spec.limitPrice,
    stopPrice: spec.stopPrice,
    trailingAmount: spec.trailingAmount,
    displayQuantity: spec.displayQuantity,
    timeInForce: spec.timeInForce ?? 'DAY',
    status: finalStatus,
    suspended: spec.suspended ?? false,
    mode: spec.mode ?? 'PAPER',
    account: 'ACC-SYSTEMATIC-1',
    priority: 0,
    version: 1,
    execution: {
      filledQuantity: filled,
      remainingQuantity: remaining,
      averagePrice: averageFillPrice(fills),
      lastFillAt: fills.length > 0 ? fills[fills.length - 1]!.at : undefined,
      fills,
      route,
    },
    validation,
    approvals,
    route,
    events,
    states,
    audit,
    metadata: {
      source: 'portfolio-optimization',
      strategyId: spec.strategyId ?? 'strat-equity-mn',
      portfolioId: 'pf-core',
      signalId: spec.signalId ?? 'sig-momentum',
      optimizationRunId: 'opt-run-2201',
      tags: spec.tags ?? ['systematic'],
      entries: [
        { key: 'team', value: 'Systematic Trading' },
        { key: 'desk', value: 'Equities' },
      ],
    },
    tags: spec.tags ?? ['systematic'],
    owner: { owner: 'oms-router', team: 'Systematic Trading', desk: 'Equities' },
    createdAt: at(spec.base),
    updatedAt: at(minuteCursor - 1),
  };
}

const fill = (
  id: string,
  quantity: number,
  price: number,
  minute: number,
  venue = 'execution-simulator',
): OrderFill => ({ id, quantity, price, liquidity: 'TAKER', venue, at: at(minute) });

const FULL: readonly OrderStatus[] = [
  'CREATED',
  'VALIDATED',
  'PENDING_APPROVAL',
  'APPROVED',
  'QUEUED',
  'SUBMITTED',
  'ACCEPTED',
];

export const ORDERS: readonly Order[] = [
  mk({
    id: 'ORD-0001',
    seq: 1,
    symbol: 'AAPL',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 1000,
    limitPrice: 187.5,
    mode: 'SIMULATED',
    base: 0,
    path: [...FULL, 'PARTIALLY_FILLED', 'FILLED'],
    fills: [fill('ORD-0001:F1', 400, 187.42, 7), fill('ORD-0001:F2', 600, 187.48, 8)],
    tags: ['systematic', 'core'],
  }),
  mk({
    id: 'ORD-0002',
    seq: 2,
    symbol: 'MSFT',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 800,
    limitPrice: 421.0,
    base: 10,
    path: [...FULL, 'PARTIALLY_FILLED'],
    fills: [fill('ORD-0002:F1', 300, 420.95, 17)],
  }),
  mk({
    id: 'ORD-0003',
    seq: 3,
    symbol: 'NVDA',
    side: 'SELL',
    type: 'MARKET',
    quantity: 500,
    mode: 'LIVE',
    base: 20,
    path: [...FULL],
  }),
  mk({
    id: 'ORD-0004',
    seq: 4,
    symbol: 'GOOGL',
    side: 'BUY',
    type: 'STOP_LIMIT',
    quantity: 250,
    stopPrice: 180,
    limitPrice: 181,
    base: 27,
    path: ['CREATED', 'VALIDATED', 'PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'SUBMITTED'],
  }),
  mk({
    id: 'ORD-0005',
    seq: 5,
    symbol: 'TSLA',
    side: 'SELL',
    type: 'TRAILING_STOP',
    quantity: 150,
    trailingAmount: 5,
    base: 34,
    path: ['CREATED', 'VALIDATED', 'PENDING_APPROVAL', 'APPROVED', 'QUEUED'],
  }),
  mk({
    id: 'ORD-0006',
    seq: 6,
    symbol: 'AMZN',
    side: 'BUY',
    type: 'ICEBERG',
    quantity: 2000,
    limitPrice: 178,
    displayQuantity: 200,
    base: 40,
    path: ['CREATED', 'VALIDATED', 'PENDING_APPROVAL'],
  }),
  mk({
    id: 'ORD-0007',
    seq: 7,
    symbol: 'META',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 300,
    base: 44,
    path: ['CREATED', 'REJECTED'],
    validationFailed: true,
    tags: ['systematic', 'rejected'],
  }),
  mk({
    id: 'ORD-0008',
    seq: 8,
    symbol: 'JPM',
    side: 'SELL',
    type: 'LIMIT',
    quantity: 600,
    limitPrice: 205,
    base: 46,
    path: [...FULL, 'CANCELLED'],
  }),
  mk({
    id: 'ORD-0009',
    seq: 9,
    symbol: 'XOM',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 900,
    limitPrice: 112,
    timeInForce: 'GTD',
    base: 30,
    path: [...FULL, 'EXPIRED'],
  }),
  mk({
    id: 'ORD-0010',
    seq: 10,
    symbol: 'V',
    side: 'BUY',
    type: 'MARKET',
    quantity: 400,
    base: 12,
    path: ['CREATED', 'VALIDATED', 'PENDING_APPROVAL', 'APPROVED'],
  }),
  mk({
    id: 'ORD-0011',
    seq: 11,
    symbol: 'BAC',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 1200,
    limitPrice: 39.5,
    base: 20,
    path: [...FULL],
    suspended: true,
    tags: ['systematic', 'suspended'],
  }),
];
