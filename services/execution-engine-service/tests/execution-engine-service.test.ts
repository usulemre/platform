import { describe, it, expect } from 'vitest';
import {
  EXECUTION_STATUSES,
  EXECUTION_TRANSITIONS,
  POLICY_CATALOG,
  VENUES,
  canApplyAction,
  canTransition,
  happyPathNext,
  isTerminalStatus,
  permittedActions,
  venueForMode,
  type ExecutionPolicy,
  type ExecutionRequest,
} from '@platform/execution-engine-sdk';
import {
  evaluatePolicy,
  evaluatePolicies,
  policiesAllow,
  type PolicyContext,
} from '../src/domain/policy-evaluators';
import { planExecution, planTasks } from '../src/domain/planner';
import { validateExecution } from '../src/domain/validation';
import {
  createExecution,
  transitionExecution,
  queueStep,
  validateStep,
  planStep,
} from '../src/domain/lifecycle';
import { executeAll } from '../src/domain/executors';
import { applyExecutionSearch } from '../src/domain/search';
import { computeExecutionMetrics } from '../src/domain/metrics';
import { computeHealth } from '../src/domain/health';
import { replayExecution } from '../src/domain/replay';
import { EXECUTIONS } from '../src/infrastructure/in-memory/seed';
import { createExecutionEngineService } from '../src/composition';

const AT = '2026-08-04T14:30:00.000Z';

function policy(
  type: ExecutionPolicy['type'],
  params: Record<string, number> = {},
  enabled = true,
): ExecutionPolicy {
  return { type, enabled, params };
}

function req(overrides: Partial<ExecutionRequest> = {}): ExecutionRequest {
  return {
    id: 'EXR-T',
    orderId: 'ORD-T',
    clientOrderId: 'OMS-T',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 100,
    orderType: 'LIMIT',
    limitPrice: 100,
    mode: 'SIMULATED',
    priority: 5,
    policies: [policy('IMMEDIATE'), policy('VENUE_SELECTION'), policy('RISK_VALIDATION')],
    requestedBy: 'tester',
    requestedAt: AT,
    metadata: {
      source: 'test',
      orderId: 'ORD-T',
      clientOrderId: 'OMS-T',
      tags: ['t'],
      entries: [],
    },
    ...overrides,
  };
}

const CTX: PolicyContext = {
  now: AT,
  mode: 'SIMULATED',
  riskApproved: true,
  attempts: 0,
  quantity: 100,
};

/* --------------------------------- unit --------------------------------- */

describe('execution lifecycle state machine (@platform/execution-engine-sdk)', () => {
  it('defines 9 statuses and legal transitions', () => {
    expect(EXECUTION_STATUSES).toHaveLength(9);
    expect(EXECUTION_STATUSES[0]).toBe('ORDER_RECEIVED');
    expect(canTransition('ORDER_RECEIVED', 'EXECUTION_PLANNED')).toBe(true);
    expect(canTransition('ORDER_RECEIVED', 'COMPLETED')).toBe(false);
    expect(canTransition('EXECUTING', 'COMPLETED')).toBe(true);
    expect(canTransition('FAILED', 'WAITING_FOR_VENUE')).toBe(true); // retry
    expect(EXECUTION_TRANSITIONS.COMPLETED).toHaveLength(0);
    expect(happyPathNext('WAITING_FOR_VENUE')).toBe('EXECUTING');
    expect(isTerminalStatus('COMPLETED')).toBe(true);
  });

  it('gates actions by status and pause', () => {
    expect(permittedActions('EXECUTING', false).sort()).toEqual(['cancel', 'pause', 'replay']);
    expect(permittedActions('EXECUTING', true).sort()).toEqual(['cancel', 'replay', 'resume']);
    expect(permittedActions('FAILED', false).sort()).toEqual(['replay', 'retry']);
    expect(canApplyAction('COMPLETED', false, 'cancel')).toBe(false);
    expect(canApplyAction('COMPLETED', false, 'replay')).toBe(true);
  });

  it('exposes 10 policies and 3 venues', () => {
    expect(POLICY_CATALOG).toHaveLength(10);
    expect(VENUES).toHaveLength(3);
    expect(venueForMode('LIVE').id).toBe('live-trading-gateway');
  });
});

