/**
 * Data-ingestion admin DTOs. The canonical shapes are owned by the shared
 * `@platform/data-sdk` (single source of truth across the service and this UI);
 * this module re-exports them so the admin tier speaks exactly the same
 * vocabulary. Inert data only — no transport, no provider logic.
 */
export type {
  DataType,
  JobRecord,
  JobStatus,
  PipelineEvent,
  PipelineEventType,
  PipelineHealth,
  PipelineRecord,
  PipelineStage,
  PipelineStatus,
  QualityGrade,
  SourceRef,
  StageState,
} from '@platform/data-sdk';
