'use client';

import { useMemo } from 'react';
import { useSignals } from '../hooks/use-signals';
import { useSignalQueryStore } from '../hooks/use-signal-query-store';
import type { SignalQuery } from '../domain/query';
import { SignalToolbar } from './signal-toolbar';
import { SignalCatalog } from './signal-catalog';
import { SignalEmptyState } from './signal-empty-state';
import { SignalLoadingState } from './signal-loading-state';
import { SignalErrorState } from './signal-error-state';

/** Signal catalog container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function SignalsView() {
  const search = useSignalQueryStore((state) => state.search);
  const status = useSignalQueryStore((state) => state.status);
  const assetClass = useSignalQueryStore((state) => state.assetClass);
  const sortBy = useSignalQueryStore((state) => state.sortBy);
  const sortDir = useSignalQueryStore((state) => state.sortDir);

  const query = useMemo<SignalQuery>(
    () => ({ search, status, assetClass, sortBy, sortDir }),
    [search, status, assetClass, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useSignals(query);

  return (
    <div className="space-y-4">
      <SignalToolbar />
      {isLoading ? (
        <SignalLoadingState />
      ) : isError ? (
        <SignalErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <SignalEmptyState />
      ) : (
        <SignalCatalog signals={data} />
      )}
    </div>
  );
}
