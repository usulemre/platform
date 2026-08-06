import { describe, it, expect } from 'vitest';
import { applyExperimentQuery } from '../src/modules/experiment/domain/query';
import { toDetailVm, toListItemVm, toSummaryVm } from '../src/modules/experiment/domain/mappers';
import { ExperimentService } from '../src/modules/experiment/application/experiment-service';
import {
  EXPERIMENT_SEED,
  MockExperimentRepository,
} from '../src/modules/experiment/data/mock-repository';

describe('applyExperimentQuery (pure filter/sort/search)', () => {
  it('filters by status and outcome', () => {
    const concluded = applyExperimentQuery(EXPERIMENT_SEED, { status: 'CONCLUDED' });
    expect(concluded.every((e) => e.status === 'CONCLUDED')).toBe(true);
    const refuted = applyExperimentQuery(EXPERIMENT_SEED, { outcome: 'REFUTED' });
    expect(refuted.every((e) => e.outcome === 'REFUTED')).toBe(true);
  });

  it('searches across title, question and tags', () => {
    const results = applyExperimentQuery(EXPERIMENT_SEED, { search: 'carry' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by title ascending deterministically', () => {
    const sorted = applyExperimentQuery(EXPERIMENT_SEED, { sortBy: 'title', sortDir: 'asc' });
    const titles = sorted.map((e) => e.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('treats REFUTED as first-class (info tone, not danger)', () => {
    const refuted = EXPERIMENT_SEED.find((e) => e.outcome === 'REFUTED');
    expect(refuted).toBeDefined();
    const vm = toListItemVm(refuted!);
    expect(vm.outcome.tone).toBe('info');
  });

  it('derives timeline states with a single current step', () => {
    const running = EXPERIMENT_SEED.find((e) => e.status === 'RUNNING');
    expect(running).toBeDefined();
    const vm = toDetailVm(running!);
    expect(vm.timeline.filter((step) => step.state === 'current').length).toBe(1);
    expect(vm.hypothesis.frozen).toBe(true);
    expect(vm.metadata.some((row) => row.label === 'Trial ledger')).toBe(true);
  });

  it('aggregates a status summary', () => {
    const summary = toSummaryVm(EXPERIMENT_SEED);
    expect(summary.total).toBe(EXPERIMENT_SEED.length);
    expect(summary.byStatus.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(
      EXPERIMENT_SEED.length,
    );
  });
});

describe('ExperimentService (application layer over mock repository)', () => {
  const service = new ExperimentService(new MockExperimentRepository());

  it('lists experiments as view models', async () => {
    const items = await service.listExperiments({});
    expect(items.length).toBe(EXPERIMENT_SEED.length);
    expect(items[0]).toHaveProperty('workflowLabel');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getExperiment('exp-momentum-reversal');
    expect(detail?.title).toContain('reversal');
    expect(await service.getExperiment('nope')).toBeNull();
  });

  it('computes a dashboard summary', async () => {
    const summary = await service.getSummary();
    expect(summary.total).toBe(EXPERIMENT_SEED.length);
  });
});
