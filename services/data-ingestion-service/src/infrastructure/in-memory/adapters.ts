/**
 * In-memory stage + foundation adapters. These are ABSTRACTIONS with no real IO:
 * no provider client, no storage engine, no message broker (no Kafka, no
 * RabbitMQ). They let the pipeline runner be exercised deterministically.
 */
import type { DataType, PipelineEvent, SourceRef } from '@platform/data-sdk';
import type {
  CanonicalBatch,
  DecodedBatch,
  DatasetVersionRef,
  RawPayload,
  SchemaOutcome,
} from '../../domain/pipeline-io';
import type {
  ConfigurationPort,
  ConnectorPort,
  DatasetRegistryPort,
  DecoderPort,
  EventBusPort,
  NormalizationPort,
  QualityPort,
  SchemaValidationPort,
  StoragePort,
  WorkflowPort,
} from '../ports';

export interface StubOptions {
  /** Fixed record count the connector "receives". */
  readonly recordCount?: number;
  /** When set, schema validation reports this many rejected records. */
  readonly schemaRejects?: number;
  /** Quality score the quality port returns. */
  readonly completeness?: number;
  readonly validity?: number;
}

export class StubConnector implements ConnectorPort {
  constructor(private readonly options: StubOptions = {}) {}
  async receive(source: SourceRef, dataType: DataType): Promise<RawPayload> {
    return {
      sourceId: source.id,
      dataType,
      recordCount: this.options.recordCount ?? 1_000,
      receivedAt: '1970-01-01T00:00:00.000Z',
    };
  }
}

export class StubDecoder implements DecoderPort {
  async decode(payload: RawPayload): Promise<DecodedBatch> {
    return { recordCount: payload.recordCount };
  }
}

export class StubSchemaValidation implements SchemaValidationPort {
  constructor(private readonly rejects = 0) {}
  async validateSchema(batch: DecodedBatch, _schemaRef: string): Promise<SchemaOutcome> {
    void _schemaRef;
    const rejected = Math.min(this.rejects, batch.recordCount);
    return rejected > 0
      ? { valid: false, rejected, message: `${rejected} records failed schema validation.` }
      : { valid: true, rejected: 0 };
  }
}

export class StubNormalization implements NormalizationPort {
  async normalize(batch: DecodedBatch, _dataType: DataType): Promise<CanonicalBatch> {
    void _dataType;
    return { recordCount: batch.recordCount, datasetRef: 'ds-stub' };
  }
}

export class StubQuality implements QualityPort {
  constructor(
    private readonly completeness = 0.999,
    private readonly validity = 0.999,
  ) {}
  async assess(_batch: CanonicalBatch): Promise<{ completeness: number; validity: number }> {
    void _batch;
    return { completeness: this.completeness, validity: this.validity };
  }
}

export class StubDatasetRegistry implements DatasetRegistryPort {
  async register(batch: CanonicalBatch, datasetRef: string): Promise<DatasetVersionRef> {
    void batch;
    return { datasetRef, version: 'v1' };
  }
}

/** Storage PLACEHOLDER — records nothing; persistence is out of scope in v1. */
export class NoopStorage implements StoragePort {
  async persist(_version: DatasetVersionRef): Promise<void> {
    void _version;
  }
}

/** In-memory event bus (an array) — NOT a broker. Captures published events. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: PipelineEvent[] = [];
  async publish(event: PipelineEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Workflow Engine port stub — records scheduling requests. */
export class StubWorkflow implements WorkflowPort {
  readonly scheduled: string[] = [];
  async schedule(pipelineId: string): Promise<void> {
    this.scheduled.push(pipelineId);
  }
}

/** Configuration Foundation stub — static, non-secret key/values. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
