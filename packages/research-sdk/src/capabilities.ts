/**
 * Canonical research-engine capabilities — the reusable building blocks a
 * research project composes. Vocabulary + descriptors only; behaviour is supplied
 * by the service application layer and infrastructure adapters.
 */
export type ResearchCapability =
  | 'RESEARCH_TEMPLATES'
  | 'RESEARCH_SESSIONS'
  | 'RESEARCH_PIPELINES'
  | 'RESEARCH_DEPENDENCIES'
  | 'RESEARCH_REVIEWS'
  | 'RESEARCH_NOTES'
  | 'RESEARCH_TAGS'
  | 'RESEARCH_VERSIONING'
  | 'RESEARCH_SNAPSHOTS'
  | 'RESEARCH_CHECKPOINTS'
  | 'RESEARCH_LINEAGE'
  | 'RESEARCH_METRICS';

export interface ResearchCapabilityDescriptor {
  readonly capability: ResearchCapability;
  readonly label: string;
  readonly description: string;
}

export const RESEARCH_CAPABILITIES: readonly ResearchCapability[] = [
  'RESEARCH_TEMPLATES',
  'RESEARCH_SESSIONS',
  'RESEARCH_PIPELINES',
  'RESEARCH_DEPENDENCIES',
  'RESEARCH_REVIEWS',
  'RESEARCH_NOTES',
  'RESEARCH_TAGS',
  'RESEARCH_VERSIONING',
  'RESEARCH_SNAPSHOTS',
  'RESEARCH_CHECKPOINTS',
  'RESEARCH_LINEAGE',
  'RESEARCH_METRICS',
];

const DESCRIPTORS: Record<ResearchCapability, ResearchCapabilityDescriptor> = {
  RESEARCH_TEMPLATES: {
    capability: 'RESEARCH_TEMPLATES',
    label: 'Templates',
    description: 'Reusable project templates and lifecycles.',
  },
  RESEARCH_SESSIONS: {
    capability: 'RESEARCH_SESSIONS',
    label: 'Sessions',
    description: 'Working sessions with summaries.',
  },
  RESEARCH_PIPELINES: {
    capability: 'RESEARCH_PIPELINES',
    label: 'Pipelines',
    description: 'Orchestrated stage pipelines.',
  },
  RESEARCH_DEPENDENCIES: {
    capability: 'RESEARCH_DEPENDENCIES',
    label: 'Dependencies',
    description: 'Inter-stage and artifact dependencies.',
  },
  RESEARCH_REVIEWS: {
    capability: 'RESEARCH_REVIEWS',
    label: 'Reviews',
    description: 'Stage reviews and sign-off.',
  },
  RESEARCH_NOTES: {
    capability: 'RESEARCH_NOTES',
    label: 'Notes',
    description: 'Researcher notes and annotations.',
  },
  RESEARCH_TAGS: {
    capability: 'RESEARCH_TAGS',
    label: 'Tags',
    description: 'Tagging and categorization.',
  },
  RESEARCH_VERSIONING: {
    capability: 'RESEARCH_VERSIONING',
    label: 'Versioning',
    description: 'Immutable project versioning.',
  },
  RESEARCH_SNAPSHOTS: {
    capability: 'RESEARCH_SNAPSHOTS',
    label: 'Snapshots',
    description: 'Point-in-time project snapshots.',
  },
  RESEARCH_CHECKPOINTS: {
    capability: 'RESEARCH_CHECKPOINTS',
    label: 'Checkpoints',
    description: 'Resumable lifecycle checkpoints.',
  },
  RESEARCH_LINEAGE: {
    capability: 'RESEARCH_LINEAGE',
    label: 'Lineage',
    description: 'Provenance across stages and artifacts.',
  },
  RESEARCH_METRICS: {
    capability: 'RESEARCH_METRICS',
    label: 'Metrics',
    description: 'Research productivity metrics.',
  },
};

export function describeCapability(capability: ResearchCapability): ResearchCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly ResearchCapabilityDescriptor[] {
  return RESEARCH_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
