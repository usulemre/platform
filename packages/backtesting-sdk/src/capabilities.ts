/**
 * Canonical Backtesting Engine capabilities — the reusable services the engine
 * exposes over the backtesting lifecycle. Vocabulary + descriptors only;
 * behaviour is supplied by the service application layer and infrastructure
 * adapters. No simulation, no metric computation, no optimization.
 */
export type BacktestingCapability =
  | 'HISTORICAL_SIMULATIONS'
  | 'WALK_FORWARD_ANALYSIS'
  | 'ROLLING_WINDOWS'
  | 'PARAMETER_SETS'
  | 'SCENARIO_MANAGEMENT'
  | 'RESULT_COMPARISON'
  | 'METRIC_CATALOG'
  | 'EXPERIMENT_LINKING'
  | 'SIGNAL_LINKING'
  | 'FEATURE_LINKING'
  | 'DATASET_LINKING'
  | 'PORTFOLIO_LINKING';

export interface BacktestingCapabilityDescriptor {
  readonly capability: BacktestingCapability;
  readonly label: string;
  readonly description: string;
}

export const BACKTESTING_CAPABILITIES: readonly BacktestingCapability[] = [
  'HISTORICAL_SIMULATIONS',
  'WALK_FORWARD_ANALYSIS',
  'ROLLING_WINDOWS',
  'PARAMETER_SETS',
  'SCENARIO_MANAGEMENT',
  'RESULT_COMPARISON',
  'METRIC_CATALOG',
  'EXPERIMENT_LINKING',
  'SIGNAL_LINKING',
  'FEATURE_LINKING',
  'DATASET_LINKING',
  'PORTFOLIO_LINKING',
];

const DESCRIPTORS: Record<BacktestingCapability, BacktestingCapabilityDescriptor> = {
  HISTORICAL_SIMULATIONS: {
    capability: 'HISTORICAL_SIMULATIONS',
    label: 'Historical simulations',
    description: 'Orchestrate historical point-in-time simulations (executed elsewhere).',
  },
  WALK_FORWARD_ANALYSIS: {
    capability: 'WALK_FORWARD_ANALYSIS',
    label: 'Walk-forward analysis',
    description: 'Coordinate walk-forward evaluation scenarios.',
  },
  ROLLING_WINDOWS: {
    capability: 'ROLLING_WINDOWS',
    label: 'Rolling windows',
    description: 'Coordinate rolling-window evaluation scenarios.',
  },
  PARAMETER_SETS: {
    capability: 'PARAMETER_SETS',
    label: 'Parameter sets',
    description: 'Manage named parameter sets for a backtest.',
  },
  SCENARIO_MANAGEMENT: {
    capability: 'SCENARIO_MANAGEMENT',
    label: 'Scenario management',
    description: 'Define and manage evaluation scenarios.',
  },
  RESULT_COMPARISON: {
    capability: 'RESULT_COMPARISON',
    label: 'Result comparison',
    description: 'Compare results across backtests (values supplied, never computed).',
  },
  METRIC_CATALOG: {
    capability: 'METRIC_CATALOG',
    label: 'Metric catalog',
    description: 'The catalog of known evaluation metrics (descriptors only).',
  },
  EXPERIMENT_LINKING: {
    capability: 'EXPERIMENT_LINKING',
    label: 'Experiment linking',
    description: 'Link a backtest to its registered experiment.',
  },
  SIGNAL_LINKING: {
    capability: 'SIGNAL_LINKING',
    label: 'Signal linking',
    description: 'Link a backtest to its input signals.',
  },
  FEATURE_LINKING: {
    capability: 'FEATURE_LINKING',
    label: 'Feature linking',
    description: 'Link a backtest to its input features.',
  },
  DATASET_LINKING: {
    capability: 'DATASET_LINKING',
    label: 'Dataset linking',
    description: 'Link a backtest to its input datasets.',
  },
  PORTFOLIO_LINKING: {
    capability: 'PORTFOLIO_LINKING',
    label: 'Portfolio linking',
    description: 'Link a backtest to a constructed portfolio.',
  },
};

export function describeCapability(
  capability: BacktestingCapability,
): BacktestingCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly BacktestingCapabilityDescriptor[] {
  return BACKTESTING_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
