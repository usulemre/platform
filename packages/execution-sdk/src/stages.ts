/**
 * The canonical execution-simulation lifecycle — an ordered, gated progression from a
 * draft simulation session to an archived, approved session. Vocabulary + pure ordering
 * only; no execution algorithm, no exchange/broker connectivity, no fill/price
 * calculation. Stage transitions are decided by deterministic engines and governance,
 * never here.
 */
export type SimulationStage =
  | 'DRAFT'
  | 'SCENARIO_CONFIGURATION'
  | 'VALIDATION'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'REVIEW'
  | 'APPROVED'
  | 'ARCHIVED';

export interface SimulationStageDescriptor {
  readonly stage: SimulationStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: draft → scenario configuration → validation → queued → running → completed → review → approved → archived. */
export const SIMULATION_STAGES: readonly SimulationStage[] = [
  'DRAFT',
  'SCENARIO_CONFIGURATION',
  'VALIDATION',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'REVIEW',
  'APPROVED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<SimulationStage, SimulationStageDescriptor> = {
  DRAFT: {
    stage: 'DRAFT',
    label: 'Draft',
    description: 'A proposed simulation session awaiting configuration.',
    gate: false,
  },
  SCENARIO_CONFIGURATION: {
    stage: 'SCENARIO_CONFIGURATION',
    label: 'Scenario configuration',
    description: 'Scenario, universe, order flow and parameters defined.',
    gate: false,
  },
  VALIDATION: {
    stage: 'VALIDATION',
    label: 'Validation',
    description: 'Point-in-time / configuration validation (decided by Validation Foundation).',
    gate: true,
  },
  QUEUED: {
    stage: 'QUEUED',
    label: 'Queued',
    description: 'Scheduled for simulation by the Workflow Engine.',
    gate: false,
  },
  RUNNING: {
    stage: 'RUNNING',
    label: 'Running',
    description: 'Paper-trading simulation in progress (executed by the simulator).',
    gate: false,
  },
  COMPLETED: {
    stage: 'COMPLETED',
    label: 'Completed',
    description: 'Simulation finished; orders, fills, positions and reports produced.',
    gate: false,
  },
  REVIEW: {
    stage: 'REVIEW',
    label: 'Review',
    description: 'Independent review of the simulated execution.',
    gate: true,
  },
  APPROVED: {
    stage: 'APPROVED',
    label: 'Approved',
    description: 'Governance sign-off before promotion consideration (decided by humans).',
    gate: true,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Immutable, retained for reproducibility.',
    gate: false,
  },
};

export function describeStage(stage: SimulationStage): SimulationStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: SimulationStage): number {
  return SIMULATION_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: SimulationStage): SimulationStage | null {
  const index = SIMULATION_STAGES.indexOf(stage);
  return index >= 0 && index < SIMULATION_STAGES.length - 1 ? SIMULATION_STAGES[index + 1]! : null;
}

/** Whether a session has finished its simulation and produced results. */
export function isCompleted(stage: SimulationStage): boolean {
  return stageOrder(stage) >= stageOrder('COMPLETED');
}

/** Whether a session is terminal (archived). */
export function isArchived(stage: SimulationStage): boolean {
  return stage === 'ARCHIVED';
}
