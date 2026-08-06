/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Labels for data types, stages and capabilities come from the
 * shared `@platform/data-sdk` so the vocabulary is never re-invented.
 */
import {
  DATA_TYPES,
  describeCapability,
  describeDataType,
  describeStage,
  type DataType,
  type JobRecord,
  type JobStatus,
  type PipelineEvent,
  type PipelineHealth,
  type PipelineRecord,
  type PipelineStatus,
  type QualityGrade,
  type SourceRef,
  type StageState,
} from '@platform/data-sdk';
import type {
  DataQualityOverviewVm,
  DataSourceOverviewVm,
  EventVm,
  IngestionSummaryVm,
  JobVm,
  PipelineDetailVm,
  PipelineListItemVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
} from './view-model';

const STATUS_ORDER: readonly PipelineStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'DEGRADED',
  'FAILED',
  'RETIRED',
];

const STATUS_LABEL: Record<PipelineStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  DEGRADED: 'Degraded',
  FAILED: 'Failed',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<PipelineStatus, Tone> = {
  DRAFT: 'info',
  ACTIVE: 'positive',
  PAUSED: 'neutral',
  DEGRADED: 'warning',
  FAILED: 'danger',
  RETIRED: 'neutral',
};

const HEALTH_LABEL: Record<PipelineHealth, string> = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  DOWN: 'Down',
  UNKNOWN: 'Unknown',
};

const HEALTH_TONE: Record<PipelineHealth, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  DOWN: 'danger',
  UNKNOWN: 'neutral',
};

const JOB_LABEL: Record<JobStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RETRYING: 'Retrying',
  DEAD_LETTER: 'Dead-letter',
};

const JOB_TONE: Record<JobStatus, Tone> = {
  QUEUED: 'info',
  RUNNING: 'info',
  SUCCEEDED: 'positive',
  FAILED: 'danger',
  RETRYING: 'warning',
  DEAD_LETTER: 'danger',
};

const QUALITY_LABEL: Record<QualityGrade, string> = { PASS: 'Pass', WARN: 'Warn', FAIL: 'Fail' };
const QUALITY_TONE: Record<QualityGrade, Tone> = {
  PASS: 'positive',
  WARN: 'warning',
  FAIL: 'danger',
};

const STAGE_STATE_LABEL: Record<StageState['state'], string> = {
  PASS: 'Passed',
  ACTIVE: 'Active',
  PENDING: 'Pending',
  FAIL: 'Failed',
  SKIPPED: 'Skipped',
};

const STAGE_STATE_TONE: Record<StageState['state'], Tone> = {
  PASS: 'positive',
  ACTIVE: 'info',
  PENDING: 'neutral',
  FAIL: 'danger',
  SKIPPED: 'neutral',
};

