/**
 * Data-ingestion admin application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No
 * infrastructure, no provider logic, no storage, no broker. Aggregation is pure.
 */
import { isRetryable } from '@platform/data-sdk';
import {
  toDetailVm,
  toEventVm,
  toJobVm,
  toListItemVm,
  toQualityOverviewVm,
  toSourceOverviewVm,
  toSummaryVm,
} from '../domain/mappers';
import type { PipelineQuery } from '../domain/query';
import type {
  DataQualityOverviewVm,
  DataSourceOverviewVm,
  EventVm,
  IngestionSummaryVm,
  JobVm,
  PipelineDetailVm,
  PipelineListItemVm,
} from '../domain/view-model';
import type { DataIngestionRepository } from '../data/repository';

export interface PipelineDetailBundle {
  readonly pipeline: PipelineDetailVm;
  readonly events: readonly EventVm[];
  readonly jobs: readonly JobVm[];
}

export class DataIngestionService {
  constructor(private readonly repository: DataIngestionRepository) {}

  async listPipelines(query: PipelineQuery = {}): Promise<PipelineListItemVm[]> {
    const pipelines = await this.repository.listPipelines(query);
    return pipelines.map(toListItemVm);
  }

  async getPipeline(id: string): Promise<PipelineDetailBundle | null> {
    const pipeline = await this.repository.getPipeline(id);
    if (!pipeline) return null;
    const [events, jobs] = await Promise.all([
      this.repository.listEvents(id),
      this.repository.listJobs(),
    ]);
    return {
      pipeline: toDetailVm(pipeline),
      events: events.map(toEventVm),
      jobs: jobs.filter((job) => job.pipelineId === id).map(toJobVm),
    };
  }

  async getSummary(): Promise<IngestionSummaryVm> {
    const [pipelines, jobs] = await Promise.all([
      this.repository.listPipelines({}),
      this.repository.listJobs(),
    ]);
    return toSummaryVm(pipelines, jobs);
  }

  async getFailedJobs(): Promise<JobVm[]> {
    const jobs = await this.repository.listJobs();
    return jobs.filter((job) => job.status === 'FAILED').map(toJobVm);
  }

  async getRetryQueue(): Promise<JobVm[]> {
    const jobs = await this.repository.listJobs();
    return jobs.filter((job) => isRetryable(job.status)).map(toJobVm);
  }

  async getDeadLetterJobs(): Promise<JobVm[]> {
    const jobs = await this.repository.listJobs();
    return jobs.filter((job) => job.status === 'DEAD_LETTER').map(toJobVm);
  }

  async getDataSourceOverview(): Promise<DataSourceOverviewVm[]> {
    const [sources, pipelines] = await Promise.all([
      this.repository.listSources(),
      this.repository.listPipelines({}),
    ]);
    return sources.map((source) =>
      toSourceOverviewVm(
        source,
        pipelines.filter((pipeline) => pipeline.source.id === source.id).length,
      ),
    );
  }

  async getDataQualityOverview(): Promise<DataQualityOverviewVm[]> {
    const pipelines = await this.repository.listPipelines({});
    return pipelines.map(toQualityOverviewVm);
  }
}
