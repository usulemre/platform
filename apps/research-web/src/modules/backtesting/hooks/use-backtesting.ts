'use client';

import { useQuery } from '@tanstack/react-query';
import { backtestingAdminService } from '../application/container';
import type { BacktestQuery } from '../domain/query';

/** Server-state hooks for the Backtesting Engine UI. They call the application
 *  service only — never a repository, the service tier, a broker, a simulation
 *  runner, or persistence. */
export function useBacktestingSummary() {
  return useQuery({
    queryKey: ['backtesting', 'summary'],
    queryFn: () => backtestingAdminService.getSummary(),
  });
}

export function useBacktests(query: BacktestQuery) {
  return useQuery({
    queryKey: ['backtesting', 'backtests', query],
    queryFn: () => backtestingAdminService.listBacktests(query),
  });
}

export function useBacktest(id: string) {
  return useQuery({
    queryKey: ['backtesting', 'backtest', id],
    queryFn: () => backtestingAdminService.getBacktest(id),
    enabled: id.length > 0,
  });
}

export function useBacktestFamilies() {
  return useQuery({
    queryKey: ['backtesting', 'families'],
    queryFn: () => backtestingAdminService.listFamilies(),
  });
}

export function useExecutionQueue() {
  return useQuery({
    queryKey: ['backtesting', 'execution-queue'],
    queryFn: () => backtestingAdminService.getExecutionQueue(),
  });
}

export function useApprovalQueue() {
  return useQuery({
    queryKey: ['backtesting', 'approval-queue'],
    queryFn: () => backtestingAdminService.getApprovalQueue(),
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ['backtesting', 'comparisons'],
    queryFn: () => backtestingAdminService.listComparisons(),
  });
}

export function useComparison(id: string) {
  return useQuery({
    queryKey: ['backtesting', 'comparison', id],
    queryFn: () => backtestingAdminService.getComparison(id),
    enabled: id.length > 0,
  });
}
