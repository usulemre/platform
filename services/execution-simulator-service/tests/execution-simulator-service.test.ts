import { describe, it, expect } from 'vitest';
import {
  EXECUTION_CAPABILITIES,
  SIMULATION_STAGES,
  ORDER_STATES,
  METRIC_CATALOG,
  sessionKey,
  canCancel,
  canReplay,
  canRetry,
  describeStage,
  isTerminalOrder,
  nextStage,
} from '@platform/execution-sdk';
import { resolveByKey, searchSessions } from '../src/domain/discovery';
import { isCancellable, isReplayable, isRetryable, overallApproval } from '../src/domain/lifecycle';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  executionQueue,
  history,
  reviewQueue,
} from '../src/domain/derivations';
import { createExecutionSimulatorService } from '../src/composition';
import { SESSIONS, COMPARISONS } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const equityMn = SESSIONS.find((s) => s.id === 'SIM-EQUITY-MN')!;
const creditCarry = SESSIONS.find((s) => s.id === 'SIM-CREDIT-CARRY')!;
const cancelled = SESSIONS.find((s) => s.id === 'SIM-VOL-CANCELLED')!;

describe('@platform/execution-sdk vocabulary', () => {
  it('orders 9 lifecycle stages and 9 order states', () => {
    expect(SIMULATION_STAGES).toHaveLength(9);
    expect(SIMULATION_STAGES[0]).toBe('DRAFT');
    expect(SIMULATION_STAGES[8]).toBe('ARCHIVED');
    expect(ORDER_STATES).toHaveLength(9);
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('APPROVED').gate).toBe(true);
    expect(isTerminalOrder('FILLED')).toBe(true);
    expect(isTerminalOrder('SUBMITTED')).toBe(false);
  });

  it('exposes capabilities, a metric catalog and run-control predicates', () => {
    expect(EXECUTION_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
    expect(sessionKey('Equities', 'Market Neutral', 'Equity MN')).toBe(
      'equities/market-neutral/equity-mn',
    );
    expect(canCancel('RUNNING')).toBe(true);
    expect(canRetry('CANCELLED')).toBe(true);
    expect(canReplay('COMPLETED')).toBe(true);
    expect(canReplay('RUNNING')).toBe(false);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      searchSessions(SESSIONS, { namespace: 'credit' }).every((s) => s.namespace === 'credit'),
    ).toBe(true);
    expect(searchSessions(SESSIONS, { stage: 'RUNNING' })).toHaveLength(1);
  });

  it('resolves a session by its canonical key', () => {
    const key = sessionKey(equityMn.namespace, equityMn.family, equityMn.name);
    expect(resolveByKey(SESSIONS, key)?.id).toBe('SIM-EQUITY-MN');
    expect(resolveByKey(SESSIONS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates run controls by run state', () => {
    expect(isCancellable(creditCarry)).toBe(true);
    expect(isRetryable(cancelled)).toBe(true);
    expect(isReplayable(equityMn)).toBe(true);
    expect(isCancellable(equityMn)).toBe(false);
  });

  it('derives overall approval and the queues', () => {
    expect(overallApproval(equityMn)).toBe('APPROVED');
    expect(executionQueue(SESSIONS).some((s) => s.id === 'SIM-CREDIT-CARRY')).toBe(true);
    expect(executionQueue(SESSIONS).length).toBe(2);
    expect(reviewQueue(SESSIONS).some((s) => s.id === 'SIM-MULTI-ASSET')).toBe(true);
    expect(approvalQueue(SESSIONS).some((s) => s.id === 'SIM-MULTI-ASSET')).toBe(true);
    expect(history(SESSIONS).length).toBe(2);
    expect(currentVersion(equityMn)?.version).toBe('2.0.0');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const assembled = assembleComparison(COMPARISONS[0]!, SESSIONS);
    expect(assembled.rows).toHaveLength(2);
    expect(assembled.rows[0]!.values.fill_rate).toBe('95.5%');
    expect(assembled.rows.find((r) => r.sessionId === 'SIM-MULTI-ASSET')?.values.fill_rate).toBe(
      '82.6%',
    );
  });
});

describe('ExecutionSimulatorService (over in-memory ports)', () => {
  const service = createExecutionSimulatorService();

  it('lists the registry and one session', async () => {
    expect(await service.listSessions()).toHaveLength(SESSIONS.length);
    expect(await service.getSession('SIM-MULTI-ASSET')).not.toBeNull();
    expect(await service.getSession('nope')).toBeNull();
  });

  it('summarizes by stage, run state, templates and families', async () => {
    const summary = await service.getSummary();
    expect(summary.totalSessions).toBe(SESSIONS.length);
    expect(summary.running).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.families).toBe(5);
    expect(summary.templates).toBe(3);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('assembles a comparison and exposes history + the metric catalog', async () => {
    expect(service.metricCatalog().length).toBe(METRIC_CATALOG.length);
    expect((await service.getComparison('SCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
    expect((await service.history()).length).toBe(2);
  });

  it('applies run controls only when permitted; false otherwise', async () => {
    expect(await service.controlRun('SIM-CREDIT-CARRY', 'pause', AT)).toBe(true);
    expect(await service.controlRun('SIM-CREDIT-CARRY', 'retry', AT)).toBe(false);
    expect(await service.controlRun('SIM-VOL-CANCELLED', 'retry', AT)).toBe(true);
    expect(await service.controlRun('nope', 'cancel', AT)).toBe(false);
  });

  it('replays only completed sessions; records review/approval requests', async () => {
    expect(await service.requestReplay('SIM-EQUITY-MN', AT)).toBe(true);
    expect(await service.requestReplay('SIM-CREDIT-CARRY', AT)).toBe(false);
    expect(await service.requestReview('SIM-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestApproval('SIM-MULTI-ASSET', AT)).toBe(true);
    expect(await service.requestRun('nope', AT)).toBe(false);
  });

  it('reflects validation status decided elsewhere', async () => {
    expect(await service.isValidated('SIM-EQUITY-MN')).toBe(true);
    expect(await service.isValidated('SIM-FX-MOM')).toBe(false);
  });
});
