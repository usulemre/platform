'use client';

import { useQuery } from '@tanstack/react-query';
import { experimentService } from '../application/container';
import type { ExperimentQuery } from '../domain/query';

/** Server-state hooks for experiments. They call the application service only —
 *  never a repository or transport directly. */
export function useExperiments(query: ExperimentQuery) {
  return useQuery({
    queryKey: ['experiments', 'list', query],
    queryFn: () => experimentService.listExperiments(query),
  });
}

export function useExperiment(id: string) {
  return useQuery({
    queryKey: ['experiments', 'detail', id],
    queryFn: () => experimentService.getExperiment(id),
    enabled: id.length > 0,
  });
}

export function useExperimentSummary() {
  return useQuery({
    queryKey: ['experiments', 'summary'],
    queryFn: () => experimentService.getSummary(),
  });
}
