/**
 * Pure Feature Store discovery/search. Deterministic, no IO. Backs the Feature
 * Discovery, Feature Search and Feature Catalog capabilities — no ranking model,
 * no statistics.
 */
import {
  featureKey,
  type FeatureLifecycleStatus,
  type RegisteredFeature,
} from '@platform/feature-store-sdk';

export interface FeatureSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly status?: FeatureLifecycleStatus | 'ALL';
  readonly tag?: string;
}

export function searchFeatures(
  features: readonly RegisteredFeature[],
  query: FeatureSearch,
): RegisteredFeature[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const status = query.status ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return features
    .filter((feature) => {
      if (namespace !== 'ALL' && feature.namespace !== namespace) return false;
      if (family !== 'ALL' && feature.family !== family) return false;
      if (status !== 'ALL' && feature.status !== status) return false;
      if (tag && !feature.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${feature.name} ${feature.namespace} ${feature.family} ${feature.owner.owner} ${feature.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a feature by its canonical `namespace/family/name` key. */
export function resolveByKey(
  features: readonly RegisteredFeature[],
  key: string,
): RegisteredFeature | null {
  const needle = key.trim().toLowerCase();
  return (
    features.find(
      (feature) => featureKey(feature.namespace, feature.family, feature.name) === needle,
    ) ?? null
  );
}
