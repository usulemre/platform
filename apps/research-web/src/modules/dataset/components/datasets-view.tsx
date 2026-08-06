'use client';

import { useMemo } from 'react';
import { useDatasets } from '../hooks/use-datasets';
import { useDatasetQueryStore } from '../hooks/use-dataset-query-store';
import type { DatasetQuery } from '../domain/query';
import { DatasetToolbar } from './dataset-toolbar';
import { DatasetTable } from './dataset-table';
import { DatasetEmptyState } from './dataset-empty-state';
import { DatasetLoadingState } from './dataset-loading-state';
import { DatasetErrorState } from './dataset-error-state';

/**
 * Dataset list container. Derives the query from UI state and calls the
 * application service via the query hook; selects the appropriate presentational
 * state. No business logic beyond orchestration.
 */
export function DatasetsView() {
  const search = useDatasetQueryStore((state) => state.search);
  const status = useDatasetQueryStore((state) => state.status);
  const assetClass = useDatasetQueryStore((state) => state.assetClass);
  const sortBy = useDatasetQueryStore((state) => state.sortBy);
  const sortDir = useDatasetQueryStore((state) => state.sortDir);

  const query = useMemo<DatasetQuery>(
    () => ({ search, status, assetClass, sortBy, sortDir }),
    [search, status, assetClass, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useDatasets(query);

  return (
    <div className="space-y-4">
      <DatasetToolbar />
      {isLoading ? (
        <DatasetLoadingState />
      ) : isError ? (
        <DatasetErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <DatasetEmptyState />
      ) : (
        <DatasetTable datasets={data} />
      )}
    </div>
  );
}
