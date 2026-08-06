/**
 * Canonical Feature Store capabilities — the reusable services the store exposes
 * over approved features. Vocabulary + descriptors only; behaviour is supplied by
 * the service application layer and infrastructure adapters.
 */
export type FeatureStoreCapability =
  | 'FEATURE_REGISTRATION'
  | 'FEATURE_VERSIONING'
  | 'FEATURE_DISCOVERY'
  | 'FEATURE_SEARCH'
  | 'FEATURE_CATALOG'
  | 'FEATURE_METADATA'
  | 'FEATURE_LINEAGE'
  | 'FEATURE_DEPENDENCIES'
  | 'FEATURE_APPROVAL_STATUS'
  | 'FEATURE_QUALITY_STATUS'
  | 'FEATURE_REGISTRY_INTEGRATION';

export interface FeatureStoreCapabilityDescriptor {
  readonly capability: FeatureStoreCapability;
  readonly label: string;
  readonly description: string;
}

export const FEATURE_STORE_CAPABILITIES: readonly FeatureStoreCapability[] = [
  'FEATURE_REGISTRATION',
  'FEATURE_VERSIONING',
  'FEATURE_DISCOVERY',
  'FEATURE_SEARCH',
  'FEATURE_CATALOG',
  'FEATURE_METADATA',
  'FEATURE_LINEAGE',
  'FEATURE_DEPENDENCIES',
  'FEATURE_APPROVAL_STATUS',
  'FEATURE_QUALITY_STATUS',
  'FEATURE_REGISTRY_INTEGRATION',
];

const DESCRIPTORS: Record<FeatureStoreCapability, FeatureStoreCapabilityDescriptor> = {
  FEATURE_REGISTRATION: {
    capability: 'FEATURE_REGISTRATION',
    label: 'Registration',
    description: 'Register approved features into the store.',
  },
  FEATURE_VERSIONING: {
    capability: 'FEATURE_VERSIONING',
    label: 'Versioning',
    description: 'Immutable, versioned feature definitions.',
  },
  FEATURE_DISCOVERY: {
    capability: 'FEATURE_DISCOVERY',
    label: 'Discovery',
    description: 'Discover reusable features across the platform.',
  },
  FEATURE_SEARCH: {
    capability: 'FEATURE_SEARCH',
    label: 'Search',
    description: 'Search features by name, family, tag or owner.',
  },
  FEATURE_CATALOG: {
    capability: 'FEATURE_CATALOG',
    label: 'Catalog',
    description: 'Browsable catalog of registered features.',
  },
  FEATURE_METADATA: {
    capability: 'FEATURE_METADATA',
    label: 'Metadata',
    description: 'Manage feature metadata and schema.',
  },
  FEATURE_LINEAGE: {
    capability: 'FEATURE_LINEAGE',
    label: 'Lineage',
    description: 'Provenance from raw sources to feature.',
  },
  FEATURE_DEPENDENCIES: {
    capability: 'FEATURE_DEPENDENCIES',
    label: 'Dependencies',
    description: 'Upstream feature/dataset dependencies.',
  },
  FEATURE_APPROVAL_STATUS: {
    capability: 'FEATURE_APPROVAL_STATUS',
    label: 'Approval status',
    description: 'Governed approval state (decided elsewhere).',
  },
  FEATURE_QUALITY_STATUS: {
    capability: 'FEATURE_QUALITY_STATUS',
    label: 'Quality status',
    description: 'Quality and health indicators.',
  },
  FEATURE_REGISTRY_INTEGRATION: {
    capability: 'FEATURE_REGISTRY_INTEGRATION',
    label: 'Registry integration',
    description: 'Synchronize with the Feature Registry.',
  },
};

export function describeCapability(
  capability: FeatureStoreCapability,
): FeatureStoreCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly FeatureStoreCapabilityDescriptor[] {
  return FEATURE_STORE_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
