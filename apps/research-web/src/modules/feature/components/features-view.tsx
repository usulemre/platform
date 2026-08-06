'use client';

import { useMemo } from 'react';
import { useFeatures } from '../hooks/use-features';
import { useFeatureQueryStore } from '../hooks/use-feature-query-store';
import type { FeatureQuery } from '../domain/query';
import { FeatureToolbar } from './feature-toolbar';
import { FeatureCatalog } from './feature-catalog';
import { FeatureEmptyState } from './feature-empty-state';
import { FeatureLoadingState } from './feature-loading-state';
import { FeatureErrorState } from './feature-error-state';

/** Feature catalog container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function FeaturesView() {
  const search = useFeatureQueryStore((state) => state.search);
  const status = useFeatureQueryStore((state) => state.status);
  const category = useFeatureQueryStore((state) => state.category);
  const sortBy = useFeatureQueryStore((state) => state.sortBy);
  const sortDir = useFeatureQueryStore((state) => state.sortDir);

  const query = useMemo<FeatureQuery>(
    () => ({ search, status, category, sortBy, sortDir }),
    [search, status, category, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useFeatures(query);

  return (
    <div className="space-y-4">
      <FeatureToolbar />
      {isLoading ? (
        <FeatureLoadingState />
      ) : isError ? (
        <FeatureErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <FeatureEmptyState />
      ) : (
        <FeatureCatalog features={data} />
      )}
    </div>
  );
}
