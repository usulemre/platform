/**
 * Deterministic seed executions spanning the full lifecycle (development/test only). Each execution
 * is built by applying the REAL domain lifecycle functions to an execution request — so its plan,
 * event log, state history and audit trail are genuine (and replay-consistent), NOT hand-faked.
 * Mock DATA only; no broker/exchange/FIX. Timestamps are fixed strings (no wall-clock).
 */
import type {
  Execution,
  ExecutionMode,
  ExecutionPolicy,
  ExecutionRequest,
  ExecutionSession,
  PolicyType,
} from '@platform/execution-engine-sdk';
import { planExecution, planTasks } from '../../domain/planner';
import { validateExecution } from '../../domain/validation';
import {
  applyAction,
  createExecution,
  planStep,
  queueStep,
  startStep,
  validateStep,
  type LifecycleResult,
} from '../../domain/lifecycle';
import { executeAll, executeSlice } from '../../domain/executors';
import type { PolicyContext } from '../../domain/policy-evaluators';

function unwrap(result: LifecycleResult): Execution {
  if (!result.ok) throw new Error(`seed lifecycle error: ${result.reason}`);
  return result.execution;
}

function at(minute: number): string {
  const hour = 13 + Math.floor(minute / 60);
  return `2026-08-01T${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00.000Z`;
}

const policy = (
  type: PolicyType,
  params: Record<string, number> = {},
  enabled = true,
): ExecutionPolicy => ({ type, enabled, params });

interface Spec {
  readonly id: string;
  readonly orderId: string;
  readonly seq: number;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly mode?: ExecutionMode;
  readonly limitPrice?: number;
  readonly policies?: readonly ExecutionPolicy[];
  readonly sessionId?: string;
  readonly tags?: readonly string[];
  readonly base: number;
}

function mkRequest(spec: Spec): ExecutionRequest {
  return {
    id: spec.id,
    orderId: spec.orderId,
    clientOrderId: `OMS-${spec.seq.toString().padStart(6, '0')}`,
    symbol: spec.symbol,
    side: spec.side,
    quantity: spec.quantity,
    orderType: 'LIMIT',
    limitPrice: spec.limitPrice ?? 100,
    mode: spec.mode ?? 'SIMULATED',
    priority: 5,
    policies: spec.policies ?? [
      policy('IMMEDIATE'),
      policy('VENUE_SELECTION'),
      policy('PRIORITY', { priority: 5 }),
      policy('RETRY', { maxAttempts: 3 }),
      policy('TIMEOUT', { timeoutSeconds: 300 }),
      policy('RISK_VALIDATION'),
    ],
    requestedBy: 'oms-router',
    requestedAt: at(spec.base),
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
  };
}

/** Create → planned → validated for a request (given it passes validation). */
function validated(request: ExecutionRequest, riskApproved: boolean): Execution {
  const ctx: PolicyContext = {
    now: request.requestedAt,
    mode: request.mode,
    riskApproved,
    attempts: 0,
    quantity: request.quantity,
  };
  const plan = planExecution(request, ctx, request.requestedAt);
  const created = createExecution(request, request.requestedAt);
  const planned = unwrap(
    planStep(
      created,
      plan,
      planTasks(plan, request.quantity),
      'exec-planner',
      at(base(request) + 1),
    ),
  );
  return unwrap(
    validateStep(
      planned,
      validateExecution(request, plan, at(base(request) + 2)),
      'exec-validator',
      at(base(request) + 2),
    ),
  );
}

function base(request: ExecutionRequest): number {
  return (
    Number(request.requestedAt.slice(14, 16)) +
    (Number(request.requestedAt.slice(11, 13)) - 13) * 60
  );
}

