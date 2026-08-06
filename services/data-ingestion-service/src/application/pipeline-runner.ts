/**
 * Pipeline runner — the canonical Pipeline Execution abstraction. It walks the
 * fixed stage path using injected ports only; it holds no provider logic, no
 * storage, no broker. It is deterministic: the clock is injected (`at`) and event
 * ids are derived, never generated from ambient time or randomness (CS-3, PIT-4).
 */
import {
  PIPELINE_STAGES,
  qualityGrade,
  type PipelineDefinition,
  type PipelineEvent,
  type PipelineStage,
  type StageState,
} from '@platform/data-sdk';
import type {
  ConnectorPort,
  DatasetRegistryPort,
  DecoderPort,
  EventBusPort,
  NormalizationPort,
  QualityPort,
  SchemaValidationPort,
  StoragePort,
} from '../infrastructure/ports';

export interface PipelineRunnerDeps {
  readonly connector: ConnectorPort;
  readonly decoder: DecoderPort;
  readonly schema: SchemaValidationPort;
  readonly normalization: NormalizationPort;
  readonly quality: QualityPort;
  readonly registry: DatasetRegistryPort;
  readonly storage: StoragePort;
  readonly bus: EventBusPort;
}

export interface RunResult {
  readonly pipelineId: string;
  readonly stages: readonly StageState[];
  readonly succeeded: boolean;
  readonly failedStage?: PipelineStage;
  readonly datasetVersion?: string;
}

function event(
  pipeline: PipelineDefinition,
  type: PipelineEvent['type'],
  message: string,
  at: string,
  stage?: PipelineStage,
): PipelineEvent {
  return {
    id: `${pipeline.id}:${type}:${stage ?? 'run'}`,
    pipelineId: pipeline.id,
    type,
    message,
    stage,
    actor: 'runner',
    occurredAt: at,
  };
}

export class PipelineRunner {
  constructor(private readonly deps: PipelineRunnerDeps) {}

  /**
   * Execute a pipeline definition as an abstraction. Returns per-stage outcomes
   * and publishes lifecycle events. `at` is the injected execution timestamp.
   */
  async run(pipeline: PipelineDefinition, at: string): Promise<RunResult> {
    const done: StageState[] = [];
    const mark = (stage: PipelineStage, state: StageState['state'], note?: string): StageState => {
      const entry: StageState = note ? { stage, state, note } : { stage, state };
      done.push(entry);
      return entry;
    };
    const remainingPending = (from: PipelineStage): void => {
      const start = PIPELINE_STAGES.indexOf(from);
      for (let i = start; i < PIPELINE_STAGES.length; i += 1) mark(PIPELINE_STAGES[i]!, 'PENDING');
    };
    const fail = async (stage: PipelineStage, note: string): Promise<RunResult> => {
      mark(stage, 'FAIL', note);
      const next = PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1];
      if (next) remainingPending(next);
      await this.deps.bus.publish(event(pipeline, 'FAILED', note, at, stage));
      return { pipelineId: pipeline.id, stages: done, succeeded: false, failedStage: stage };
    };

    await this.deps.bus.publish(event(pipeline, 'STARTED', 'Pipeline run started.', at));

    mark('SOURCE', 'PASS');
    const payload = await this.deps.connector.receive(pipeline.source, pipeline.dataType);
    mark('CONNECTOR', 'PASS');
    mark('RAW_PAYLOAD', 'PASS', `${payload.recordCount} records received`);

    const decoded = await this.deps.decoder.decode(payload);
    mark('DECODER', 'PASS');

    const schema = await this.deps.schema.validateSchema(decoded, pipeline.schemaRef);
    if (!schema.valid)
      return fail('SCHEMA_VALIDATION', schema.message ?? 'Schema validation failed.');
    mark('SCHEMA_VALIDATION', 'PASS');

    const canonical = await this.deps.normalization.normalize(decoded, pipeline.dataType);
    mark('NORMALIZATION', 'PASS');
    mark('CANONICAL_DATASET', 'PASS', `${canonical.recordCount} canonical records`);

    const score = await this.deps.quality.assess(canonical);
    const grade = qualityGrade(score);
    if (grade === 'FAIL') return fail('QUALITY_VALIDATION', 'Data-quality gate failed.');
    mark(
      'QUALITY_VALIDATION',
      grade === 'WARN' ? 'PASS' : 'PASS',
      grade === 'WARN' ? 'Passed with warnings' : undefined,
    );

    const version = await this.deps.registry.register(canonical, pipeline.datasetRef);
    mark('DATASET_REGISTRY', 'PASS', `${version.datasetRef}@${version.version}`);

    await this.deps.storage.persist(version);
    mark('STORAGE', 'PASS');

    await this.deps.bus.publish(
      event(pipeline, 'SUCCEEDED', 'Pipeline run succeeded.', at, 'DATASET_REGISTRY'),
    );
    return {
      pipelineId: pipeline.id,
      stages: done,
      succeeded: true,
      datasetVersion: `${version.datasetRef}@${version.version}`,
    };
  }
}
