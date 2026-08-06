/**
 * Data-ingestion admin repository boundary — the ONLY data abstraction the
 * application service depends on. Concrete adapters implement it; the UI never
 * sees a concrete data source and never touches the service, a broker, or storage.
 */
import type { JobRecord, PipelineEvent, PipelineRecord, SourceRef } from '@platform/data-sdk';
import type { PipelineQuery } from '../domain/query';

export type { PipelineQuery };

export interface DataIngestionRepository {
  listPipelines(query: PipelineQuery): Promise<readonly PipelineRecord[]>;
  getPipeline(id: string): Promise<PipelineRecord | null>;
  listJobs(): Promise<readonly JobRecord[]>;
  listEvents(pipelineId: string): Promise<readonly PipelineEvent[]>;
  listSources(): Promise<readonly SourceRef[]>;
}
