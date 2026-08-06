/**
 * Canonical, reusable pipeline capabilities — the building blocks a pipeline
 * definition composes. Vocabulary + descriptors only; behaviour is supplied by
 * the service's application layer and infrastructure adapters.
 */
export type PipelineCapability =
  | 'SOURCE_REGISTRATION'
  | 'PIPELINE_DEFINITION'
  | 'PIPELINE_EXECUTION'
  | 'SCHEMA_VALIDATION'
  | 'NORMALIZATION'
  | 'DEDUPLICATION'
  | 'DATA_VERSIONING'
  | 'QUALITY_VALIDATION'
  | 'METADATA_GENERATION'
  | 'ERROR_HANDLING'
  | 'RETRY_POLICIES'
  | 'DEAD_LETTER_QUEUE'
  | 'PIPELINE_METRICS'
  | 'PIPELINE_EVENTS';

export interface PipelineCapabilityDescriptor {
  readonly capability: PipelineCapability;
  readonly label: string;
  readonly description: string;
}

export const PIPELINE_CAPABILITIES: readonly PipelineCapability[] = [
  'SOURCE_REGISTRATION',
  'PIPELINE_DEFINITION',
  'PIPELINE_EXECUTION',
  'SCHEMA_VALIDATION',
  'NORMALIZATION',
  'DEDUPLICATION',
  'DATA_VERSIONING',
  'QUALITY_VALIDATION',
  'METADATA_GENERATION',
  'ERROR_HANDLING',
  'RETRY_POLICIES',
  'DEAD_LETTER_QUEUE',
  'PIPELINE_METRICS',
  'PIPELINE_EVENTS',
];

const DESCRIPTORS: Record<PipelineCapability, PipelineCapabilityDescriptor> = {
  SOURCE_REGISTRATION: {
    capability: 'SOURCE_REGISTRATION',
    label: 'Source registration',
    description: 'Register an external source behind a connector.',
  },
  PIPELINE_DEFINITION: {
    capability: 'PIPELINE_DEFINITION',
    label: 'Pipeline definition',
    description: 'Declaratively define a source→dataset pipeline.',
  },
  PIPELINE_EXECUTION: {
    capability: 'PIPELINE_EXECUTION',
    label: 'Pipeline execution',
    description: 'Execute a pipeline as governed jobs.',
  },
  SCHEMA_VALIDATION: {
    capability: 'SCHEMA_VALIDATION',
    label: 'Schema validation',
    description: 'Validate decoded records against a schema.',
  },
  NORMALIZATION: {
    capability: 'NORMALIZATION',
    label: 'Normalization',
    description: 'Map records to canonical form.',
  },
  DEDUPLICATION: {
    capability: 'DEDUPLICATION',
    label: 'Deduplication',
    description: 'Drop duplicate records by stable key.',
  },
  DATA_VERSIONING: {
    capability: 'DATA_VERSIONING',
    label: 'Data versioning',
    description: 'Version canonical datasets immutably.',
  },
  QUALITY_VALIDATION: {
    capability: 'QUALITY_VALIDATION',
    label: 'Quality validation',
    description: 'Run data-quality checks and gates.',
  },
  METADATA_GENERATION: {
    capability: 'METADATA_GENERATION',
    label: 'Metadata generation',
    description: 'Generate provenance and lineage metadata.',
  },
  ERROR_HANDLING: {
    capability: 'ERROR_HANDLING',
    label: 'Error handling',
    description: 'Classify and route stage failures.',
  },
  RETRY_POLICIES: {
    capability: 'RETRY_POLICIES',
    label: 'Retry policies',
    description: 'Bounded, backed-off retries for transient errors.',
  },
  DEAD_LETTER_QUEUE: {
    capability: 'DEAD_LETTER_QUEUE',
    label: 'Dead-letter queue',
    description: 'Quarantine exhausted/failed jobs for review.',
  },
  PIPELINE_METRICS: {
    capability: 'PIPELINE_METRICS',
    label: 'Pipeline metrics',
    description: 'Throughput, latency and error metrics.',
  },
  PIPELINE_EVENTS: {
    capability: 'PIPELINE_EVENTS',
    label: 'Pipeline events',
    description: 'Emit lifecycle events to the event foundation.',
  },
};

export function describeCapability(capability: PipelineCapability): PipelineCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly PipelineCapabilityDescriptor[] {
  return PIPELINE_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
