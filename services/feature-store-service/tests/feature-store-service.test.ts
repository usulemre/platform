import { describe, it, expect } from 'vitest';
import {
  FEATURE_STORE_CAPABILITIES,
  compareVersions,
  featureKey,
  isConsumable,
  latestVersion,
} from '@platform/feature-store-sdk';
import { resolveByKey, searchFeatures } from '../src/domain/discovery';
import {
  currentVersion,
  deriveHealth,
  isSyncHealthy,
  qualityGrade,
} from '../src/domain/derivations';
import { createFeatureStoreService } from '../src/composition';
import { FEATURES } from '../src/infrastructure/in-memory/seed';

const AT = '2026-08-03T00:00:00.000Z';
const resid = FEATURES.find((f) => f.id === 'FS-RESID-RETURN')!;

describe('@platform/feature-store-sdk vocabulary', () => {
  it('exposes 11 store capabilities', () => {
    expect(FEATURE_STORE_CAPABILITIES).toHaveLength(11);
  });

  it('builds a canonical feature key and compares versions', () => {
    expect(featureKey('Equities', 'Momentum', 'Residual Return')).toBe(
      'equities/momentum/residual-return',
    );
    expect(compareVersions('2.1.0', '2.0.0')).toBeGreaterThan(0);
    expect(latestVersion(['1.0.0', '2.1.0', '0.9.0'])).toBe('2.1.0');
    expect(isConsumable('APPROVED')).toBe(true);
    expect(isConsumable('DRAFT')).toBe(false);
  });
});

describe('discovery (pure filter/search)', () => {
  it('filters by namespace, family, status and tag', () => {
    expect(searchFeatures(FEATURES, { namespace: 'fx' }).every((f) => f.namespace === 'fx')).toBe(
      true,
    );
    expect(
      searchFeatures(FEATURES, { status: 'PROPOSED' }).every((f) => f.status === 'PROPOSED'),
    ).toBe(true);
    expect(searchFeatures(FEATURES, { tag: 'reversal' })).toHaveLength(1);
  });

  it('searches across name, namespace, family, owner and tags', () => {
    const result = searchFeatures(FEATURES, { search: 'carry' });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('FS-CARRY');
  });

  it('resolves a feature by its canonical key', () => {
    const key = featureKey(resid.namespace, resid.family, resid.name);
    expect(resolveByKey(FEATURES, key)?.id).toBe('FS-RESID-RETURN');
    expect(resolveByKey(FEATURES, 'nope/none/none')).toBeNull();
  });
});

describe('derivations (pure)', () => {
  it('grades quality by the worse of completeness/stability', () => {
    expect(qualityGrade(0.999, 0.996)).toBe('PASS');
    expect(qualityGrade(0.97, 0.98)).toBe('WARN');
    expect(qualityGrade(0.9, 0.8)).toBe('FAIL');
  });

  it('derives health from lifecycle and quality', () => {
    expect(deriveHealth('APPROVED', 'PASS')).toBe('HEALTHY');
    expect(deriveHealth('DEPRECATED', 'PASS')).toBe('STALE');
    expect(deriveHealth('APPROVED', 'FAIL')).toBe('DEGRADED');
    expect(deriveHealth('RETIRED', 'PASS')).toBe('UNKNOWN');
    expect(isSyncHealthy('SYNCED')).toBe(true);
  });

  it('selects the newest approved version as current', () => {
    expect(currentVersion(resid)?.version).toBe('2.1.0');
  });
});

describe('FeatureStoreService (over in-memory ports)', () => {
  const service = createFeatureStoreService();

  it('lists the catalog and one feature', async () => {
    expect(await service.listFeatures()).toHaveLength(FEATURES.length);
    expect(await service.getFeature('FS-CARRY')).not.toBeNull();
    expect(await service.getFeature('nope')).toBeNull();
  });

  it('summarizes by status, validation, quality and sync', async () => {
    const summary = await service.getSummary();
    expect(summary.totalFeatures).toBe(FEATURES.length);
    expect(summary.approved).toBeGreaterThan(0);
    expect(summary.proposed).toBe(1);
    expect(summary.awaitingValidation).toBeGreaterThan(0);
    expect(summary.syncDrift).toBeGreaterThan(0);
    expect(summary.families).toBeGreaterThan(0);
  });

  it('exposes families and discovery candidates', async () => {
    expect((await service.listFamilies()).length).toBeGreaterThan(0);
    expect((await service.listDiscoveryCandidates()).length).toBeGreaterThan(0);
  });

  it('requests a registry sync and a registration; false for unknown', async () => {
    expect(await service.requestSync('FS-RESID-RETURN', AT)).toBe(true);
    expect(await service.requestSync('nope', AT)).toBe(false);
    expect(await service.requestRegistration('FS-VOL-REGIME', AT)).toBe(true);
    expect(await service.requestRegistration('nope', AT)).toBe(false);
  });

  it('reports validation status decided elsewhere', async () => {
    expect(await service.isValidated('FS-RESID-RETURN')).toBe(true);
    expect(await service.isValidated('FS-VOL-REGIME')).toBe(false);
  });
});
