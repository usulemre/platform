/**
 * Deterministic seed executions spanning the full lifecycle (UI mock DATA only). Each execution is
 * built by walking a legal status path — so its plan, event log, state history and audit trail are
 * internally consistent and replay-consistent — with genuine slice bookkeeping. NO broker/exchange/
 * FIX, NO execution, no persistence. Timestamps are fixed strings (no wall-clock).
 */
import {
  averageExecutionPrice,
  remainingQuantity,
  sliceQuantities,
  totalExecutedQuantity,
  venueForMode,
  type Execution,
  type ExecutionAudit,
  type ExecutionEvent,
  type ExecutionEventType,
  type ExecutionMode,
  type ExecutionPlan,
  type ExecutionPolicy,
  type ExecutionSession,
  type ExecutionState,
  type ExecutionStatus,
  type ExecutionTask,
  type PlanStrategy,
  type PolicyEvaluation,
  type SliceResult,
  type ValidationStatus,
} from '@platform/execution-engine-sdk';

const EVENT_FOR: Record<ExecutionStatus, ExecutionEventType> = {
  ORDER_RECEIVED: 'RECEIVED',
  EXECUTION_PLANNED: 'PLANNED',
  EXECUTION_VALIDATED: 'VALIDATED',
  WAITING_FOR_VENUE: 'QUEUED_FOR_VENUE',
  EXECUTING: 'EXECUTION_STARTED',
  PARTIALLY_EXECUTED: 'SLICE_EXECUTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
};

const ACTOR_FOR: Partial<Record<ExecutionStatus, string>> = {
  ORDER_RECEIVED: 'oms-router',
  EXECUTION_PLANNED: 'exec-planner',
  EXECUTION_VALIDATED: 'exec-validator',
  WAITING_FOR_VENUE: 'exec-router',
  EXECUTING: 'exec-venue',
  PARTIALLY_EXECUTED: 'exec-venue',
  COMPLETED: 'exec-venue',
  CANCELLED: 'Dana Ops',
  FAILED: 'exec-validator',
};

function at(minute: number): string {
  const hour = 13 + Math.floor(minute / 60);
  return `2026-08-01T${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00.000Z`;
}
const pad = (n: number) => n.toString().padStart(3, '0');
const policy = (
  type: ExecutionPolicy['type'],
  params: Record<string, number> = {},
): ExecutionPolicy => ({ type, enabled: true, params });

interface Spec {
  readonly id: string;
  readonly orderId: string;
  readonly seq: number;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly path: readonly ExecutionStatus[];
  readonly base: number;
  readonly mode?: ExecutionMode;
  readonly limitPrice?: number;
  readonly strategy?: PlanStrategy;
  readonly sliceCount?: number;
  readonly policies?: readonly ExecutionPolicy[];
  readonly slices?: readonly SliceResult[];
  readonly paused?: boolean;
  readonly sessionId?: string;
  readonly validationFailed?: boolean;
  readonly tags?: readonly string[];
}

function evaluations(spec: Spec): PolicyEvaluation[] {
  return (spec.policies ?? []).map((p) => ({
    type: p.type,
    allow: !(spec.validationFailed && p.type === 'RISK_VALIDATION'),
    decision: p.type.toLowerCase(),
    detail: `${p.type} policy`,
  }));
}

