import { describe, it, expect } from 'vitest';
import { applyDatasetQuery } from '../src/modules/dataset/domain/query';
import { toDetailVm, toListItemVm } from '../src/modules/dataset/domain/mappers';
import { DatasetService } from '../src/modules/dataset/application/dataset-service';
import { DATASET_SEED, MockDatasetRepository } from '../src/modules/dataset/data/mock-repository';

describe('applyDatasetQuery (pure filter/sort/search)', () => {
  it('filters by status and asset class', () => {
    const certified = applyDatasetQuery(DATASET_SEED, { status: 'CERTIFIED' });
    expect(certified.every((d) => d.status === 'CERTIFIED')).toBe(true);
    const fx = applyDatasetQuery(DATASET_SEED, { assetClass: 'FX' });
    expect(fx.every((d) => d.assetClass === 'FX')).toBe(true);
  });

  it('searches across name, vendor and tags', () => {
    const results = applyDatasetQuery(DATASET_SEED, { search: 'credit' });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((d) => `${d.name} ${d.tags.join(' ')}`.toLowerCase().includes('credit')),
    ).toBe(true);
  });

  it('sorts by name ascending deterministically', () => {
    const sorted = applyDatasetQuery(DATASET_SEED, { sortBy: 'name', sortDir: 'asc' });
    const names = sorted.map((d) => d.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (DTO → view model)', () => {
  it('maps status and validation tones', () => {
    const certified = DATASET_SEED.find((d) => d.status === 'CERTIFIED');
    expect(certified).toBeDefined();
    const vm = toListItemVm(certified!);
    expect(vm.status.tone).toBe('positive');
    expect(vm.updatedLabel).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('builds detail metadata rows and validation issues', () => {
    const quarantined = DATASET_SEED.find((d) => d.status === 'QUARANTINED');
    expect(quarantined).toBeDefined();
    const vm = toDetailVm(quarantined!);
    expect(vm.status.tone).toBe('danger');
    expect(vm.validation.tone).toBe('danger');
    expect(vm.validation.issueCount).toBeGreaterThan(0);
    expect(vm.metadata.some((row) => row.label === 'Knowledge time')).toBe(true);
  });
});

describe('DatasetService (application layer over mock repository)', () => {
  const service = new DatasetService(new MockDatasetRepository());

  it('lists datasets as view models', async () => {
    const items = await service.listDatasets({});
    expect(items.length).toBe(DATASET_SEED.length);
    expect(items[0]).toHaveProperty('updatedLabel');
  });

  it('returns a detail view model by id and null for unknown', async () => {
    const detail = await service.getDataset('ds-equity-eod');
    expect(detail?.name).toBe('US Equity Prices (EOD)');
    expect(await service.getDataset('does-not-exist')).toBeNull();
  });
});
