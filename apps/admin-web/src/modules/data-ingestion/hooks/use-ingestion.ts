'use client';

import { useQuery } from '@tanstack/react-query';
import { dataIngestionService } from '../application/container';
import type { PipelineQuery } from '../domain/query';

/** Server-state hooks for the ingestion admin UI. They call the application
 *  service only — never a repository, the service tier, a broker, or storage. */
export function usePipelines(query: PipelineQuery) {
  return useQuery({
    queryKey: ['ingestion', 'pipelines', query],
    queryFn: () => dataIngestionService.listPipelines(query),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['ingestion', 'pipeline', id],
    queryFn: () => dataIngestionService.getPipeline(id),
    enabled: id.length > 0,
  });
}

export function useIngestionSummary() {
  return useQuery({
    queryKey: ['ingestion', 'summary'],
    queryFn: () => dataIngestionService.getSummary(),
  });
}

export function useFailedJobs() {
  return useQuery({
    queryKey: ['ingestion', 'failed-jobs'],
    queryFn: () => dataIngestionService.getFailedJobs(),
  });
}

export function useRetryQueue() {
  return useQuery({
    queryKey: ['ingestion', 'retry-queue'],
    queryFn: () => dataIngestionService.getRetryQueue(),
  });
}

export function useDeadLetterJobs() {
  return useQuery({
    queryKey: ['ingestion', 'dead-letter'],
    queryFn: () => dataIngestionService.getDeadLetterJobs(),
  });
}

export function useDataSourceOverview() {
  return useQuery({
    queryKey: ['ingestion', 'sources'],
    queryFn: () => dataIngestionService.getDataSourceOverview(),
  });
}

export function useDataQualityOverview() {
  return useQuery({
    queryKey: ['ingestion', 'quality'],
    queryFn: () => dataIngestionService.getDataQualityOverview(),
  });
}
