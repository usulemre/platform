/**
 * The canonical signal research lifecycle — an ordered, gated progression from a
 * raw candidate to a production candidate. Vocabulary + pure ordering only; no
 * alpha models, no statistics, no ML. Stage transitions are decided by
 * deterministic engines and governance, never here.
 */
export type SignalStage =
  | 'CANDIDATE'
  | 'RESEARCH'
  | 'VALIDATION'
  | 'REVIEW'
  | 'APPROVAL'
  | 'REGISTRY'
  | 'PRODUCTION_CANDIDATE';

export interface SignalStageDescriptor {
  readonly stage: SignalStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: candidate → research → validation → review → approval → registry → production candidate. */
export const SIGNAL_STAGES: readonly SignalStage[] = [
  'CANDIDATE',
  'RESEARCH',
  'VALIDATION',
  'REVIEW',
  'APPROVAL',
  'REGISTRY',
  'PRODUCTION_CANDIDATE',
];

const DESCRIPTORS: Record<SignalStage, SignalStageDescriptor> = {
  CANDIDATE: {
    stage: 'CANDIDATE',
    label: 'Candidate',
    description: 'A proposed signal awaiting research.',
    gate: false,
  },
  RESEARCH: {
    stage: 'RESEARCH',
    label: 'Research',
    description: 'Signal definition drafted from approved features.',
    gate: false,
  },
  VALIDATION: {
    stage: 'VALIDATION',
    label: 'Validation',
    description: 'Deterministic validation gauntlet (decided by Validation Foundation).',
    gate: true,
  },
  REVIEW: {
    stage: 'REVIEW',
    label: 'Review',
    description: 'Independent methodology review.',
    gate: true,
  },
  APPROVAL: {
    stage: 'APPROVAL',
    label: 'Approval',
    description: 'Governance sign-off (decided by accountable humans).',
    gate: true,
  },
  REGISTRY: {
    stage: 'REGISTRY',
    label: 'Signal registry',
    description: 'Registered in the Signal Registry as the source of truth.',
    gate: false,
  },
  PRODUCTION_CANDIDATE: {
    stage: 'PRODUCTION_CANDIDATE',
    label: 'Production candidate',
    description: 'Eligible for downstream strategy composition.',
    gate: false,
  },
};

export function describeStage(stage: SignalStage): SignalStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: SignalStage): number {
  return SIGNAL_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: SignalStage): SignalStage | null {
  const index = SIGNAL_STAGES.indexOf(stage);
  return index >= 0 && index < SIGNAL_STAGES.length - 1 ? SIGNAL_STAGES[index + 1]! : null;
}

/** Whether a signal at this stage may be consumed by downstream strategies. */
export function isProductionEligible(stage: SignalStage): boolean {
  return stage === 'PRODUCTION_CANDIDATE';
}

/** Whether a signal has reached the Signal Registry. */
export function isRegistered(stage: SignalStage): boolean {
  return stageOrder(stage) >= stageOrder('REGISTRY');
}
