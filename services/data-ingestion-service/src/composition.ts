/**
 * Composition root for the data-ingestion service. The single place concrete
 * adapters are bound. In v1 only the in-memory mocks are wired; swapping in real
 * infrastructure adapters (connectors, storage, event bus, Validation Foundation,
 * Workflow Engine, Configuration Foundation) requires no application/domain change.
 */
import { IngestionService } from './application/ingestion-service';
import { PipelineRunner, type PipelineRunnerDeps } from './application/pipeline-runner';
import {
  InMemoryEventBus,
  NoopStorage,
  StaticConfiguration,
  StubConnector,
  StubDatasetRegistry,
  StubDecoder,
  StubNormalization,
  StubQuality,
  StubSchemaValidation,
  StubWorkflow,
  type StubOptions,
} from './infrastructure/in-memory/adapters';
import {
  InMemoryEventQuery,
  InMemoryJobQuery,
  InMemoryPipelineQuery,
  InMemorySourceQuery,
} from './infrastructure/in-memory/repositories';

export function createIngestionService(): IngestionService {
  return new IngestionService({
    pipelines: new InMemoryPipelineQuery(),
    jobs: new InMemoryJobQuery(),
    events: new InMemoryEventQuery(),
    sources: new InMemorySourceQuery(),
    bus: new InMemoryEventBus(),
    workflow: new StubWorkflow(),
  });
}

/** Build a runner over stub stage adapters. `options` shapes the stub behaviour
 *  (record counts, schema rejects, quality score) for tests and demos. */
export function createPipelineRunner(options: StubOptions = {}): {
  runner: PipelineRunner;
  bus: InMemoryEventBus;
} {
  const bus = new InMemoryEventBus();
  const deps: PipelineRunnerDeps = {
    connector: new StubConnector(options),
    decoder: new StubDecoder(),
    schema: new StubSchemaValidation(options.schemaRejects ?? 0),
    normalization: new StubNormalization(),
    quality: new StubQuality(options.completeness ?? 0.999, options.validity ?? 0.999),
    registry: new StubDatasetRegistry(),
    storage: new NoopStorage(),
    bus,
  };
  return { runner: new PipelineRunner(deps), bus };
}

/** Default Configuration Foundation stub (non-secret keys only). */
export const configuration = new StaticConfiguration({
  'ingestion.default-environment': 'PRODUCTION',
});

export const ingestionService = createIngestionService();
