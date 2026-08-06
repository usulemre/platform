import { describe, it, expect } from 'vitest';
import { isTerminalStatus } from '@platform/execution-engine-sdk';
import { applyExecutionQuery } from '../src/modules/execution/domain/query';
import { computeMetrics, computeHealth, replay } from '../src/modules/execution/domain/derive';
import { toRowVm, toDetailVm, toSummaryVm } from '../src/modules/execution/domain/mappers';
import { previewPlan } from '../src/modules/execution/data/planner';
import { EXECUTIONS } from '../src/modules/execution/data/seed';

describe('execution module — seed integrity', () => {
  it('seeds 10 executions spanning the lifecycle', () => {
    expect(EXECUTIONS).toHaveLength(10);
    expect(EXECUTIONS.filter((e) => e.status === 'COMPLETED')).toHaveLength(1);
    expect(EXECUTIONS.filter((e) => e.status === 'FAILED')).toHaveLength(1);
    expect(EXECUTIONS.some((e) => e.paused)).toBe(true);
  });

  it('every seed execution replays consistently', () => {
    for (const execution of EXECUTIONS) {
      const result = replay(execution);
      expect(result.reconstructedStatus).toBe(execution.status);
      expect(result.consistent).toBe(true);
    }
  });

  it('the completed execution has correct slice bookkeeping', () => {
    const completed = EXECUTIONS.find((e) => e.id === 'EXE-0001')!;
    expect(completed.result.executedQuantity).toBe(1000);
    expect(completed.result.remainingQuantity).toBe(0);
    expect(completed.result.averagePrice).toBeGreaterThan(0);
  });
});

describe('execution module — query, derivations & planner', () => {
  it('scopes the queue and history', () => {
    expect(
      applyExecutionQuery(EXECUTIONS, { scope: 'COMPLETED' }).every(
        (e) => e.status === 'COMPLETED',
      ),
    ).toBe(true);
    expect(applyExecutionQuery(EXECUTIONS, { scope: 'QUEUE' }).length).toBeGreaterThan(0);
    expect(applyExecutionQuery(EXECUTIONS, { text: 'aapl' }).length).toBeGreaterThan(0);
  });

  it('computes metrics and health deterministically', () => {
    const metrics = computeMetrics(EXECUTIONS);
    expect(metrics.total).toBe(EXECUTIONS.length);
    expect(metrics.byStatus.reduce((sum, s) => sum + s.count, 0)).toBe(EXECUTIONS.length);
    const health = computeHealth(EXECUTIONS);
    expect(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).toContain(health.status);
    expect(health.checks.length).toBe(4);
  });

  it('previews a plan deterministically and blocks on risk', () => {
    const sliced = previewPlan({
      symbol: 'AAPL',
      quantity: 100,
      mode: 'SIMULATED',
      sliceCount: 4,
      scheduledDelayMinutes: null,
      riskValidation: true,
      riskApproved: true,
      priority: 5,
    });
    expect(sliced.plan.strategy).toBe('SLICED');
    expect(sliced.plan.sliceCount).toBe(4);
    expect(sliced.validationPassed).toBe(true);
    const blocked = previewPlan({
      symbol: 'AAPL',
      quantity: 100,
      mode: 'LIVE',
      sliceCount: 1,
      scheduledDelayMinutes: null,
      riskValidation: true,
      riskApproved: false,
      priority: 5,
    });
    expect(blocked.validationPassed).toBe(false);
    expect(blocked.plan.venue).toBe('live-trading-gateway');
  });
});

describe('execution module — mappers', () => {
  it('maps rows, detail and summary to view models', () => {
    const completed = EXECUTIONS.find((e) => e.id === 'EXE-0001')!;
    expect(toRowVm(completed).status.label).toBe('Completed');
    const detail = toDetailVm(completed);
    expect(detail.slices.length).toBe(2);
    expect(detail.actions.length).toBe(5);
    expect(detail.plan?.strategy).toBe('SLICED');
    const summary = toSummaryVm(EXECUTIONS);
    expect(summary.total).toBe(EXECUTIONS.length);
    expect(summary.completed).toBe(1);
    expect(isTerminalStatus('COMPLETED')).toBe(true);
  });
});
