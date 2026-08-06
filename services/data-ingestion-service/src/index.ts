/**
 * @services/data-ingestion-service — the canonical Data Ingestion Pipeline.
 *
 * Receives raw data ONLY through connector abstractions and transforms it into
 * canonical internal datasets along a fixed, governed stage path. It contains a
 * domain layer, an application layer, and infrastructure INTERFACES (ports); the
 * only adapters shipped in v1 are in-memory mocks. No provider logic, no storage,
 * no message broker (no Kafka, no RabbitMQ), no secrets.
 */
export * from './domain/pipeline-io';
export * from './domain/health';
export * from './domain/retry-decision';

export * from './application/ingestion-service';
export * from './application/pipeline-runner';

export * from './infrastructure/ports';
export {
  InMemoryPipelineQuery,
  InMemoryJobQuery,
  InMemoryEventQuery,
  InMemorySourceQuery,
} from './infrastructure/in-memory/repositories';
export * from './infrastructure/in-memory/adapters';
export { PIPELINES, JOBS, EVENTS, SOURCES } from './infrastructure/in-memory/seed';

export * from './composition';
