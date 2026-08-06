import { describe, it, expect } from 'vitest';
import {
  BACKTESTING_CAPABILITIES,
  BACKTEST_STAGES,
  METRIC_CATALOG,
  backtestKey,
  canCancel,
  canResume,
  canRetry,
  describeStage,
  nextStage,
} from '@platform/backtesting-sdk';
import { resolveByKey, searchBacktests } from '../ts/domain/discovery';
import { isCancellable, isRetryable, overallApproval } from '../ts/domain/lifecycle';
import {
  approvalQueue,
  assembleComparison,
  currentVersion,
  executionQueue,
} from '../ts/domain/derivations';
import { createBacktestingService } from '../ts/composition';
import { BACKTESTS, COMPARISONS } from '../ts/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const reversal = BACKTESTS.find((b) => b.id === 'BT-REVERSAL')!;
const rolling = BACKTESTS.find((b) => b.id === 'BT-RATES-ROLL')!;
const cancelled = BACKTESTS.find((b) => b.id === 'BT-VOL-CANCELLED')!;

describe('@platform/backtesting-sdk vocabulary', () => {
  it('orders 9 lifecycle stages draft → archived', () => {
    expect(BACKTEST_STAGES).toHaveLength(9);
    expect(BACKTEST_STAGES[0]).toBe('DRAFT');
    expect(BACKTEST_STAGES[8]).toBe('ARCHIVED');
    expect(nextStage('ARCHIVED')).toBeNull();
    expect(describeStage('APPROVED').gate).toBe(true);
  });

  it('exposes 12 capabilities, a metric catalog and a canonical key', () => {
    expect(BACKTESTING_CAPABILITIES).toHaveLength(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
    expect(backtestKey('Equities', 'Reversal', 'Reversal L/S')).toBe(
      'equities/reversal/reversal-l/s',
    );
  });

  it('exposes run-control predicates', () => {
    expect(canCancel('RUNNING')).toBe(true);
    expect(canRetry('CANCELLED')).toBe(true);
    expect(canResume('PAUSED')).toBe(true);
    expect(canCancel('COMPLETED')).toBe(false);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace, stage and scenario', () => {
    expect(searchBacktests(BACKTESTS, { namespace: 'fx' }).every((b) => b.namespace === 'fx')).toBe(
      true,
    );
    expect(
      searchBacktests(BACKTESTS, { stage: 'RUNNING' }).every((b) => b.stage === 'RUNNING'),
    ).toBe(true);
    expect(searchBacktests(BACKTESTS, { scenario: 'WALK_FORWARD' })).toHaveLength(1);
  });

  it('resolves a backtest by its canonical key', () => {
    const key = backtestKey(reversal.namespace, reversal.family, reversal.name);
    expect(resolveByKey(BACKTESTS, key)?.id).toBe('BT-REVERSAL');
    expect(resolveByKey(BACKTESTS, 'nope/none/none')).toBeNull();
  });
});

describe('lifecycle + derivations (pure)', () => {
  it('gates run controls by run state', () => {
    expect(isCancellable(rolling)).toBe(true);
    expect(isRetryable(cancelled)).toBe(true);
    expect(isCancellable(reversal)).toBe(false);
  });

  it('derives overall approval and the queues', () => {
    expect(overallApproval(reversal)).toBe('APPROVED');
    expect(executionQueue(BACKTESTS).some((b) => b.id === 'BT-RATES-ROLL')).toBe(true);
    expect(approvalQueue(BACKTESTS).length).toBe(0);
    expect(currentVersion(reversal)?.version).toBe('2.0.0');
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const assembled = assembleComparison(COMPARISONS[0]!, BACKTESTS);
    expect(assembled.rows).toHaveLength(2);
    expect(assembled.rows[0]!.values.sharpe).toBe('1.32');
    expect(assembled.rows.find((r) => r.backtestId === 'BT-CARRY-WF')?.values.sharpe).toBe('0.98');
  });
});

describe('BacktestingService (over in-memory ports)', () => {
  const service = createBacktestingService();

  it('lists the registry and one backtest', async () => {
    expect(await service.listBacktests()).toHaveLength(BACKTESTS.length);
    expect(await service.getBacktest('BT-CARRY-WF')).not.toBeNull();
    expect(await service.getBacktest('nope')).toBeNull();
  });

  it('summarizes by stage, run state, comparisons and families', async () => {
    const summary = await service.getSummary();
    expect(summary.totalBacktests).toBe(BACKTESTS.length);
    expect(summary.running).toBe(1);
    expect(summary.comparisons).toBe(1);
    expect(summary.families).toBe(5);
    expect(summary.byStage.length).toBeGreaterThan(0);
  });

  it('assembles a comparison and exposes the metric catalog', async () => {
    expect(service.metricCatalog().length).toBe(METRIC_CATALOG.length);
    expect((await service.getComparison('CMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('applies run controls only when permitted; false otherwise', async () => {
    expect(await service.controlRun('BT-RATES-ROLL', 'pause', AT)).toBe(true);
    expect(await service.controlRun('BT-RATES-ROLL', 'retry', AT)).toBe(false);
    expect(await service.controlRun('BT-VOL-CANCELLED', 'retry', AT)).toBe(true);
    expect(await service.controlRun('nope', 'cancel', AT)).toBe(false);
  });

  it('records run/review/approval requests; false for unknown', async () => {
    expect(await service.requestRun('BT-CREDIT-DRAFT', AT)).toBe(true);
    expect(await service.requestReview('BT-CARRY-WF', AT)).toBe(true);
    expect(await service.requestApproval('BT-CARRY-WF', AT)).toBe(true);
    expect(await service.requestRun('nope', AT)).toBe(false);
  });

  it('reflects validation status decided elsewhere', async () => {
    expect(await service.isValidated('BT-REVERSAL')).toBe(true);
    expect(await service.isValidated('BT-CREDIT-DRAFT')).toBe(false);
  });
});
