'use client';

import { useMemo } from 'react';
import { useExperiments } from '../hooks/use-experiments';
import { useExperimentQueryStore } from '../hooks/use-experiment-query-store';
import type { ExperimentQuery } from '../domain/query';
import { ExperimentToolbar } from './experiment-toolbar';
import { ExperimentTable } from './experiment-table';
import { ExperimentEmptyState } from './experiment-empty-state';
import { ExperimentLoadingState } from './experiment-loading-state';
import { ExperimentErrorState } from './experiment-error-state';

/** Experiment list container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function ExperimentsView() {
  const search = useExperimentQueryStore((state) => state.search);
  const status = useExperimentQueryStore((state) => state.status);
  const outcome = useExperimentQueryStore((state) => state.outcome);
  const sortBy = useExperimentQueryStore((state) => state.sortBy);
  const sortDir = useExperimentQueryStore((state) => state.sortDir);

  const query = useMemo<ExperimentQuery>(
    () => ({ search, status, outcome, sortBy, sortDir }),
    [search, status, outcome, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useExperiments(query);

  return (
    <div className="space-y-4">
      <ExperimentToolbar />
      {isLoading ? (
        <ExperimentLoadingState />
      ) : isError ? (
        <ExperimentErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <ExperimentEmptyState />
      ) : (
        <ExperimentTable experiments={data} />
      )}
    </div>
  );
}
