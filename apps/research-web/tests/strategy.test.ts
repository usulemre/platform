import { describe, it, expect } from 'vitest';
import { applyStrategyQuery } from '../src/modules/strategy/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/strategy/domain/mappers';
import { StrategyService } from '../src/modules/strategy/application/strategy-service';
import {
  STRATEGY_SEED,
  MockStrategyRepository,
} from '../src/modules/strategy/data/mock-repository';

describe('applyStrategyQuery (pure filter/sort/search)', () => {
  it('filters by status and asset class', () => {
    const approved = applyStrategyQuery(STRATEGY_SEED, { status: 'APPROVED' });
    expect(approved.every((s) => s.status === 'APPROVED')).toBe(true);
    const fx = applyStrategyQuery(STRATEGY_SEED, { assetClass: 'FX' });
    expect(fx.every((s) => s.assetClass === 'FX')).toBe(true);
  });

  it('searches across name, category and tags', () => {
    const results = applyStrategyQuery(STRATEGY_SEED, { search: 'carry' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyStrategyQuery(STRATEGY_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps portfolio eligibility (advisory until approved)', () => {
    const approved = STRATEGY_SEED.find((s) => s.portfolioEligibility === 'ELIGIBLE');
    expect(approved).toBeDefined();
    const vm = toListItemVm(approved!);
    expect(vm.eligibility.label).toContain('Portfolio eligible');
    expect(vm.eligibility.tone).toBe('positive');
  });

  it('links signal composition, experiment traceability and portfolio references', () => {
    const approved = STRATEGY_SEED.find((s) => s.status === 'APPROVED');
    expect(approved).toBeDefined();
    const vm = toDetailVm(approved!);
    expect(vm.composition.length).toBeGreaterThan(0);
    expect(vm.composition.every((entry) => entry.href.startsWith('/signals/'))).toBe(true);
    expect(vm.experimentRefs.every((ref) => ref.href?.startsWith('/experiments/'))).toBe(true);
    expect(vm.portfolioRefs.every((ref) => ref.href?.startsWith('/portfolios/'))).toBe(true);
    expect(vm.risk.length).toBeGreaterThan(0);
    expect(vm.timeline.filter((step) => step.state === 'current').length).toBeLessThanOrEqual(1);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(STRATEGY_SEED);
    expect(summary.total).toBe(STRATEGY_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      STRATEGY_SEED.length,
    );
  });
});

describe('StrategyService (application layer over mock repository)', () => {
  const service = new StrategyService(new MockStrategyRepository());

  it('lists strategies as view models', async () => {
    const items = await service.listStrategies({});
    expect(items.length).toBe(STRATEGY_SEED.length);
    expect(items[0]).toHaveProperty('eligibility');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getStrategy('str-reversal-ls');
    expect(detail?.name).toBe('Reversal long/short');
    expect(await service.getStrategy('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(STRATEGY_SEED.length);
  });
});
