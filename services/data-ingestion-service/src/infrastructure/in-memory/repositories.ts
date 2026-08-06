/**
 * In-memory read-model adapters. Development/test only — no persistence, no
 * external calls. They implement the query ports over the synthetic seed.
 */
import type { JobRecord, PipelineEvent, PipelineRecord, SourceRef } from '@platform/data-sdk';
import type { EventQueryPort, JobQueryPort, PipelineQueryPort, SourceQueryPort } from '../ports';
import { EVENTS, JOBS, PIPELINES, SOURCES } from './seed';

export class InMemoryPipelineQuery implements PipelineQueryPort {
  constructor(private readonly data: readonly PipelineRecord[] = PIPELINES) {}
  async list(): Promise<readonly PipelineRecord[]> {
    return this.data;
  }
  async getById(id: string): Promise<PipelineRecord | null> {
    return this.data.find((pipeline) => pipeline.id === id) ?? null;
  }
}

export class InMemoryJobQuery implements JobQueryPort {
  constructor(private readonly data: readonly JobRecord[] = JOBS) {}
  async list(): Promise<readonly JobRecord[]> {
    return this.data;
  }
  async getById(id: string): Promise<JobRecord | null> {
    return this.data.find((job) => job.id === id) ?? null;
  }
}

export class InMemoryEventQuery implements EventQueryPort {
  constructor(private readonly data: readonly PipelineEvent[] = EVENTS) {}
  async listForPipeline(pipelineId: string): Promise<readonly PipelineEvent[]> {
    return this.data.filter((event) => event.pipelineId === pipelineId);
  }
}

export class InMemorySourceQuery implements SourceQueryPort {
  constructor(private readonly data: readonly SourceRef[] = SOURCES) {}
  async list(): Promise<readonly SourceRef[]> {
    return this.data;
  }
}
