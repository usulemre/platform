/**
 * Real adapter over the governed API gateway (data-ingestion service). NOT wired
 * in v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never a broker, never storage, never a provider.
 */
import type { ApiClient } from '@platform/api-client';
import type { JobRecord, PipelineEvent, PipelineRecord, SourceRef } from '@platform/data-sdk';
import type { PipelineQuery } from '../domain/query';
import type { DataIngestionRepository } from './repository';

function buildQueryString(query: PipelineQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.dataType && query.dataType !== 'ALL') params.set('dataType', query.dataType);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiDataIngestionRepository implements DataIngestionRepository {
  constructor(private readonly api: ApiClient) {}

  listPipelines(query: PipelineQuery): Promise<readonly PipelineRecord[]> {
    return this.api.request<readonly PipelineRecord[]>(
      `/ingestion/pipelines${buildQueryString(query)}`,
    );
  }

  async getPipeline(id: string): Promise<PipelineRecord | null> {
    try {
      return await this.api.request<PipelineRecord>(`/ingestion/pipelines/${id}`);
    } catch {
      return null;
    }
  }

  listJobs(): Promise<readonly JobRecord[]> {
    return this.api.request<readonly JobRecord[]>('/ingestion/jobs');
  }

  listEvents(pipelineId: string): Promise<readonly PipelineEvent[]> {
    return this.api.request<readonly PipelineEvent[]>(`/ingestion/pipelines/${pipelineId}/events`);
  }

  listSources(): Promise<readonly SourceRef[]> {
    return this.api.request<readonly SourceRef[]>('/ingestion/sources');
  }
}
