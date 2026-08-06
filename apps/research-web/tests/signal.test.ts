import { describe, it, expect } from 'vitest';
import { applySignalQuery } from '../src/modules/signal/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/signal/domain/mappers';
import { SignalService } from '../src/modules/signal/application/signal-service';
import { SIGNAL_SEED, MockSignalRepository } from '../src/modules/signal/data/mock-repository';

describe('applySignalQuery (pure filter/sort/search)', () => {
  it('filters by status and asset class', () => {
    const approved = applySignalQuery(SIGNAL_SEED, { status: 'APPROVED' });
    expect(approved.every((s) => s.status === 'APPROVED')).toBe(true);
    const fx = applySignalQuery(SIGNAL_SEED, { assetClass: 'FX' });
    expect(fx.every((s) => s.assetClass === 'FX')).toBe(true);
  });

  it('searches across name, category and tags', () => {
    const results = applySignalQuery(SIGNAL_SEED, { search: 'reversal' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applySignalQuery(SIGNAL_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((s) => s.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps execution eligibility (advisory; never eligible unless governed)', () => {
    const paper = SIGNAL_SEED.find((s) => s.executionEligibility === 'PAPER_ONLY');
    expect(paper).toBeDefined();
    const vm = toListItemVm(paper!);
    expect(vm.eligibility.label).toContain('Paper');
    expect(vm.eligibility.tone).toBe('info');
  });

  it('maps quality ratings to tones and links dependencies/traceability', () => {
    const approved = SIGNAL_SEED.find((s) => s.status === 'APPROVED');
    expect(approved).toBeDefined();
    const vm = toDetailVm(approved!);
    expect(vm.quality.length).toBeGreaterThan(0);
    expect(vm.dependsOnFeatures.every((ref) => ref.href?.startsWith('/features/'))).toBe(true);
    expect(vm.experimentRefs.every((ref) => ref.href?.startsWith('/experiments/'))).toBe(true);
    expect(vm.strategyRefs.every((ref) => ref.href?.startsWith('/strategies/'))).toBe(true);
    expect(vm.registry.rows.some((row) => row.label === 'Execution eligibility')).toBe(true);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(SIGNAL_SEED);
    expect(summary.total).toBe(SIGNAL_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      SIGNAL_SEED.length,
    );
  });
});

describe('SignalService (application layer over mock repository)', () => {
  const service = new SignalService(new MockSignalRepository());

  it('lists signals as view models', async () => {
    const items = await service.listSignals({});
    expect(items.length).toBe(SIGNAL_SEED.length);
    expect(items[0]).toHaveProperty('eligibility');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getSignal('sig-reversal');
    expect(detail?.name).toBe('Reversal signal');
    expect(await service.getSignal('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(SIGNAL_SEED.length);
  });
});
