'use client';

import { useQuery } from '@tanstack/react-query';
import { featureService } from '../application/container';
import type { FeatureQuery } from '../domain/query';

/** Server-state hooks for features. They call the application service only —
 *  never a repository or transport directly. */
export function useFeatures(query: FeatureQuery) {
  return useQuery({
    queryKey: ['features', 'list', query],
    queryFn: () => featureService.listFeatures(query),
  });
}

export function useFeature(id: string) {
  return useQuery({
    queryKey: ['features', 'detail', id],
    queryFn: () => featureService.getFeature(id),
    enabled: id.length > 0,
  });
}

export function useFeatureSummary() {
  return useQuery({
    queryKey: ['features', 'summary'],
    queryFn: () => featureService.getSummary(),
  });
}
