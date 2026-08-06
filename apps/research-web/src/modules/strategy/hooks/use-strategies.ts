'use client';

import { useQuery } from '@tanstack/react-query';
import { strategyService } from '../application/container';
import type { StrategyQuery } from '../domain/query';

/** Server-state hooks for strategies. They call the application service only —
 *  never a repository or transport directly. */
export function useStrategies(query: StrategyQuery) {
  return useQuery({
    queryKey: ['strategies', 'list', query],
    queryFn: () => strategyService.listStrategies(query),
  });
}

export function useStrategy(id: string) {
  return useQuery({
    queryKey: ['strategies', 'detail', id],
    queryFn: () => strategyService.getStrategy(id),
    enabled: id.length > 0,
  });
}

export function useStrategySummary() {
  return useQuery({
    queryKey: ['strategies', 'summary'],
    queryFn: () => strategyService.getSummary(),
  });
}
