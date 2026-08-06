import { describe, it, expect } from 'vitest';
import {
  EXECUTION_CAPABILITIES,
  SIMULATION_STAGES,
  ORDER_STATES,
  METRIC_CATALOG,
  sessionKey,
} from '@platform/execution-sdk';
import { applySessionQuery } from '../src/modules/execution-simulator/domain/query';
import {
  toComparisonVm,
  toDetailVm,
  toListItemVm,
  toSummaryVm,
} from '../src/modules/execution-simulator/domain/mappers';
import { ExecutionSimulatorAdminService } from '../src/modules/execution-simulator/application/execution-simulator-service';
import {
  MockExecutionSimulatorRepository,
  EXECUTION_SIMULATOR_SEED,
} from '../src/modules/execution-simulator/data/mock-repository';

const { sessions, families, templates, comparisons } = EXECUTION_SIMULATOR_SEED;
const equityMn = sessions.find((s) => s.id === 'SIM-EQUITY-MN')!;

describe('@platform/execution-sdk vocabulary is shared', () => {
  it('exposes 9 lifecycle stages, 9 order states, capabilities and a metric catalog', () => {
    expect(SIMULATION_STAGES).toHaveLength(9);
    expect(SIMULATION_STAGES[0]).toBe('DRAFT');
    expect(SIMULATION_STAGES[8]).toBe('ARCHIVED');
    expect(ORDER_STATES).toHaveLength(9);
    expect(EXECUTION_CAPABILITIES.length).toBeGreaterThanOrEqual(12);
    expect(METRIC_CATALOG.length).toBeGreaterThan(0);
  });
});

describe('applySessionQuery (pure filter/sort/search)', () => {
  it('filters by namespace and stage', () => {
    expect(
      applySessionQuery(sessions, { namespace: 'credit' }).every((s) => s.namespace === 'credit'),
    ).toBe(true);
    expect(applySessionQuery(sessions, { stage: 'RUNNING' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applySessionQuery(sessions, { search: 'multi-asset' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('SIM-MULTI-ASSET');
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a list item with stage/run/validation tones', () => {
    const vm = toListItemVm(equityMn);
    expect(vm.stage.tone).toBe('positive');
    expect(vm.run.label).toBe('Completed');
    expect(vm.validation.label).toBe('Passed');
  });

  it('maps a detail with 9 stage steps, run controls, orders, fills, deep-linked deps and lineage', () => {
    const vm = toDetailVm(equityMn);
    expect(vm.key).toBe(sessionKey(equityMn.namespace, equityMn.family, equityMn.name));
    expect(vm.stages).toHaveLength(9);
    expect(vm.runControls.find((c) => c.control === 'replay')?.enabled).toBe(true);
    expect(vm.runControls.find((c) => c.control === 'cancel')?.enabled).toBe(false);
    expect(vm.orders.length).toBeGreaterThan(0);
    expect(vm.fills.length).toBeGreaterThan(0);
    expect(vm.positions.length).toBeGreaterThan(0);
    expect(vm.dependencies.find((d) => d.kind === 'PORTFOLIO')?.href).toBe(
      '/portfolio-construction/pf-equity-mn',
    );
    expect(vm.lineage.nodes.find((n) => n.kind === 'BACKTEST')?.href).toBe(
      '/backtesting/bt-reversal',
    );
    expect(vm.links.some((l) => l.href === '/portfolio-construction/pf-equity-mn')).toBe(true);
  });

  it('assembles a comparison by pulling supplied metric values (never computed)', () => {
    const vm = toComparisonVm(comparisons[0]!, sessions);
    expect(vm.rows).toHaveLength(2);
    const row = vm.rows.find((r) => r.sessionId === 'SIM-EQUITY-MN')!;
    expect(row.cells.find((c) => c.key === 'fill_rate')?.value).toBe('95.5%');
  });

  it('summarizes by lifecycle stage and run state', () => {
    const summary = toSummaryVm(sessions, families.length, templates.length, comparisons.length);
    expect(summary.totalSessions).toBe(sessions.length);
    expect(summary.running).toBe(1);
    expect(summary.awaitingApproval).toBe(1);
    expect(summary.templates).toBe(templates.length);
    expect(summary.byStage.every((b) => b.count > 0)).toBe(true);
  });
});

describe('ExecutionSimulatorAdminService (over the mock repository)', () => {
  const service = new ExecutionSimulatorAdminService(new MockExecutionSimulatorRepository());

  it('lists sessions and a single detail', async () => {
    expect(await service.listSessions()).toHaveLength(sessions.length);
    expect(await service.getSession('SIM-MULTI-ASSET')).not.toBeNull();
    expect(await service.getSession('nope')).toBeNull();
  });

  it('exposes families, templates, queues, history, reports and comparisons', async () => {
    expect((await service.listFamilies()).length).toBe(families.length);
    expect((await service.listTemplates()).length).toBe(templates.length);
    expect((await service.getExecutionQueue()).some((i) => i.id === 'SIM-CREDIT-CARRY')).toBe(true);
    expect((await service.getApprovalQueue()).some((i) => i.id === 'SIM-MULTI-ASSET')).toBe(true);
    expect((await service.getHistory()).length).toBe(2);
    expect((await service.getReports()).length).toBeGreaterThan(0);
    expect((await service.getComparison('SCMP-1'))?.rows.length).toBe(2);
    expect(await service.getComparison('nope')).toBeNull();
  });

  it('summarizes', async () => {
    expect((await service.getSummary()).totalSessions).toBe(sessions.length);
  });
});
