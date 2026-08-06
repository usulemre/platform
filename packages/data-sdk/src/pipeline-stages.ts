/**
 * Canonical ingestion pipeline stages — the fixed, ordered path every external
 * datum travels from an external source to the dataset registry and storage.
 * Vocabulary only: no provider logic, no transport, no storage.
 */
export type PipelineStage =
  | 'SOURCE'
  | 'CONNECTOR'
  | 'RAW_PAYLOAD'
  | 'DECODER'
  | 'SCHEMA_VALIDATION'
  | 'NORMALIZATION'
  | 'CANONICAL_DATASET'
  | 'QUALITY_VALIDATION'
  | 'DATASET_REGISTRY'
  | 'STORAGE';

export interface PipelineStageDescriptor {
  readonly stage: PipelineStage;
  readonly order: number;
  readonly label: string;
  readonly description: string;
}

/** The stages in canonical execution order. */
export const PIPELINE_STAGES: readonly PipelineStage[] = [
  'SOURCE',
  'CONNECTOR',
  'RAW_PAYLOAD',
  'DECODER',
  'SCHEMA_VALIDATION',
  'NORMALIZATION',
  'CANONICAL_DATASET',
  'QUALITY_VALIDATION',
  'DATASET_REGISTRY',
  'STORAGE',
];

const DESCRIPTORS: Record<PipelineStage, PipelineStageDescriptor> = {
  SOURCE: {
    stage: 'SOURCE',
    order: 0,
    label: 'Source',
    description: 'A registered external data source.',
  },
  CONNECTOR: {
    stage: 'CONNECTOR',
    order: 1,
    label: 'Connector',
    description: 'Receives data via a connector abstraction only.',
  },
  RAW_PAYLOAD: {
    stage: 'RAW_PAYLOAD',
    order: 2,
    label: 'Raw payload',
    description: 'Immutable raw payload as received.',
  },
  DECODER: {
    stage: 'DECODER',
    order: 3,
    label: 'Decoder',
    description: 'Decodes the raw payload into structured records.',
  },
  SCHEMA_VALIDATION: {
    stage: 'SCHEMA_VALIDATION',
    order: 4,
    label: 'Schema validation',
    description: 'Validates records against the declared schema.',
  },
  NORMALIZATION: {
    stage: 'NORMALIZATION',
    order: 5,
    label: 'Normalization',
    description: 'Maps records to canonical form.',
  },
  CANONICAL_DATASET: {
    stage: 'CANONICAL_DATASET',
    order: 6,
    label: 'Canonical dataset',
    description: 'The normalized, canonical internal dataset.',
  },
  QUALITY_VALIDATION: {
    stage: 'QUALITY_VALIDATION',
    order: 7,
    label: 'Quality validation',
    description: 'Runs data-quality checks on the canonical dataset.',
  },
  DATASET_REGISTRY: {
    stage: 'DATASET_REGISTRY',
    order: 8,
    label: 'Dataset registry',
    description: 'Registers the versioned dataset with provenance.',
  },
  STORAGE: {
    stage: 'STORAGE',
    order: 9,
    label: 'Storage',
    description: 'Persistence handled by infrastructure (placeholder).',
  },
};

export function describeStage(stage: PipelineStage): PipelineStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: PipelineStage): number {
  return DESCRIPTORS[stage].order;
}

export function listStages(): readonly PipelineStageDescriptor[] {
  return PIPELINE_STAGES.map((stage) => DESCRIPTORS[stage]);
}
