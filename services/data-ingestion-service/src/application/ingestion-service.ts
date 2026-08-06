/**
 * Ingestion application service — the read/command surface of the data-ingestion
 * service. It orchestrates ports only (repositories, event bus, workflow); it
 * holds no infrastructure, no provider logic, no storage, no broker. Consequential
 * transitions are expressed as governed abstractions over injected ports.
 */
import {
  isRetryable,
  type JobRecord,
  type PipelineEvent,
  type PipelineRecord,
  type SourceRef,
} from '@platform/data-sdk';
import { decideRetry, type RetryDecision } from '../domain/retry-decision';
import type {
  EventBusPort,
  EventQueryPort,
  JobQueryPort,
  PipelineQueryPort,
  SourceQueryPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface IngestionSummary {
  readonly totalPipelines: number;
  readonly active: number;
  readonly degraded: number;
  readonly failed: number;
  readonly totalJobs: number;
  readonly running: number;
  readonly failedJobs: number;
  readonly retrying: number;
  readonly deadLetter: number;
  readonly succeeded: number;
}

export interface DataSourceOverviewItem {
  readonly source: SourceRef;
  readonly pipelineCount: number;
}

export interface DataQualityOverviewItem {
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly grade: PipelineRecord['quality']['grade'];
  readonly completeness: number;
  readonly validity: number;
}

export interface IngestionServiceDeps {
  readonly pipelines: PipelineQueryPort;
  readonly jobs: JobQueryPort;
  readonly events: EventQueryPort;
  readonly sources: SourceQueryPort;
  readonly bus: EventBusPort;
  readonly workflow: WorkflowPort;
}

export class IngestionService {
  constructor(private readonly deps: IngestionServiceDeps) {}

  listPipelines(): Promise<readonly PipelineRecord[]> {
    return this.deps.pipelines.list();
  }

  getPipeline(id: string): Promise<PipelineRecord | null> {
    return this.deps.pipelines.getById(id);
  }

  listJobs(): Promise<readonly JobRecord[]> {
    return this.deps.jobs.list();
  }

  async getFailedJobs(): Promise<readonly JobRecord[]> {
    return (await this.deps.jobs.list()).filter((job) => job.status === 'FAILED');
  }

  async getRetryQueue(): Promise<readonly JobRecord[]> {
    return (await this.deps.jobs.list()).filter((job) => isRetryable(job.status));
  }

  async getDeadLetterQueue(): Promise<readonly JobRecord[]> {
    return (await this.deps.jobs.list()).filter((job) => job.status === 'DEAD_LETTER');
  }

  getPipelineEvents(pipelineId: string): Promise<readonly PipelineEvent[]> {
    return this.deps.events.listForPipeline(pipelineId);
  }

  listSources(): Promise<readonly SourceRef[]> {
    return this.deps.sources.list();
  }

  async getSummary(): Promise<IngestionSummary> {
    const [pipelines, jobs] = await Promise.all([
      this.deps.pipelines.list(),
      this.deps.jobs.list(),
    ]);
    const countJobs = (status: JobRecord['status']): number =>
      jobs.filter((job) => job.status === status).length;
    return {
      totalPipelines: pipelines.length,
      active: pipelines.filter((p) => p.status === 'ACTIVE').length,
      degraded: pipelines.filter((p) => p.status === 'DEGRADED').length,
      failed: pipelines.filter((p) => p.status === 'FAILED').length,
      totalJobs: jobs.length,
      running: countJobs('RUNNING'),
      failedJobs: countJobs('FAILED'),
      retrying: countJobs('RETRYING'),
      deadLetter: countJobs('DEAD_LETTER'),
      succeeded: countJobs('SUCCEEDED'),
    };
  }

  async getDataSourceOverview(): Promise<readonly DataSourceOverviewItem[]> {
    const [sources, pipelines] = await Promise.all([
      this.deps.sources.list(),
      this.deps.pipelines.list(),
    ]);
    return sources.map((source) => ({
      source,
      pipelineCount: pipelines.filter((p) => p.source.id === source.id).length,
    }));
  }

  async getDataQualityOverview(): Promise<readonly DataQualityOverviewItem[]> {
    const pipelines = await this.deps.pipelines.list();
    return pipelines.map((p) => ({
      pipelineId: p.id,
      pipelineName: p.name,
      grade: p.quality.grade,
      completeness: p.quality.completeness,
      validity: p.quality.validity,
    }));
  }

  /**
   * Decide and record the retry/dead-letter outcome for a failed job. The
   * decision is a pure domain function; the effect is expressed by publishing a
   * governed event. No persistence is performed in v1.
   */
  async retryJob(jobId: string, at: string): Promise<RetryDecision | null> {
    const pipelines = await this.deps.pipelines.list();
    const job = await this.deps.jobs.getById(jobId);
    if (!job) return null;
    const pipeline = pipelines.find((p) => p.id === job.pipelineId);
    const policy = pipeline?.retryPolicy ?? {
      maxAttempts: job.maxAttempts,
      baseDelayMs: 1_000,
      factor: 2,
      maxDelayMs: 60_000,
    };
    const decision = decideRetry(job.attempt, policy);
    await this.deps.bus.publish({
      id: `${job.id}:${decision.action}`,
      pipelineId: job.pipelineId,
      type: decision.action === 'RETRY' ? 'RETRIED' : 'DEAD_LETTERED',
      message:
        decision.action === 'RETRY'
          ? `Scheduled retry (attempt ${decision.nextAttempt}) in ${decision.delayMs}ms.`
          : 'Retry budget exhausted; moved to dead-letter queue.',
      stage: job.stage,
      actor: 'ingestion-service',
      occurredAt: at,
    });
    if (decision.action === 'RETRY') await this.deps.workflow.schedule(job.pipelineId);
    return decision;
  }
}
