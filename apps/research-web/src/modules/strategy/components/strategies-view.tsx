'use client';

import { useMemo } from 'react';
import { useStrategies } from '../hooks/use-strategies';
import { useStrategyQueryStore } from '../hooks/use-strategy-query-store';
import type { StrategyQuery } from '../domain/query';
import { StrategyToolbar } from './strategy-toolbar';
import { StrategyCatalog } from './strategy-catalog';
import { StrategyEmptyState } from './strategy-empty-state';
import { StrategyLoadingState } from './strategy-loading-state';
import { StrategyErrorState } from './strategy-error-state';

/** Strategy catalog container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function StrategiesView() {
  const search = useStrategyQueryStore((state) => state.search);
  const status = useStrategyQueryStore((state) => state.status);
  const assetClass = useStrategyQueryStore((state) => state.assetClass);
  const sortBy = useStrategyQueryStore((state) => state.sortBy);
  const sortDir = useStrategyQueryStore((state) => state.sortDir);

  const query = useMemo<StrategyQuery>(
    () => ({ search, status, assetClass, sortBy, sortDir }),
    [search, status, assetClass, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useStrategies(query);

  return (
    <div className="space-y-4">
      <StrategyToolbar />
      {isLoading ? (
        <StrategyLoadingState />
      ) : isError ? (
        <StrategyErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <StrategyEmptyState />
      ) : (
        <StrategyCatalog strategies={data} />
      )}
    </div>
  );
}
