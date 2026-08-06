'use client';

import { useMemo } from 'react';
import { usePortfolios } from '../hooks/use-portfolios';
import { usePortfolioQueryStore } from '../hooks/use-portfolio-query-store';
import type { PortfolioQuery } from '../domain/query';
import { PortfolioToolbar } from './portfolio-toolbar';
import { PortfolioCatalog } from './portfolio-catalog';
import { PortfolioEmptyState } from './portfolio-empty-state';
import { PortfolioLoadingState } from './portfolio-loading-state';
import { PortfolioErrorState } from './portfolio-error-state';

/** Portfolio catalog container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function PortfoliosView() {
  const search = usePortfolioQueryStore((state) => state.search);
  const status = usePortfolioQueryStore((state) => state.status);
  const assetClass = usePortfolioQueryStore((state) => state.assetClass);
  const sortBy = usePortfolioQueryStore((state) => state.sortBy);
  const sortDir = usePortfolioQueryStore((state) => state.sortDir);

  const query = useMemo<PortfolioQuery>(
    () => ({ search, status, assetClass, sortBy, sortDir }),
    [search, status, assetClass, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = usePortfolios(query);

  return (
    <div className="space-y-4">
      <PortfolioToolbar />
      {isLoading ? (
        <PortfolioLoadingState />
      ) : isError ? (
        <PortfolioErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <PortfolioEmptyState />
      ) : (
        <PortfolioCatalog portfolios={data} />
      )}
    </div>
  );
}
