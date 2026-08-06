/**
 * Infrastructure INTERFACES (ports) for the data-ingestion service. The
 * application and domain layers depend only on these abstractions; concrete
 * adapters (connectors, storage, message bus, Validation Foundation, Workflow
 * Engine, Configuration Foundation) are injected at composition time.
 *
 * This file declares NO implementation: no provider client, no storage engine,
 * no Kafka, no RabbitMQ. The in-memory mocks under `./in-memory` are the only
 * adapters shipped in v1.
 */
import type {
  DataType,
  JobRecord,
  PipelineEvent,
  PipelineRecord,
  SourceRef,
} from '@platform/data-sdk';
import type {
  CanonicalBatch,
  DecodedBatch,
  DatasetVersionRef,
  RawPayload,
  SchemaOutcome,
} from '../domain/pipeline-io';

/* ----------------------------- stage ports ----------------------------- */

/** Receives raw data via a connector abstraction ONLY — never a live provider. */
export interface ConnectorPort {
  receive(source: SourceRef, dataType: DataType): Promise<RawPayload>;
}

export interface DecoderPort {
  decode(payload: RawPayload): Promise<DecodedBatch>;
}

/** Validation Foundation — schema validation of decoded records. */
export interface SchemaValidationPort {
  validateSchema(batch: DecodedBatch, schemaRef: string): Promise<SchemaOutcome>;
}

export interface NormalizationPort {
  normalize(batch: DecodedBatch, dataType: DataType): Promise<CanonicalBatch>;
}

/** Validation Foundation — data-quality assessment of the canonical dataset. */
export interface QualityPort {
  assess(batch: CanonicalBatch): Promise<{ completeness: number; validity: number }>;
}

export interface DatasetRegistryPort {
  register(batch: CanonicalBatch, datasetRef: string): Promise<DatasetVersionRef>;
}

/** Storage is a PLACEHOLDER port — no storage engine is implemented in v1. */
export interface StoragePort {
  persist(version: DatasetVersionRef): Promise<void>;
}

/* -------------------------- foundation ports --------------------------- */

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: PipelineEvent): Promise<void>;
}

/** Workflow Engine — schedule/enqueue pipeline execution. */
export interface WorkflowPort {
  schedule(pipelineId: string): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}

/* ---------------------------- read models ------------------------------ */

export interface PipelineQueryPort {
  list(): Promise<readonly PipelineRecord[]>;
  getById(id: string): Promise<PipelineRecord | null>;
}

export interface JobQueryPort {
  list(): Promise<readonly JobRecord[]>;
  getById(id: string): Promise<JobRecord | null>;
}

export interface EventQueryPort {
  listForPipeline(pipelineId: string): Promise<readonly PipelineEvent[]>;
}

export interface SourceQueryPort {
  list(): Promise<readonly SourceRef[]>;
}
