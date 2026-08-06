/**
 * Canonical ingestion contracts — the shared, transport-agnostic shapes that the
 * data-ingestion service and its administration UI both speak. Inert data only.
 */
import type { PipelineCapability } from './capabilities';
import type { DataType } from './data-types';
import type { PipelineStage } from './pipeline-stages';
import type { RetryPolicy } from './primitives';
import type { JobStatus, PipelineHealth, PipelineStatus, QualityGrade } from './statuses';

export type IngestionEnvironment = 'SANDBOX' | 'PRODUCTION';

/** A registered external source, always reached via a connector abstraction. */
export interface SourceRef {
  readonly id: string;
  readonly name: string;
  /** Reference into the Connector Registry — never a live client. */
  readonly connectorRef: string;
  readonly connectorType: string;
}

export interface StageState {
  readonly stage: PipelineStage;
  readonly state: 'PASS' | 'ACTIVE' | 'PENDING' | 'FAIL' | 'SKIPPED';
  readonly note?: string;
}

export interface PipelineMetrics {
  readonly recordsIngested: string;
  readonly throughput: string;
  readonly avgLatency: string;
  readonly errorRate: string;
  readonly lastRunAt?: string;
}

export interface PipelineQuality {
  readonly grade: QualityGrade;
  readonly completeness: number;
  readonly validity: number;
  readonly checkedAt?: string;
}

/** A declarative pipeline definition (Source → … → Dataset Registry → Storage). */
export interface PipelineDefinition {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly dataType: DataType;
  readonly source: SourceRef;
  readonly capabilities: readonly PipelineCapability[];
  readonly retryPolicy: RetryPolicy;
  readonly schemaRef: string;
  readonly datasetRef: string;
  readonly owner: string;
  readonly team: string;
  readonly version: string;
  readonly environment: IngestionEnvironment;
}

/** A pipeline as observed at runtime (definition + operational state). */
export interface PipelineRecord extends PipelineDefinition {
  readonly status: PipelineStatus;
  readonly health: PipelineHealth;
  readonly stages: readonly StageState[];
  readonly metrics: PipelineMetrics;
  readonly quality: PipelineQuality;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
}

/** A single execution job of a pipeline. */
export interface JobRecord {
  readonly id: string;
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly dataType: DataType;
  readonly status: JobStatus;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly stage: PipelineStage;
  readonly error?: string;
  readonly enqueuedAt: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
}

export type PipelineEventType =
  | 'STARTED'
  | 'STAGE_COMPLETED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRIED'
  | 'DEAD_LETTERED'
  | 'PAUSED'
  | 'RESUMED';

export interface PipelineEvent {
  readonly id: string;
  readonly pipelineId: string;
  readonly type: PipelineEventType;
  readonly message: string;
  readonly stage?: PipelineStage;
  readonly actor?: string;
  readonly occurredAt: string;
}
