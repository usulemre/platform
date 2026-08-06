/**
 * The canonical backtesting project lifecycle — an ordered, gated progression
 * from a draft configuration to an archived, approved backtest. Vocabulary +
 * pure ordering only; no simulation, no performance metrics, no optimization.
 * Stage transitions are decided by deterministic engines and governance, never
 * here.
 */
export type BacktestStage =
  | 'DRAFT'
  | 'CONFIGURATION'
  | 'VALIDATION'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'REVIEW'
  | 'APPROVED'
  | 'ARCHIVED';

export interface BacktestStageDescriptor {
  readonly stage: BacktestStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: draft → configuration → validation → queued → running → completed → review → approved → archived. */
export const BACKTEST_STAGES: readonly BacktestStage[] = [
  'DRAFT',
  'CONFIGURATION',
  'VALIDATION',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'REVIEW',
  'APPROVED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<BacktestStage, BacktestStageDescriptor> = {
  DRAFT: {
    stage: 'DRAFT',
    label: 'Draft',
    description: 'A proposed backtest awaiting configuration.',
    gate: false,
  },
  CONFIGURATION: {
    stage: 'CONFIGURATION',
    label: 'Configuration',
    description: 'Scenario, universe, window and parameter sets defined.',
    gate: false,
  },
  VALIDATION: {
    stage: 'VALIDATION',
    label: 'Validation',
    description: 'Point-in-time / leakage validation (decided by Validation Foundation).',
    gate: true,
  },
  QUEUED: {
    stage: 'QUEUED',
    label: 'Queued',
    description: 'Scheduled for execution by the Workflow Engine.',
    gate: false,
  },
  RUNNING: {
    stage: 'RUNNING',
    label: 'Running',
    description: 'Historical simulation in progress (executed elsewhere).',
    gate: false,
  },
  COMPLETED: {
    stage: 'COMPLETED',
    label: 'Completed',
    description: 'Simulation finished; results and reports produced.',
    gate: false,
  },
  REVIEW: {
    stage: 'REVIEW',
    label: 'Review',
    description: 'Independent methodology review of the results.',
    gate: true,
  },
  APPROVED: {
    stage: 'APPROVED',
    label: 'Approved',
    description: 'Governance sign-off (decided by accountable humans).',
    gate: true,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Immutable, retained for reproducibility.',
    gate: false,
  },
};

export function describeStage(stage: BacktestStage): BacktestStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: BacktestStage): number {
  return BACKTEST_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: BacktestStage): BacktestStage | null {
  const index = BACKTEST_STAGES.indexOf(stage);
  return index >= 0 && index < BACKTEST_STAGES.length - 1 ? BACKTEST_STAGES[index + 1]! : null;
}

/** Whether a backtest has finished its simulation and produced results. */
export function isCompleted(stage: BacktestStage): boolean {
  return stageOrder(stage) >= stageOrder('COMPLETED');
}

/** Whether a backtest is terminal (archived). */
export function isArchived(stage: BacktestStage): boolean {
  return stage === 'ARCHIVED';
}
