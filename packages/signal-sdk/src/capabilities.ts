/**
 * Canonical Signal Engine capabilities — the reusable services the engine exposes
 * over the signal lifecycle. Vocabulary + descriptors only; behaviour is supplied
 * by the service application layer and infrastructure adapters. No alpha models.
 */
export type SignalEngineCapability =
  | 'SIGNAL_REGISTRATION'
  | 'SIGNAL_VERSIONING'
  | 'SIGNAL_REVIEW'
  | 'SIGNAL_APPROVAL'
  | 'SIGNAL_PROMOTION'
  | 'SIGNAL_DISCOVERY'
  | 'SIGNAL_SEARCH'
  | 'SIGNAL_CATALOG'
  | 'SIGNAL_METADATA'
  | 'SIGNAL_DEPENDENCIES'
  | 'SIGNAL_LINEAGE'
  | 'SIGNAL_REGISTRY_INTEGRATION';

export interface SignalEngineCapabilityDescriptor {
  readonly capability: SignalEngineCapability;
  readonly label: string;
  readonly description: string;
}

export const SIGNAL_ENGINE_CAPABILITIES: readonly SignalEngineCapability[] = [
  'SIGNAL_REGISTRATION',
  'SIGNAL_VERSIONING',
  'SIGNAL_REVIEW',
  'SIGNAL_APPROVAL',
  'SIGNAL_PROMOTION',
  'SIGNAL_DISCOVERY',
  'SIGNAL_SEARCH',
  'SIGNAL_CATALOG',
  'SIGNAL_METADATA',
  'SIGNAL_DEPENDENCIES',
  'SIGNAL_LINEAGE',
  'SIGNAL_REGISTRY_INTEGRATION',
];

const DESCRIPTORS: Record<SignalEngineCapability, SignalEngineCapabilityDescriptor> = {
  SIGNAL_REGISTRATION: {
    capability: 'SIGNAL_REGISTRATION',
    label: 'Registration',
    description: 'Register validated signals into the Signal Registry.',
  },
  SIGNAL_VERSIONING: {
    capability: 'SIGNAL_VERSIONING',
    label: 'Versioning',
    description: 'Immutable, versioned signal definitions.',
  },
  SIGNAL_REVIEW: {
    capability: 'SIGNAL_REVIEW',
    label: 'Review',
    description: 'Independent methodology review of a signal.',
  },
  SIGNAL_APPROVAL: {
    capability: 'SIGNAL_APPROVAL',
    label: 'Approval',
    description: 'Governance sign-off (decided by humans).',
  },
  SIGNAL_PROMOTION: {
    capability: 'SIGNAL_PROMOTION',
    label: 'Promotion',
    description: 'Promote an approved signal to production candidate.',
  },
  SIGNAL_DISCOVERY: {
    capability: 'SIGNAL_DISCOVERY',
    label: 'Discovery',
    description: 'Discover reusable signals across the platform.',
  },
  SIGNAL_SEARCH: {
    capability: 'SIGNAL_SEARCH',
    label: 'Search',
    description: 'Search signals by name, family, tag or owner.',
  },
  SIGNAL_CATALOG: {
    capability: 'SIGNAL_CATALOG',
    label: 'Catalog',
    description: 'Browsable catalog of registered signals.',
  },
  SIGNAL_METADATA: {
    capability: 'SIGNAL_METADATA',
    label: 'Metadata',
    description: 'Manage signal metadata and definition.',
  },
  SIGNAL_DEPENDENCIES: {
    capability: 'SIGNAL_DEPENDENCIES',
    label: 'Dependencies',
    description: 'Upstream feature/dataset/signal dependencies.',
  },
  SIGNAL_LINEAGE: {
    capability: 'SIGNAL_LINEAGE',
    label: 'Lineage',
    description: 'Provenance from features to signal.',
  },
  SIGNAL_REGISTRY_INTEGRATION: {
    capability: 'SIGNAL_REGISTRY_INTEGRATION',
    label: 'Registry integration',
    description: 'Synchronize with the Signal Registry.',
  },
};

export function describeCapability(
  capability: SignalEngineCapability,
): SignalEngineCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly SignalEngineCapabilityDescriptor[] {
  return SIGNAL_ENGINE_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
