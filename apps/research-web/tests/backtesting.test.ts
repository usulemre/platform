import { describe, it, expect } from 'vitest';
import {
  BACKTESTING_CAPABILITIES,
  BACKTEST_STAGES,
  METRIC_CATALOG,
  backtestKey,
} from '@platform/backtesting-sdk';
import { applyBacktestQuery } from '../src/modules/backtesting/domain/query';
import {
  toComparisonVm,
  toDetailVm,
  toListItemVm,
  toSummaryVm,
} from '../src/modules/backtesting/domain/mappers';
import { BacktestingAdminService } from '../src/modules/backtesting/application/backtesting-service';
import {
  MockBacktestingRepository,
  BACKTESTING_SEED,
} from '../src/modules/backtesting/data/mock-repository';

const { backtests, families, comparisons } = BACKTESTING_SEED;
const reversal = backtests.find((b) => b.id === 'BT-REVERSAL')!;

describe('@platform/backtesting-sdk vocabulary is shared', () => {
  it('exposes 9 lifecycle stages, 12 capabilities and a metric catalog', () => {
    expect(BACKTEST_STAGES).toHaveLength(9);
    expect(BACKTEST_STAGES[0]).toBe('DRAFT');
    expect(BACKTEST_STAGES[8]).toBe('ARCHIVED');
    expect(BACKTESTING_CAPABILITIES).toHaveLength(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
  });
});

describe('applyBacktestQuery (pure filter/sort/search)', () => {
  it('filters by namespace, stage and scenario', () => {
    expect(
      applyBacktestQuery(backtests, { namespace: 'fx' }).every((b) => b.namespace === 'fx'),
    ).toBe(true);
    expect(
      applyBacktestQuery(backtests, { stage: 'RUNNING' }).every((b) => b.stage === 'RUNNING'),
    ).toBe(true);
    expect(applyBacktestQuery(backtests, { scenario: 'WALK_FORWARD' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applyBacktestQuery(backtests, { search: 'walk-forward' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('BT-CARRY-WF');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with stage/run/validation tones', () => {
    const vm = toListItemVm(reversal);
    expect(vm.stage.tone).toBe('positive');
    expect(vm.run.label).toBe('Completed');
    expect(vm.scenario).toBe('Historical');
  });

  it('maps a detail with 9 stage steps, run controls, deep-linked deps and lineage', () => {
    const vm = toDetailVm(reversal);
    expect(vm.key).toBe(backtestKey(reversal.namespace, reversal.family, reversal.name));
    expect(vm.stages).toHaveLength(9);
    expect(vm.progress.percent).toBeGreaterThan(0);
    expect(vm.runControls.find((c) => c.control === 'retry')?.enabled).toBe(false);
    expect(vm.dependencies.find((d) => d.kind === 'DATASET')?.href).toBe('/datasets/ds-equity-eod');
    expect(vm.lineage.nodes.find((n) => n.kind === 'STRATEGY')?.href).toBe(
      '/strategies/str-reversal-ls',
    );
    expect(vm.metrics.length).toBeGreaterThan(0);
    expect(vm.links.some((l) => l.href === '/experiments/exp-momentum-reversal')).toBe(true);
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const vm = toComparisonVm(comparisons[0]!, backtests);
    expect(vm.rows).toHaveLength(2);
    const row = vm.rows.find((r) => r.backtestId === 'BT-REVERSAL')!;
    expect(row.cells.find((c) => c.key === 'sharpe')?.value).toBe('1.32');
  });

  it('summarizes by lifecycle stage and run state', () => {
    const summary = toSummaryVm(backtests, families, comparisons.length);
    expect(summary.totalBacktests).toBe(backtests.length);
    expect(summary.running).toBe(1);
    expect(summary.comparisons).toBe(1);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('BacktestingAdminService (over the mock repository)', () => {
  const service = new BacktestingAdminService(new MockBacktestingRepository());

  it('lists backtests and a single detail', async () => {
    expect(await service.listBacktests()).toHaveLength(backtests.length);
    expect(await service.getBacktest('BT-CARRY-WF')).not.toBeNull();
    expect(await service.getBacktest('nope')).toBeNull();
  });

  it('exposes families, queues and comparisons', async () => {
    expect((await service.listFamilies()).length).toBe(families.length);
    expect((await service.getExecutionQueue()).some((i) => i.id === 'BT-RATES-ROLL')).toBe(true);
    expect((await service.listComparisons()).length).toBe(comparisons.length);
    expect((await service.getComparison('CMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalBacktests).toBe(backtests.length);
  });
});