function buildExecutions(): Execution[] {
  const out: Execution[] = [];

  // 1) COMPLETED — sliced into 2, fully executed.
  {
    const request = mkRequest({
      id: 'EXR-0001',
      orderId: 'ORD-0001',
      seq: 1,
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 1000,
      limitPrice: 187.5,
      base: 0,
      sessionId: 'SES-AM',
      policies: [
        policy('PARTIAL', { sliceCount: 2 }),
        policy('VENUE_SELECTION'),
        policy('PRIORITY', { priority: 6 }),
        policy('RETRY', { maxAttempts: 3 }),
        policy('RISK_VALIDATION'),
      ],
    });
    const v = validated(request, true);
    const queued = unwrap(queueStep(v, 'exec-router', at(4)));
    out.push(unwrap(executeAll(queued, 187.46, at(6))));
  }

  // 2) PARTIALLY_EXECUTED — sliced into 2, one slice done.
  {
    const request = mkRequest({
      id: 'EXR-0002',
      orderId: 'ORD-0002',
      seq: 2,
      symbol: 'MSFT',
      side: 'BUY',
      quantity: 800,
      limitPrice: 421,
      base: 10,
      sessionId: 'SES-AM',
      policies: [
        policy('PARTIAL', { sliceCount: 2 }),
        policy('VENUE_SELECTION'),
        policy('RISK_VALIDATION'),
      ],
    });
    const queued = unwrap(queueStep(validated(request, true), 'exec-router', at(14)));
    out.push(unwrap(executeSlice(queued, 420.98, at(16))));
  }

  // 3) EXECUTING — started, no slice yet.
  {
    const request = mkRequest({
      id: 'EXR-0003',
      orderId: 'ORD-0003',
      seq: 3,
      symbol: 'NVDA',
      side: 'SELL',
      quantity: 500,
      mode: 'LIVE',
      limitPrice: 120,
      base: 20,
    });
    out.push(
      unwrap(
        startStep(
          unwrap(queueStep(validated(request, true), 'exec-router', at(24))),
          'exec-venue',
          at(25),
        ),
      ),
    );
  }

  // 4) WAITING_FOR_VENUE.
  {
    const request = mkRequest({
      id: 'EXR-0004',
      orderId: 'ORD-0004',
      seq: 4,
      symbol: 'GOOGL',
      side: 'BUY',
      quantity: 250,
      limitPrice: 181,
      base: 27,
    });
    out.push(unwrap(queueStep(validated(request, true), 'exec-router', at(30))));
  }

  // 5) EXECUTION_VALIDATED.
  out.push(
    validated(
      mkRequest({
        id: 'EXR-0005',
        orderId: 'ORD-0005',
        seq: 5,
        symbol: 'TSLA',
        side: 'SELL',
        quantity: 150,
        limitPrice: 250,
        base: 34,
      }),
      true,
    ),
  );

  // 6) EXECUTION_PLANNED.
  {
    const request = mkRequest({
      id: 'EXR-0006',
      orderId: 'ORD-0006',
      seq: 6,
      symbol: 'AMZN',
      side: 'BUY',
      quantity: 2000,
      limitPrice: 178,
      base: 40,
      policies: [
        policy('SCHEDULED', { delayMinutes: 30 }),
        policy('VENUE_SELECTION'),
        policy('RISK_VALIDATION'),
      ],
    });
    const ctx: PolicyContext = {
      now: request.requestedAt,
      mode: request.mode,
      riskApproved: true,
      attempts: 0,
      quantity: request.quantity,
    };
    const plan = planExecution(request, ctx, request.requestedAt);
    out.push(
      unwrap(
        planStep(
          createExecution(request, request.requestedAt),
          plan,
          planTasks(plan, request.quantity),
          'exec-planner',
          at(41),
        ),
      ),
    );
  }

  // 7) ORDER_RECEIVED.
  out.push(
    createExecution(
      mkRequest({
        id: 'EXR-0007',
        orderId: 'ORD-0007',
        seq: 7,
        symbol: 'META',
        side: 'BUY',
        quantity: 300,
        base: 44,
      }),
      at(44),
    ),
  );

  // 8) FAILED — risk validation blocks (riskApproved false → validation fails).
  {
    const request = mkRequest({
      id: 'EXR-0008',
      orderId: 'ORD-0008',
      seq: 8,
      symbol: 'JPM',
      side: 'SELL',
      quantity: 600,
      limitPrice: 205,
      base: 46,
      policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION'), policy('RISK_VALIDATION')],
    });
    const ctx: PolicyContext = {
      now: request.requestedAt,
      mode: request.mode,
      riskApproved: false,
      attempts: 0,
      quantity: request.quantity,
    };
    const plan = planExecution(request, ctx, request.requestedAt);
    const planned = unwrap(
      planStep(
        createExecution(request, request.requestedAt),
        plan,
        planTasks(plan, request.quantity),
        'exec-planner',
        at(47),
      ),
    );
    out.push(
      unwrap(
        validateStep(planned, validateExecution(request, plan, at(48)), 'exec-validator', at(48)),
      ),
    );
  }

  // 9) CANCELLED — cancelled while waiting.
  {
    const request = mkRequest({
      id: 'EXR-0009',
      orderId: 'ORD-0009',
      seq: 9,
      symbol: 'XOM',
      side: 'BUY',
      quantity: 900,
      limitPrice: 112,
      base: 50,
    });
    const queued = unwrap(queueStep(validated(request, true), 'exec-router', at(54)));
    out.push(unwrap(applyAction(queued, 'cancel', 'Dana Ops', at(55))));
  }

  // 10) Paused working execution (WAITING_FOR_VENUE + pause).
  {
    const request = mkRequest({
      id: 'EXR-0010',
      orderId: 'ORD-0010',
      seq: 10,
      symbol: 'BAC',
      side: 'BUY',
      quantity: 1200,
      limitPrice: 39.5,
      base: 20,
      sessionId: 'SES-AM',
    });
    const queued = unwrap(queueStep(validated(request, true), 'exec-router', at(24)));
    out.push(unwrap(applyAction(queued, 'pause', 'Dana Ops', at(28))));
  }

  return out;
}

export const EXECUTIONS: readonly Execution[] = buildExecutions();

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
