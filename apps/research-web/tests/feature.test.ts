import { describe, it, expect } from 'vitest';
import { applyFeatureQuery } from '../src/modules/feature/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/feature/domain/mappers';
import { FeatureService } from '../src/modules/feature/application/feature-service';
import { FEATURE_SEED, MockFeatureRepository } from '../src/modules/feature/data/mock-repository';

describe('applyFeatureQuery (pure filter/sort/search)', () => {
  it('filters by status and category', () => {
    const approved = applyFeatureQuery(FEATURE_SEED, { status: 'APPROVED' });
    expect(approved.every((f) => f.status === 'APPROVED')).toBe(true);
    const carry = applyFeatureQuery(FEATURE_SEED, { category: 'CARRY' });
    expect(carry.every((f) => f.category === 'CARRY')).toBe(true);
  });

  it('searches across name, category and tags', () => {
    const results = applyFeatureQuery(FEATURE_SEED, { search: 'beta' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyFeatureQuery(FEATURE_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((f) => f.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps approved status and leakage-harness clearance', () => {
    const approved = FEATURE_SEED.find((f) => f.status === 'APPROVED');
    expect(approved).toBeDefined();
    const vm = toListItemVm(approved!);
    expect(vm.status.tone).toBe('positive');
    expect(vm.approval.tone).toBe('positive');
  });

  it('exposes registry marketplace availability only when approved', () => {
    const rejected = FEATURE_SEED.find((f) => f.status === 'REJECTED');
    expect(rejected).toBeDefined();
    const vm = toDetailVm(rejected!);
    expect(vm.registry.marketplaceAvailable).toBe(false);
    expect(vm.validation.leakageHarnessTone).toBe('danger');
    expect(vm.dependsOn.every((ref) => ref.href?.startsWith('/features/'))).toBe(true);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(FEATURE_SEED);
    expect(summary.total).toBe(FEATURE_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      FEATURE_SEED.length,
    );
  });
});

describe('FeatureService (application layer over mock repository)', () => {
  const service = new FeatureService(new MockFeatureRepository());

  it('lists features as view models', async () => {
    const items = await service.listFeatures({});
    expect(items.length).toBe(FEATURE_SEED.length);
    expect(items[0]).toHaveProperty('approval');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getFeature('feat-market-beta');
    expect(detail?.name).toBe('Market beta');
    expect(await service.getFeature('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(FEATURE_SEED.length);
  });
});
