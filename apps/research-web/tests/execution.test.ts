import { describe, it, expect } from 'vitest';
import { applyExecutionQuery } from '../src/modules/execution/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/execution/domain/mappers';
import { ExecutionService } from '../src/modules/execution/application/execution-service';
import {
  EXECUTION_SEED,
  MockExecutionRepository,
} from '../src/modules/execution/data/mock-repository';

describe('applyExecutionQuery (pure filter/sort/search)', () => {
  it('filters by status and mode', () => {
    const authorized = applyExecutionQuery(EXECUTION_SEED, { status: 'AUTHORIZED' });
    expect(authorized.every((r) => r.status === 'AUTHORIZED')).toBe(true);
    const paper = applyExecutionQuery(EXECUTION_SEED, { mode: 'PAPER' });
    expect(paper.every((r) => r.mode === 'PAPER')).toBe(true);
  });

  it('searches across title, portfolio and tags', () => {
    const results = applyExecutionQuery(EXECUTION_SEED, { search: 'core' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by title ascending deterministically', () => {
    const sorted = applyExecutionQuery(EXECUTION_SEED, { sortBy: 'title', sortDir: 'asc' });
    const titles = sorted.map((r) => r.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps mode and authorization tones', () => {
    const authorized = EXECUTION_SEED.find((r) => r.status === 'AUTHORIZED');
    expect(authorized).toBeDefined();
    const vm = toDetailVm(authorized!);
    expect(vm.mode.label).toContain('Paper');
    expect(vm.authorization.stateLabel).toBe('Issued');
    expect(vm.authorization.tone).toBe('positive');
  });

  it('links risk approval and portfolio/strategy/signal references', () => {
    const request = EXECUTION_SEED.find((r) => r.signalRef !== undefined);
    expect(request).toBeDefined();
    const vm = toDetailVm(request!);
    expect(vm.riskApproval.href).toBe(`/risk/${request!.riskApproval.assessmentId}`);
    expect(vm.references.some((ref) => ref.href?.startsWith('/portfolios/'))).toBe(true);
    expect(vm.references.some((ref) => ref.href?.startsWith('/strategies/'))).toBe(true);
    expect(vm.references.some((ref) => ref.href?.startsWith('/signals/'))).toBe(true);
  });

  it('lists only the portfolio reference when strategy/signal are absent', () => {
    const minimal = EXECUTION_SEED.find(
      (r) => r.strategyRef === undefined && r.signalRef === undefined,
    );
    expect(minimal).toBeDefined();
    expect(toDetailVm(minimal!).references.length).toBe(1);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(EXECUTION_SEED);
    expect(summary.total).toBe(EXECUTION_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      EXECUTION_SEED.length,
    );
  });
});

describe('ExecutionService (application layer over mock repository)', () => {
  const service = new ExecutionService(new MockExecutionRepository());

  it('lists requests as view models', async () => {
    const items = await service.listRequests({});
    expect(items.length).toBe(EXECUTION_SEED.length);
    expect(items[0]).toHaveProperty('riskVerdict');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getRequest('exec-core-paper');
    expect(detail?.title).toContain('Core multi-strategy');
    expect(await service.getRequest('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(EXECUTION_SEED.length);
  });
});