describe('policy framework (real evaluators)', () => {
  it('blocks on risk when not approved and on out-of-window', () => {
    expect(evaluatePolicy(policy('RISK_VALIDATION'), { ...CTX, riskApproved: false }).allow).toBe(
      false,
    );
    expect(
      evaluatePolicy(policy('TIME_WINDOW', { startMinute: 600, endMinute: 660 }), {
        ...CTX,
        now: '2026-08-04T20:00:00.000Z',
      }).allow,
    ).toBe(false);
    expect(evaluatePolicy(policy('IMMEDIATE'), CTX).allow).toBe(true);
    const evals = evaluatePolicies([policy('IMMEDIATE'), policy('RISK_VALIDATION')], {
      ...CTX,
      riskApproved: false,
    });
    expect(policiesAllow(evals)).toBe(false);
  });
});

describe('planner (deterministic)', () => {
  it('slices under a partial policy and selects the venue', () => {
    const plan = planExecution(
      req({
        quantity: 100,
        policies: [policy('PARTIAL', { sliceCount: 4 }), policy('VENUE_SELECTION')],
      }),
      CTX,
      AT,
    );
    expect(plan.strategy).toBe('SLICED');
    expect(plan.sliceCount).toBe(4);
    expect(plan.venue).toBe('execution-simulator');
    const tasks = planTasks(plan, 100);
    expect(tasks).toHaveLength(4);
    expect(tasks.reduce((sum, t) => sum + t.quantity, 0)).toBeCloseTo(100, 6);
  });

  it('sets a release time under a scheduled policy', () => {
    const plan = planExecution(
      req({ policies: [policy('SCHEDULED', { delayMinutes: 30 }), policy('VENUE_SELECTION')] }),
      CTX,
      AT,
    );
    expect(plan.strategy).toBe('SCHEDULED');
    expect(plan.releaseAt).toBe('2026-08-04T15:00:00.000Z');
  });
});

describe('lifecycle application (real, immutable)', () => {
  it('refuses an illegal transition', () => {
    const execution = createExecution(req(), AT);
    expect(
      transitionExecution(execution, {
        to: 'COMPLETED',
        type: 'COMPLETED',
        actor: 'x',
        at: AT,
        message: 'no',
      }).ok,
    ).toBe(false);
  });

  it('plans, validates, queues and executes to completion with slice bookkeeping', () => {
    const request = req({
      quantity: 100,
      policies: [
        policy('PARTIAL', { sliceCount: 2 }),
        policy('VENUE_SELECTION'),
        policy('RISK_VALIDATION'),
      ],
    });
    const plan = planExecution(request, CTX, AT);
    let execution = expectOk(
      planStep(createExecution(request, AT), plan, planTasks(plan, 100), 'p', AT),
    );
    execution = expectOk(validateStep(execution, validateExecution(request, plan, AT), 'v', AT));
    expect(execution.status).toBe('EXECUTION_VALIDATED');
    execution = expectOk(queueStep(execution, 'r', AT));
    execution = expectOk(executeAll(execution, 187.5, AT));
    expect(execution.status).toBe('COMPLETED');
    expect(execution.result.executedQuantity).toBe(100);
    expect(execution.result.slices.length).toBe(2);
    expect(execution.result.averagePrice).toBeCloseTo(187.5, 9);
  });

  it('fails validation when risk is not approved', () => {
    const request = req({ policies: [policy('IMMEDIATE'), policy('RISK_VALIDATION')] });
    const plan = planExecution(request, { ...CTX, riskApproved: false }, AT);
    const planned = expectOk(
      planStep(createExecution(request, AT), plan, planTasks(plan, 100), 'p', AT),
    );
    const result = validateStep(planned, validateExecution(request, plan, AT), 'v', AT);
    expect(result.ok && result.execution.status).toBe('FAILED');
  });
});