const EVENT_TONE: Record<PipelineEvent['type'], Tone> = {
  STARTED: 'info',
  STAGE_COMPLETED: 'info',
  SUCCEEDED: 'positive',
  FAILED: 'danger',
  RETRIED: 'warning',
  DEAD_LETTERED: 'danger',
  PAUSED: 'neutral',
  RESUMED: 'info',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function humanizeEvent(type: PipelineEvent['type']): string {
  return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
}

function toStatusVm(status: PipelineStatus): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toHealthVm(health: PipelineHealth): StatusVm {
  return { value: health, label: HEALTH_LABEL[health], tone: HEALTH_TONE[health] };
}

function toDataTypeVm(dataType: DataType): StatusVm {
  return { value: dataType, label: describeDataType(dataType).label, tone: 'info' };
}

function toQualityVm(grade: QualityGrade): StatusVm {
  return { value: grade, label: QUALITY_LABEL[grade], tone: QUALITY_TONE[grade] };
}

export function toListItemVm(pipeline: PipelineRecord): PipelineListItemVm {
  return {
    id: pipeline.id,
    slug: pipeline.slug,
    name: pipeline.name,
    sourceName: pipeline.source.name,
    dataType: toDataTypeVm(pipeline.dataType),
    status: toStatusVm(pipeline.status),
    health: toHealthVm(pipeline.health),
    quality: toQualityVm(pipeline.quality.grade),
    owner: pipeline.owner,
    updatedLabel: dateLabel(pipeline.updatedAt),
  };
}

export function toDetailVm(pipeline: PipelineRecord): PipelineDetailVm {
  return {
    id: pipeline.id,
    slug: pipeline.slug,
    name: pipeline.name,
    description: pipeline.description,
    dataType: toDataTypeVm(pipeline.dataType),
    status: toStatusVm(pipeline.status),
    health: toHealthVm(pipeline.health),
    metadata: [
      { label: 'Source', value: pipeline.source.name },
      {
        label: 'Connector',
        value: `${pipeline.source.connectorRef} (${pipeline.source.connectorType})`,
      },
      { label: 'Data type', value: describeDataType(pipeline.dataType).label },
      { label: 'Schema', value: pipeline.schemaRef },
      { label: 'Dataset', value: pipeline.datasetRef },
      { label: 'Owner', value: pipeline.owner },
      { label: 'Team', value: pipeline.team },
      { label: 'Version', value: pipeline.version },
      {
        label: 'Environment',
        value: pipeline.environment === 'SANDBOX' ? 'Sandbox' : 'Production',
      },
      { label: 'Updated', value: dateLabel(pipeline.updatedAt) },
    ],
    capabilities: pipeline.capabilities.map((capability) => describeCapability(capability).label),
    stages: pipeline.stages.map((stage) => ({
      stage: stage.stage,
      label: describeStage(stage.stage).label,
      state: {
        value: stage.state,
        label: STAGE_STATE_LABEL[stage.state],
        tone: STAGE_STATE_TONE[stage.state],
      },
      note: stage.note,
    })),
    metrics: {
      recordsIngested: pipeline.metrics.recordsIngested,
      throughput: pipeline.metrics.throughput,
      avgLatency: pipeline.metrics.avgLatency,
      errorRate: pipeline.metrics.errorRate,
      lastRunLabel: pipeline.metrics.lastRunAt
        ? dateTimeLabel(pipeline.metrics.lastRunAt)
        : undefined,
    },
    quality: {
      grade: toQualityVm(pipeline.quality.grade),
      completeness: pct(pipeline.quality.completeness),
      validity: pct(pipeline.quality.validity),
      checkedLabel: pipeline.quality.checkedAt ? dateLabel(pipeline.quality.checkedAt) : undefined,
    },
  };
}

export function toJobVm(job: JobRecord): JobVm {
  return {
    id: job.id,
    pipelineId: job.pipelineId,
    pipelineName: job.pipelineName,
    dataTypeLabel: describeDataType(job.dataType).label,
    status: { value: job.status, label: JOB_LABEL[job.status], tone: JOB_TONE[job.status] },
    attemptLabel: `${job.attempt}/${job.maxAttempts}`,
    stageLabel: describeStage(job.stage).label,
    error: job.error,
    enqueuedLabel: dateTimeLabel(job.enqueuedAt),
  };
}

export function toEventVm(event: PipelineEvent): EventVm {
  return {
    id: event.id,
    type: { value: event.type, label: humanizeEvent(event.type), tone: EVENT_TONE[event.type] },
    message: event.message,
    stageLabel: event.stage ? describeStage(event.stage).label : undefined,
    actor: event.actor,
    occurredLabel: dateTimeLabel(event.occurredAt),
  };
}

export function toSourceOverviewVm(source: SourceRef, pipelineCount: number): DataSourceOverviewVm {
  return {
    id: source.id,
    name: source.name,
    connectorRef: source.connectorRef,
    connectorType: source.connectorType,
    pipelineCount,
  };
}

export function toQualityOverviewVm(pipeline: PipelineRecord): DataQualityOverviewVm {
  return {
    pipelineId: pipeline.id,
    pipelineName: pipeline.name,
    grade: toQualityVm(pipeline.quality.grade),
    completeness: pct(pipeline.quality.completeness),
    validity: pct(pipeline.quality.validity),
  };
}

export function toSummaryVm(
  pipelines: readonly PipelineRecord[],
  jobs: readonly JobRecord[],
): IngestionSummaryVm {
  const countStatus = (status: PipelineStatus): number =>
    pipelines.filter((p) => p.status === status).length;
  const countJob = (status: JobStatus): number => jobs.filter((j) => j.status === status).length;
  const countType = (type: DataType): number => pipelines.filter((p) => p.dataType === type).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countStatus(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  const byDataType: SummaryBucketVm[] = DATA_TYPES.map((type) => ({
    value: type,
    label: describeDataType(type).label,
    count: countType(type),
    tone: 'info' as Tone,
  })).filter((bucket) => bucket.count > 0);

  return {
    totalPipelines: pipelines.length,
    active: countStatus('ACTIVE'),
    degraded: countStatus('DEGRADED'),
    failed: countStatus('FAILED'),
    totalJobs: jobs.length,
    running: countJob('RUNNING'),
    failedJobs: countJob('FAILED'),
    deadLetter: countJob('DEAD_LETTER'),
    byStatus,
    byDataType,
  };
}