function mk(spec: Spec): Execution {
  const events: ExecutionEvent[] = [];
  const states: ExecutionState[] = [];
  const audit: ExecutionAudit[] = [];
  spec.path.forEach((status, i) => {
    const minute = spec.base + i;
    const type = EVENT_FOR[status];
    const actor = ACTOR_FOR[status] ?? 'exec';
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

  let cursor = spec.base + spec.path.length;
  const finalStatus = spec.path[spec.path.length - 1]!;
  if (spec.paused) {
    events.push({
      id: `${spec.id}:EVT:${pad(spec.path.length + 1)}`,
      type: 'PAUSED',
      status: finalStatus,
      action: 'pause',
      message: 'Execution paused (held).',
      actor: 'Dana Ops',
      at: at(cursor),
    });
    states.push({ status: finalStatus, at: at(cursor), note: 'Execution paused (held).' });
    audit.push({
      id: `${spec.id}:AUD:${pad(spec.path.length + 1)}`,
      actor: 'Dana Ops',
      action: 'PAUSED',
      detail: 'Execution paused (held).',
      at: at(cursor),
    });
    cursor += 1;
  }

  const venue = venueForMode(spec.mode ?? 'SIMULATED');
  const sliceCount = spec.sliceCount ?? 1;
  const slices = spec.slices ?? [];
  const executed = totalExecutedQuantity(slices);
  const plan: ExecutionPlan | undefined = spec.path.includes('EXECUTION_PLANNED')
    ? {
        id: `${spec.id}:PLAN`,
        requestId: spec.id,
        strategy: spec.strategy ?? 'IMMEDIATE',
        venue: venue.id,
        venueKind: venue.kind,
        mode: spec.mode ?? 'SIMULATED',
        sliceCount,
        sliceQuantity: spec.quantity / sliceCount,
        priority: 5,
        retryLimit: 3,
        timeoutSeconds: 300,
        throttlePerMinute: 60,
        policyEvaluations: evaluations(spec),
        plannedAt: at(spec.base + 1),
        note: `${(spec.strategy ?? 'IMMEDIATE').toLowerCase()} execution on ${venue.label}.`,
      }
    : undefined;
  const tasks: ExecutionTask[] = plan
    ? sliceQuantities(spec.quantity, sliceCount).map((q, index) => ({
        id: `${plan.id}:T${index + 1}`,
        sliceIndex: index,
        quantity: q,
        executedQuantity: 0,
        status: finalStatus,
        venue: venue.id,
        attempts: 0,
      }))
    : [];
  const validationStatus: ValidationStatus = spec.validationFailed
    ? 'FAILED'
    : spec.path.includes('EXECUTION_VALIDATED')
      ? 'PASSED'
      : 'NOT_RUN';

  return {
    id: spec.id,
    requestId: `${spec.id}:REQ`,
    orderId: spec.orderId,
    clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
    symbol: spec.symbol,
    side: spec.side,
    quantity: spec.quantity,
    orderType: 'LIMIT',
    limitPrice: spec.limitPrice,
    mode: spec.mode ?? 'SIMULATED',
    status: finalStatus,
    paused: spec.paused ?? false,
    priority: 5,
    attempts: 0,
    policies: spec.policies ?? [],
    plan,
    validation: {
      status: validationStatus,
      checks: [
        {
          id: 'quantity',
          label: 'Quantity is positive',
          passed: true,
          detail: `quantity = ${spec.quantity}`,
        },
        { id: 'venue', label: 'A venue was selected', passed: true, detail: venue.id },
        {
          id: 'policies',
          label: 'All policies permit execution',
          passed: !spec.validationFailed,
          detail: spec.validationFailed ? 'blocked by RISK_VALIDATION' : 'satisfied',
        },
      ],
      validatedAt:
        spec.path.includes('EXECUTION_VALIDATED') || spec.validationFailed
          ? at(spec.base + 2)
          : undefined,
    },
    result: {
      executedQuantity: executed,
      remainingQuantity: remainingQuantity(spec.quantity, slices),
      averagePrice: averageExecutionPrice(slices),
      lastExecutionAt: slices.length > 0 ? slices[slices.length - 1]!.at : undefined,
      slices,
      venue: venue.id,
    },
    tasks,
    events,
    states,
    audit,
    metadata: {
      source: 'order-management',
      orderId: spec.orderId,
      clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
      portfolioId: 'pf-core',
      strategyId: 'strat-equity-mn',
      sessionId: spec.sessionId,
      tags: spec.tags ?? ['systematic'],
      entries: [
        { key: 'team', value: 'Execution' },
        { key: 'desk', value: 'Systematic' },
      ],
    },
    tags: spec.tags ?? ['systematic'],
    sessionId: spec.sessionId,
    owner: { owner: 'exec-router', team: 'Execution', desk: 'Systematic' },
    createdAt: at(spec.base),
    updatedAt: at(cursor - 1),
  };
}

const slice = (id: string, quantity: number, price: number, minute: number): SliceResult => ({
  taskId: id,
  quantity,
  price,
  venue: 'execution-simulator',
  at: at(minute),
});
const FULL: readonly ExecutionStatus[] = [
  'ORDER_RECEIVED',
  'EXECUTION_PLANNED',
  'EXECUTION_VALIDATED',
  'WAITING_FOR_VENUE',
  'EXECUTING',
];

export const EXECUTIONS: readonly Execution[] = [
  mk({
    id: 'EXE-0001',
    orderId: 'ORD-0001',
    seq: 1,
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 1000,
    limitPrice: 187.5,
    base: 0,
    sessionId: 'SES-AM',
    strategy: 'SLICED',
    sliceCount: 2,
    policies: [
      policy('PARTIAL', { sliceCount: 2 }),
      policy('VENUE_SELECTION'),
      policy('RISK_VALIDATION'),
    ],
    path: [...FULL, 'PARTIALLY_EXECUTED', 'COMPLETED'],
    slices: [slice('EXE-0001:T1', 500, 187.46, 6), slice('EXE-0001:T2', 500, 187.5, 7)],
    tags: ['systematic', 'core'],
  }),
  mk({
    id: 'EXE-0002',
    orderId: 'ORD-0002',
    seq: 2,
    symbol: 'MSFT',
    side: 'BUY',
    quantity: 800,
    limitPrice: 421,
    base: 10,
    sessionId: 'SES-AM',
    strategy: 'SLICED',
    sliceCount: 2,
    policies: [
      policy('PARTIAL', { sliceCount: 2 }),
      policy('VENUE_SELECTION'),
      policy('RISK_VALIDATION'),
    ],
    path: [...FULL, 'PARTIALLY_EXECUTED'],
    slices: [slice('EXE-0002:T1', 400, 420.98, 16)],
  }),
  mk({
    id: 'EXE-0003',
    orderId: 'ORD-0003',
    seq: 3,
    symbol: 'NVDA',
    side: 'SELL',
    quantity: 500,
    mode: 'LIVE',
    limitPrice: 120,
    base: 20,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION'), policy('RISK_VALIDATION')],
    path: [...FULL],
  }),
  mk({
    id: 'EXE-0004',
    orderId: 'ORD-0004',
    seq: 4,
    symbol: 'GOOGL',
    side: 'BUY',
    quantity: 250,
    limitPrice: 181,
    base: 27,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION')],
    path: ['ORDER_RECEIVED', 'EXECUTION_PLANNED', 'EXECUTION_VALIDATED', 'WAITING_FOR_VENUE'],
  }),
  mk({
    id: 'EXE-0005',
    orderId: 'ORD-0005',
    seq: 5,
    symbol: 'TSLA',
    side: 'SELL',
    quantity: 150,
    limitPrice: 250,
    base: 34,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION')],
    path: ['ORDER_RECEIVED', 'EXECUTION_PLANNED', 'EXECUTION_VALIDATED'],
  }),
  mk({
    id: 'EXE-0006',
    orderId: 'ORD-0006',
    seq: 6,
    symbol: 'AMZN',
    side: 'BUY',
    quantity: 2000,
    limitPrice: 178,
    base: 40,
    strategy: 'SCHEDULED',
    policies: [policy('SCHEDULED', { delayMinutes: 30 }), policy('VENUE_SELECTION')],
    path: ['ORDER_RECEIVED', 'EXECUTION_PLANNED'],
  }),
  mk({
    id: 'EXE-0007',
    orderId: 'ORD-0007',
    seq: 7,
    symbol: 'META',
    side: 'BUY',
    quantity: 300,
    base: 44,
    path: ['ORDER_RECEIVED'],
  }),
  mk({
    id: 'EXE-0008',
    orderId: 'ORD-0008',
    seq: 8,
    symbol: 'JPM',
    side: 'SELL',
    quantity: 600,
    limitPrice: 205,
    base: 46,
    validationFailed: true,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION'), policy('RISK_VALIDATION')],
    path: ['ORDER_RECEIVED', 'EXECUTION_PLANNED', 'FAILED'],
    tags: ['systematic', 'failed'],
  }),
  mk({
    id: 'EXE-0009',
    orderId: 'ORD-0009',
    seq: 9,
    symbol: 'XOM',
    side: 'BUY',
    quantity: 900,
    limitPrice: 112,
    base: 50,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION')],
    path: [
      'ORDER_RECEIVED',
      'EXECUTION_PLANNED',
      'EXECUTION_VALIDATED',
      'WAITING_FOR_VENUE',
      'CANCELLED',
    ],
  }),
  mk({
    id: 'EXE-0010',
    orderId: 'ORD-0010',
    seq: 10,
    symbol: 'BAC',
    side: 'BUY',
    quantity: 1200,
    limitPrice: 39.5,
    base: 20,
    sessionId: 'SES-AM',
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION')],
    path: ['ORDER_RECEIVED', 'EXECUTION_PLANNED', 'EXECUTION_VALIDATED', 'WAITING_FOR_VENUE'],
    paused: true,
    tags: ['systematic', 'paused'],
  }),
];

export const SESSIONS: readonly ExecutionSession[] = [
  {
    id: 'SES-AM',
    label: 'Morning systematic session',
    mode: 'SIMULATED',
    status: 'ACTIVE',
    executionIds: EXECUTIONS.filter((e) => e.sessionId === 'SES-AM').map((e) => e.id),
    openedBy: 'oms-router',
    openedAt: at(0),
    note: 'Morning batch of systematic executions.',
  },
  {
    id: 'SES-PM',
    label: 'Afternoon discretionary session',
    mode: 'PAPER',
    status: 'OPEN',
    executionIds: [],
    openedBy: 'Dana Ops',
    openedAt: at(40),
    note: 'Reserved for afternoon executions.',
  },
];
