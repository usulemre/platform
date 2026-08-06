/**
 * Feature query model + pure query application (search / filter / sort).
 * Data-layer logic, not UI logic. Deterministic — mirrors the service's pure
 * discovery/search so both tiers behave identically.
 */
import type { FeatureLifecycleStatus, RegisteredFeature } from '@platform/feature-store-sdk';

export type FeatureSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface FeatureQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly status?: FeatureLifecycleStatus | 'ALL';
  readonly tag?: string;
  readonly sortBy?: FeatureSortField;
  readonly sortDir?: SortDir;
}

export function applyFeatureQuery(
  data: readonly RegisteredFeature[],
  query: FeatureQuery,
): RegisteredFeature[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const status = query.status ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((feature) => {
    if (namespace !== 'ALL' && feature.namespace !== namespace) return false;
    if (status !== 'ALL' && feature.status !== status) return false;
    if (tag && !feature.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${feature.name} ${feature.namespace} ${feature.family} ${feature.owner.owner} ${feature.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
