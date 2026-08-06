'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioService } from '../application/container';
import type { PortfolioQuery } from '../domain/query';

/** Server-state hooks for portfolios. They call the application service only —
 *  never a repository or transport directly. */
export function usePortfolios(query: PortfolioQuery) {
  return useQuery({
    queryKey: ['portfolios', 'list', query],
    queryFn: () => portfolioService.listPortfolios(query),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolios', 'detail', id],
    queryFn: () => portfolioService.getPortfolio(id),
    enabled: id.length > 0,
  });
}

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolios', 'summary'],
    queryFn: () => portfolioService.getSummary(),
  });
}
