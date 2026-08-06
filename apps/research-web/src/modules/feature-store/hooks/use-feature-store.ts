'use client';

import { useQuery } from '@tanstack/react-query';
import { featureStoreAdminService } from '../application/container';
import type { FeatureQuery } from '../domain/query';

/** Server-state hooks for the Feature Store UI. They call the application service
 *  only — never a repository, the service tier, a broker, or persistence. */
export function useFeatureStoreSummary() {
  return useQuery({
    queryKey: ['feature-store', 'summary'],
    queryFn: () => featureStoreAdminService.getSummary(),
  });
}

export function useFeatures(query: FeatureQuery) {
  return useQuery({
    queryKey: ['feature-store', 'features', query],
    queryFn: () => featureStoreAdminService.listFeatures(query),
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ['feature-store', 'feature', id],
    queryFn: () => featureStoreAdminService.getFeature(id),
    enabled: id.length > 0,
  });
}

export function useFeatureFamilies() {
  return useQuery({
    queryKey: ['feature-store', 'families'],
    queryFn: () => featureStoreAdminService.listFamilies(),
  });
}