describe('replay, search, metrics, health (pure)', () => {
  it('every seed execution replays consistently', () => {
    for (const execution of EXECUTIONS) {
      const result = replayExecution(execution);
      expect(result.reconstructedStatus).toBe(execution.status);
      expect(result.consistent).toBe(true);
    }
  });

  it('scopes, aggregates and health-checks deterministically', () => {
    expect(applyExecutionSearch(EXECUTIONS, { status: 'COMPLETED' })).toHaveLength(1);
    expect(applyExecutionSearch(EXECUTIONS, { scope: 'QUEUE' }).length).toBeGreaterThan(0);
    const metrics = computeExecutionMetrics(EXECUTIONS);
    expect(metrics.total).toBe(EXECUTIONS.length);
    expect(metrics.completed).toBe(1);
    expect(metrics.byStatus.reduce((sum, s) => sum + s.count, 0)).toBe(EXECUTIONS.length);
    const health = computeHealth(EXECUTIONS, AT);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBe(4);
  });
});

/* ------------------------------ integration ------------------------------ */

describe('ExecutionEngineService (integration over in-memory ports)', () => {
  it('submits an approved order, advances and completes', async () => {
    const service = createExecutionEngineService();
    const execution = await service.submitExecutionRequest(
      req({
        id: 'EXR-INT-1',
        quantity: 100,
        policies: [
          policy('PARTIAL', { sliceCount: 2 }),
          policy('VENUE_SELECTION'),
          policy('RISK_VALIDATION'),
        ],
      }),
      AT,
      true,
    );
    expect(execution.status).toBe('EXECUTION_VALIDATED');
    expect((await service.advance('EXE-INT-1', 100, 'x', AT)).ok).toBe(true); // → WAITING_FOR_VENUE
    expect((await service.advance('EXE-INT-1', 187.5, 'x', AT)).ok).toBe(true); // slice 1 → PARTIALLY_EXECUTED
    const done = await service.advance('EXE-INT-1', 187.5, 'x', AT); // slice 2 → COMPLETED
    expect(done.ok && done.execution.status).toBe('COMPLETED');
  });

  it('previews a plan without persisting and rejects on risk block', async () => {
    const service = createExecutionEngineService();
    const preview = service.previewPlan(
      req({ policies: [policy('PARTIAL', { sliceCount: 3 }), policy('RISK_VALIDATION')] }),
      false,
      AT,
    );
    expect(preview.plan.sliceCount).toBe(3);
    expect(preview.validation.status).toBe('FAILED'); // risk blocked
    const blocked = await service.submitExecutionRequest(
      req({ id: 'EXR-INT-2', policies: [policy('RISK_VALIDATION')] }),
      AT,
      false,
    );
    expect(blocked.status).toBe('FAILED');
  });

  it('applies actions only when permitted and serves views', async () => {
    const service = createExecutionEngineService();
    expect(
      (await service.applyAction('EXR-0004'.replace('EXR', 'EXE'), 'cancel', 'Dana', AT)).ok,
    ).toBe(true); // WAITING → CANCELLED
    expect((await service.applyAction('EXE-0001', 'cancel', 'Dana', AT)).ok).toBe(false); // COMPLETED
    const retry = await service.applyAction('EXE-0008', 'retry', 'Dana', AT); // FAILED → WAITING_FOR_VENUE
    expect(retry.ok && retry.execution.status).toBe('WAITING_FOR_VENUE');
    expect((await service.completedExecutions()).every((e) => e.status === 'COMPLETED')).toBe(true);
    expect((await service.replay('EXE-0001'))?.consistent).toBe(true);
    expect(service.listPolicies()).toHaveLength(10);
    expect((await service.listSessions()).length).toBe(2);
    expect((await service.sessionSummary('SES-AM'))?.total).toBeGreaterThan(0);
  });
});

function expectOk(result: {
  ok: boolean;
  execution?: unknown;
  reason?: string;
}): import('@platform/execution-engine-sdk').Execution {
  if (!result.ok) throw new Error(result.reason);
  return result.execution as import('@platform/execution-engine-sdk').Execution;
}
