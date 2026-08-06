/**
 * Canonical Execution Simulator capabilities — the reusable services the simulator
 * exposes over the simulation lifecycle. Vocabulary + descriptors only; behaviour is
 * supplied by the service application layer and infrastructure adapters. No execution
 * algorithm, no exchange/broker connectivity, no fill/price calculation.
 */
export type ExecutionCapability =
  | 'PAPER_TRADING'
  | 'ORDER_SIMULATION'
  | 'POSITION_SIMULATION'
  | 'PORTFOLIO_SIMULATION'
  | 'EXECUTION_REPLAY'
  | 'EXECUTION_TIMELINE'
  | 'EXECUTION_REPORTS'
  | 'SIMULATION_COMPARISON'
  | 'SIMULATION_METADATA'
  | 'EXECUTION_HISTORY'
  | 'EXECUTION_VALIDATION'
  | 'SCENARIO_TEMPLATES';

export interface ExecutionCapabilityDescriptor {
  readonly capability: ExecutionCapability;
  readonly label: string;
  readonly description: string;
}

export const EXECUTION_CAPABILITIES: readonly ExecutionCapability[] = [
  'PAPER_TRADING',
  'ORDER_SIMULATION',
  'POSITION_SIMULATION',
  'PORTFOLIO_SIMULATION',
  'EXECUTION_REPLAY',
  'EXECUTION_TIMELINE',
  'EXECUTION_REPORTS',
  'SIMULATION_COMPARISON',
  'SIMULATION_METADATA',
  'EXECUTION_HISTORY',
  'EXECUTION_VALIDATION',
  'SCENARIO_TEMPLATES',
];

const DESCRIPTORS: Record<ExecutionCapability, ExecutionCapabilityDescriptor> = {
  PAPER_TRADING: {
    capability: 'PAPER_TRADING',
    label: 'Paper trading',
    description: 'Orchestrate paper-trading sessions (never a real exchange or broker).',
  },
  ORDER_SIMULATION: {
    capability: 'ORDER_SIMULATION',
    label: 'Order simulation',
    description: 'Coordinate simulated order lifecycles (executed by the simulator).',
  },
  POSITION_SIMULATION: {
    capability: 'POSITION_SIMULATION',
    label: 'Position simulation',
    description: 'Track simulated position state transitions.',
  },
  PORTFOLIO_SIMULATION: {
    capability: 'PORTFOLIO_SIMULATION',
    label: 'Portfolio simulation',
    description: 'Reflect simulated portfolio state (values supplied, never computed).',
  },
  EXECUTION_REPLAY: {
    capability: 'EXECUTION_REPLAY',
    label: 'Execution replay',
    description: 'Deterministically replay a completed simulation session.',
  },
  EXECUTION_TIMELINE: {
    capability: 'EXECUTION_TIMELINE',
    label: 'Execution timeline',
    description: 'The ordered timeline of simulated execution events.',
  },
  EXECUTION_REPORTS: {
    capability: 'EXECUTION_REPORTS',
    label: 'Execution reports',
    description: 'References to generated execution reports (artifacts live elsewhere).',
  },
  SIMULATION_COMPARISON: {
    capability: 'SIMULATION_COMPARISON',
    label: 'Simulation comparison',
    description: 'Compare sessions (values supplied, never computed).',
  },
  SIMULATION_METADATA: {
    capability: 'SIMULATION_METADATA',
    label: 'Simulation metadata',
    description: 'Structured metadata and tags per session.',
  },
  EXECUTION_HISTORY: {
    capability: 'EXECUTION_HISTORY',
    label: 'Execution history',
    description: 'Immutable, versioned session history and snapshots.',
  },
  EXECUTION_VALIDATION: {
    capability: 'EXECUTION_VALIDATION',
    label: 'Execution validation',
    description: 'Validate a session before it may run or be approved.',
  },
  SCENARIO_TEMPLATES: {
    capability: 'SCENARIO_TEMPLATES',
    label: 'Scenario templates',
    description: 'Reusable simulation scenario templates.',
  },
};

export function describeCapability(capability: ExecutionCapability): ExecutionCapabilityDescriptor {
  return DESCRIPTORS[capability];
}

export function listCapabilities(): readonly ExecutionCapabilityDescriptor[] {
  return EXECUTION_CAPABILITIES.map((capability) => DESCRIPTORS[capability]);
}
