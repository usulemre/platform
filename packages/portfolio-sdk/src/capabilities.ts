/**
 * Canonical Portfolio Construction Engine capabilities — the reusable services the
 * engine exposes over the portfolio-construction lifecycle. Vocabulary +
 * descriptors only; behaviour is supplied by the service application layer and
 * infrastructure adapters. No optimization, no weight calculation, no risk
 * computation.
 */
export type PortfolioCapability =
  | 'PORTFOLIO_TEMPLATES'
  | 'PORTFOLIO_CONSTRAINTS'
  | 'ALLOCATION_MODELS'
  | 'OPTIMIZATION_REQUESTS'
  | 'SIGNAL_SELECTION'
  | 'UNIVERSE_MANAGEMENT'
  | 'PORTFOLIO_VERSIONING'
  | 'PORTFOLIO_REVIEW'
  | 'PORTFOLIO_APPROVAL'
  | 'PORTFOLIO_REGISTRY'
  | 'PORTFOLIO_COMPARISON'
  | 'PORTFOLIO_METADATA'
  | 'PORTFOLIO_LINEAGE'
  | 'PORTFOLIO_SNAPSHOTS';

export interface PortfolioCapabilityDescriptor {
  readonly capability: PortfolioCapability;
  readonly label: string;
  readonly description: string;
}

export const PORTFOLIO_CAPABILITIES: readonly PortfolioCapability[] = [
  'PORTFOLIO_TEMPLATES',
  'PORTFOLIO_CONSTRAINTS',
  'ALLOCATION_MODELS',
  'OPTIMIZATION_REQUESTS',
  'SIGNAL_SELECTION',
  'UNIVERSE_MANAGEMENT',
  'PORTFOLIO_VERSIONING',
  'PORTFOLIO_REVIEW',
  'PORTFOLIO_APPROVAL',
  'PORTFOLIO_REGISTRY',
  'PORTFOLIO_COMPARISON',
  'PORTFOLIO_METADATA',
  'PORTFOLIO_LINEAGE',
  'PORTFOLIO_SNAPSHOTS',
];

const DESCRIPTORS: Record<PortfolioCapability, PortfolioCapabilityDescriptor> = {
  PORTFOLIO_TEMPLATES: {
    capability: 'PORTFOLIO_TEMPLATES',
    label: 'Portfolio templates',
    description: 'Reusable construction templates (allocation model + constraint kinds).',
  },
  PORTFOLIO_CONSTRAINTS: {
    capability: 'PORTFOLIO_CONSTRAINTS',
    label: 'Portfolio constraints',
    description: 'Declare weight/exposure/risk constraints (evaluated elsewhere).',
  },
  ALLOCATION_MODELS: {
    capability: 'ALLOCATION_MODELS',
    label: 'Allocation models',
    description: 'Reference the allocation model to apply (never runs it).',
  },
  OPTIMIZATION_REQUESTS: {
    capability: 'OPTIMIZATION_REQUESTS',
    label: 'Optimization requests',
    description: 'Request optimization from the external optimizer (executed elsewhere).',
  },
  SIGNAL_SELECTION: {
    capability: 'SIGNAL_SELECTION',
    label: 'Signal selection',
    description: 'Select approved signals as portfolio inputs (by reference).',
  },
  UNIVERSE_MANAGEMENT: {
    capability: 'UNIVERSE_MANAGEMENT',
    label: 'Universe management',
    description: 'Define and manage the investable universe (by reference).',
  },
  PORTFOLIO_VERSIONING: {
    capability: 'PORTFOLIO_VERSIONING',
    label: 'Portfolio versioning',
    description: 'Immutable, semantically versioned portfolio definitions.',
  },
  PORTFOLIO_REVIEW: {
    capability: 'PORTFOLIO_REVIEW',
    label: 'Portfolio review',
    description: 'Independent methodology review of a constructed portfolio.',
  },
  PORTFOLIO_APPROVAL: {
    capability: 'PORTFOLIO_APPROVAL',
    label: 'Portfolio approval',
    description: 'Governance approval workflow (decided by accountable humans).',
  },
  PORTFOLIO_REGISTRY: {
    capability: 'PORTFOLIO_REGISTRY',
    label: 'Portfolio registry',
    description: 'The canonical registry of portfolio definitions.',
  },
  PORTFOLIO_COMPARISON: {
    capability: 'PORTFOLIO_COMPARISON',
    label: 'Portfolio comparison',
    description: 'Compare portfolios (values supplied, never computed).',
  },
  PORTFOLIO_METADATA: {
    capability: 'PORTFOLIO_METADATA',
    label: 'Portfolio metadata',
    description: 'Structured metadata and tags per portfolio.',
  },
  PORTFOLIO_LINEAGE: {
    capability: 'PORTFOLIO_LINEAGE',
    label: 'Portfolio lineage',
    description: 'Provenance across signals, strategies and backtests.',
  },
  PORTFOLIO_SNAPSHOTS: {
    capability: 'PORTFOLIO_SNAPSHOTS',
    label: 'Portfolio snapshots',
    description: 'Immutable point-in-time snapshots of a portfolio version.',
  },
};

export function describeCapability(capability: PortfolioCapability): PortfolioCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly PortfolioCapabilityDescriptor[] {
  return PORTFOLIO_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
