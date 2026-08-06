import { describe, it, expect } from 'vitest';
import { FEATURE_STORE_CAPABILITIES, featureKey } from '@platform/feature-store-sdk';
import { applyFeatureQuery } from '../src/modules/feature-store/domain/query';
import {
  toCatalogItemVm,
  toDetailVm,
  toSummaryVm,
} from '../src/modules/feature-store/domain/mappers';
import { FeatureStoreAdminService } from '../src/modules/feature-store/application/feature-store-service';
import {
  MockFeatureStoreRepository,
  FEATURE_STORE_SEED,
} from '../src/modules/feature-store/data/mock-repository';

const { features, families } = FEATURE_STORE_SEED;
const resid = features.find((f) => f.id === 'FS-RESID-RETURN')!;

describe('@platform/feature-store-sdk vocabulary is shared', () => {
  it('exposes 11 store capabilities and builds a canonical key', () => {
    expect(FEATURE_STORE_CAPABILITIES).toHaveLength(11);
    expect(featureKey('Equities', 'Momentum', 'Residual return')).toBe(
      'equities/momentum/residual-return',
    );
  });
});

describe('applyFeatureQuery (pure filter/sort/search)', () => {
  it('filters by namespace and status', () => {
    expect(
      applyFeatureQuery(features, { namespace: 'fx' }).every((f) => f.namespace === 'fx'),
    ).toBe(true);
    expect(
      applyFeatureQuery(features, { status: 'PROPOSED' }).every((f) => f.status === 'PROPOSED'),
    ).toBe(true);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = applyFeatureQuery(features, { search: 'carry' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('FS-CARRY');
  });

  it('sorts by name ascending by default', () => {
    const names = applyFeatureQuery(features, {}).map((f) => f.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('mappers (pure DTO → VM)', () => {
  it('maps a catalog item with lifecycle/quality/health/sync tones', () => {
    const vm = toCatalogItemVm(resid);
    expect(vm.status.tone).toBe('positive');
    expect(vm.quality.label).toBe('Pass');
    expect(vm.namespace).toBe('equities');
  });

  it('maps a detail with newest-first versions, deep-linked deps and lineage', () => {
    const vm = toDetailVm(resid);
    expect(vm.key).toBe(featureKey(resid.namespace, resid.family, resid.name));
    expect(vm.versions[0]!.version).toBe('2.1.0');
    expect(vm.versions[0]!.current).toBe(true);
    expect(vm.dependencies.find((d) => d.kind === 'DATASET')?.href).toBe('/datasets/ds-equity-eod');
    expect(vm.lineage.nodes.find((n) => n.kind === 'DATASET')?.href).toBe(
      '/datasets/ds-equity-eod',
    );
    expect(vm.schema.length).toBeGreaterThan(0);
  });

  it('summarizes by lifecycle status and flags drift/warnings', () => {
    const summary = toSummaryVm(features, families);
    expect(summary.totalFeatures).toBe(features.length);
    expect(summary.approved).toBeGreaterThan(0);
    expect(summary.proposed).toBe(1);
    expect(summary.syncDrift).toBeGreaterThan(0);
    expect(summary.byStatus.every((b) => b.count > 0)).toBe(true);
  });
});

describe('FeatureStoreAdminService (over the mock repository)', () => {
  const service = new FeatureStoreAdminService(new MockFeatureStoreRepository());

  it('lists features and a single feature detail', async () => {
    expect(await service.listFeatures()).toHaveLength(features.length);
    expect(await service.getFeature('FS-CARRY')).not.toBeNull();
    expect(await service.getFeature('nope')).toBeNull();
  });

  it('exposes families and a summary', async () => {
    expect((await service.listFamilies()).length).toBe(families.length);
    expect((await service.getSummary()).totalFeatures).toBe(features.length);
  });
});
