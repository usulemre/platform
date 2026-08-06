'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioConstructionAdminService } from '../application/container';
import type { PortfolioQuery } from '../domain/query';

/** Server-state hooks for the Portfolio Construction Engine UI. They call the
 *  application service only — never a repository, the service tier, a broker, an
 *  optimizer, or persistence. */
export function usePortfolioConstructionSummary() {
  return useQuery({
    queryKey: ['portfolio-construction', 'summary'],
    queryFn: () => portfolioConstructionAdminService.getSummary(),
  });
}

export function usePortfolios(query: PortfolioQuery) {
  return useQuery({
    queryKey: ['portfolio-construction', 'portfolios', query],
    queryFn: () => portfolioConstructionAdminService.listPortfolios(query),
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolio-construction', 'portfolio', id],
    queryFn: () => portfolioConstructionAdminService.getPortfolio(id),
    enabled: id.length > 0,
  });
}

export function usePortfolioFamilies() {
  return useQuery({
    queryKey: ['portfolio-construction', 'families'],
    queryFn: () => portfolioConstructionAdminService.listFamilies(),
  });
}

export function usePortfolioTemplates() {
  return useQuery({
    queryKey: ['portfolio-construction', 'templates'],
    queryFn: () => portfolioConstructionAdminService.listTemplates(),
  });
}

export function useOptimizationQueue() {
  return useQuery({
    queryKey: ['portfolio-construction', 'optimization-queue'],
    queryFn: () => portfolioConstructionAdminService.getOptimizationQueue(),
  });
}

export function useOptimizationRequests() {
  return useQuery({
    queryKey: ['portfolio-construction', 'optimization-requests'],
    queryFn: () => portfolioConstructionAdminService.getOptimizationRequests(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['portfolio-construction', 'approval-queue'],
    queryFn: () => portfolioConstructionAdminService.getApprovalQueue(),
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ['portfolio-construction', 'comparisons'],
    queryFn: () => portfolioConstructionAdminService.listComparisons(),
  });
}

export function useComparison(id: string) {
  return useQuery({
    queryKey: ['portfolio-construction', 'comparison', id],
    queryFn: () => portfolioConstructionAdminService.getComparison(id),
    enabled: id.length > 0,
  });
}
