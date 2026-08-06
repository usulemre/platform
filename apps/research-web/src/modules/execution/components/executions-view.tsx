'use client';

import { useMemo } from 'react';
import { useExecutionRequests } from '../hooks/use-executions';
import { useExecutionQueryStore } from '../hooks/use-execution-query-store';
import type { ExecutionQuery } from '../domain/query';
import { ExecutionToolbar } from './execution-toolbar';
import { ExecutionQueue } from './execution-queue';
import { ExecutionEmptyState } from './execution-empty-state';
import { ExecutionLoadingState } from './execution-loading-state';
import { ExecutionErrorState } from './execution-error-state';

/** Execution queue container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function ExecutionsView() {
  const search = useExecutionQueryStore((state) => state.search);
  const status = useExecutionQueryStore((state) => state.status);
  const mode = useExecutionQueryStore((state) => state.mode);
  const sortBy = useExecutionQueryStore((state) => state.sortBy);
  const sortDir = useExecutionQueryStore((state) => state.sortDir);

  const query = useMemo<ExecutionQuery>(
    () => ({ search, status, mode, sortBy, sortDir }),
    [search, status, mode, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useExecutionRequests(query);

  return (
    <div className="space-y-4">
      <ExecutionToolbar />
      {isLoading ? (
        <ExecutionLoadingState />
      ) : isError ? (
        <ExecutionErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <ExecutionEmptyState />
      ) : (
        <ExecutionQueue requests={data} />
      )}
    </div>
  );
}
