/**
 * Data-ingestion view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface StageStepVm {
  readonly stage: string;
  readonly label: string;
  readonly state: StatusVm;
  readonly note?: string;
}

export interface MetricsVm {
  readonly recordsIngested: string;
  readonly throughput: string;
  readonly avgLatency: string;
  readonly errorRate: string;
  readonly lastRunLabel?: string;
}

export interface QualityVm {
  readonly grade: StatusVm;
  readonly completeness: string;
  readonly validity: string;
  readonly checkedLabel?: string;
}

export interface EventVm {
  readonly id: string;
  readonly type: StatusVm;
  readonly message: string;
  readonly stageLabel?: string;
  readonly actor?: string;
  readonly occurredLabel: string;
}

export interface JobVm {
  readonly id: string;
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly dataTypeLabel: string;
  readonly status: StatusVm;
  readonly attemptLabel: string;
  readonly stageLabel: string;
  readonly error?: string;
  readonly enqueuedLabel: string;
}

export interface PipelineListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly sourceName: string;
  readonly dataType: StatusVm;
  readonly status: StatusVm;
  readonly health: StatusVm;
  readonly quality: StatusVm;
  readonly owner: string;
  readonly updatedLabel: string;
}

export interface PipelineDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly dataType: StatusVm;
  readonly status: StatusVm;
  readonly health: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly capabilities: readonly string[];
  readonly stages: readonly StageStepVm[];
  readonly metrics: MetricsVm;
  readonly quality: QualityVm;
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface IngestionSummaryVm {
  readonly totalPipelines: number;
  readonly active: number;
  readonly degraded: number;
  readonly failed: number;
  readonly totalJobs: number;
  readonly running: number;
  readonly failedJobs: number;
  readonly deadLetter: number;
  readonly byStatus: readonly SummaryBucketVm[];
  readonly byDataType: readonly SummaryBucketVm[];
}

export interface DataSourceOverviewVm {
  readonly id: string;
  readonly name: string;
  readonly connectorRef: string;
  readonly connectorType: string;
  readonly pipelineCount: number;
}

export interface DataQualityOverviewVm {
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly grade: StatusVm;
  readonly completeness: string;
  readonly validity: string;
}
