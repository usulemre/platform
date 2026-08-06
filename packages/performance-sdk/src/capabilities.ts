/**
 * Canonical Performance Analytics Engine capabilities — the reusable analytics services the
 * engine exposes. Vocabulary + descriptors only; behaviour is supplied by the service
 * application layer and infrastructure adapters. NO formulas, NO metric calculation, NO
 * statistical algorithms.
 */
export type AnalyticsCapability =
  | 'PERFORMANCE_REPORTS'
  | 'BENCHMARK_COMPARISON'
  | 'PORTFOLIO_COMPARISON'
  | 'STRATEGY_COMPARISON'
  | 'HISTORICAL_SNAPSHOTS'
  | 'METRIC_VERSIONING'
  | 'METRIC_CATALOG'
  | 'METRIC_REGISTRY'
  | 'PERFORMANCE_REVIEWS'
  | 'PERFORMANCE_APPROVAL';

export interface AnalyticsCapabilityDescriptor {
  readonly capability: AnalyticsCapability;
  readonly label: string;
  readonly description: string;
}

export const ANALYTICS_CAPABILITIES: readonly AnalyticsCapability[] = [
  'PERFORMANCE_REPORTS',
  'BENCHMARK_COMPARISON',
  'PORTFOLIO_COMPARISON',
  'STRATEGY_COMPARISON',
  'HISTORICAL_SNAPSHOTS',
  'METRIC_VERSIONING',
  'METRIC_CATALOG',
  'METRIC_REGISTRY',
  'PERFORMANCE_REVIEWS',
  'PERFORMANCE_APPROVAL',
];

const DESCRIPTORS: Record<AnalyticsCapability, AnalyticsCapabilityDescriptor> = {
  PERFORMANCE_REPORTS: {
    capability: 'PERFORMANCE_REPORTS',
    label: 'Performance reports',
    description:
      'Standardized performance reports over a subject (values supplied, never computed).',
  },
  BENCHMARK_COMPARISON: {
    capability: 'BENCHMARK_COMPARISON',
    label: 'Benchmark comparison',
    description: 'Compare a report against a benchmark (values pulled, never computed).',
  },
  PORTFOLIO_COMPARISON: {
    capability: 'PORTFOLIO_COMPARISON',
    label: 'Portfolio comparison',
    description: 'Compare reports across portfolios.',
  },
  STRATEGY_COMPARISON: {
    capability: 'STRATEGY_COMPARISON',
    label: 'Strategy comparison',
    description: 'Compare reports across strategies.',
  },
  HISTORICAL_SNAPSHOTS: {
    capability: 'HISTORICAL_SNAPSHOTS',
    label: 'Historical snapshots',
    description: 'Immutable point-in-time performance snapshots.',
  },
  METRIC_VERSIONING: {
    capability: 'METRIC_VERSIONING',
    label: 'Metric versioning',
    description: 'Versioned metric definitions.',
  },
  METRIC_CATALOG: {
    capability: 'METRIC_CATALOG',
    label: 'Metric catalog',
    description: 'The catalog of canonical metric definitions (descriptors only).',
  },
  METRIC_REGISTRY: {
    capability: 'METRIC_REGISTRY',
    label: 'Metric registry',
    description: 'The registry of metric definitions and their categories.',
  },
  PERFORMANCE_REVIEWS: {
    capability: 'PERFORMANCE_REVIEWS',
    label: 'Performance reviews',
    description: 'Independent review of a performance report.',
  },
  PERFORMANCE_APPROVAL: {
    capability: 'PERFORMANCE_APPROVAL',
    label: 'Performance approval',
    description: 'Governance approval of a performance report.',
  },
};

export function describeCapability(capability: AnalyticsCapability): AnalyticsCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly AnalyticsCapabilityDescriptor[] {
  return ANALYTICS_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
