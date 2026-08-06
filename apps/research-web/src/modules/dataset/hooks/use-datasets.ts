'use client';

import { useQuery } from '@tanstack/react-query';
import { datasetService } from '../application/container';
import type { DatasetQuery } from '../domain/query';

/** Server-state hooks for datasets. They call the application service only —
 *  never a repository or transport directly. */
export function useDatasets(query: DatasetQuery) {
  return useQuery({
    queryKey: ['datasets', 'list', query],
    queryFn: () => datasetService.listDatasets(query),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: ['datasets', 'detail', id],
    queryFn: () => datasetService.getDataset(id),
    enabled: id.length > 0,
  });
}
