/**
 * Canonical research lifecycle — the fixed, ordered stages every research project
 * travels from hypothesis to approval. Vocabulary only: no quantitative
 * algorithms, no statistics, no transport. The order encodes the scientific
 * method as a gated pipeline (CLAUDE.md SM-1..5, RL-1): no stage may be skipped.
 */
export type ResearchStage =
  | 'HYPOTHESIS'
  | 'RESEARCH_PROJECT'
  | 'DATASET_SELECTION'
  | 'FEATURE_RESEARCH'
  | 'FEATURE_VALIDATION'
  | 'SIGNAL_RESEARCH'
  | 'SIGNAL_VALIDATION'
  | 'STRATEGY_RESEARCH'
  | 'STRATEGY_VALIDATION'
  | 'PORTFOLIO_CONSTRUCTION'
  | 'RISK_REVIEW'
  | 'APPROVAL';

export interface ResearchStageDescriptor {
  readonly stage: ResearchStage;
  readonly order: number;
  readonly label: string;
  readonly description: string;
  /** True for stages that are governance/validation gates (decided elsewhere). */
  readonly gate: boolean;
}

export const RESEARCH_STAGES: readonly ResearchStage[] = [
  'HYPOTHESIS',
  'RESEARCH_PROJECT',
  'DATASET_SELECTION',
  'FEATURE_RESEARCH',
  'FEATURE_VALIDATION',
  'SIGNAL_RESEARCH',
  'SIGNAL_VALIDATION',
  'STRATEGY_RESEARCH',
  'STRATEGY_VALIDATION',
  'PORTFOLIO_CONSTRUCTION',
  'RISK_REVIEW',
  'APPROVAL',
];

const DESCRIPTORS: Record<ResearchStage, ResearchStageDescriptor> = {
  HYPOTHESIS: {
    stage: 'HYPOTHESIS',
    order: 0,
    label: 'Hypothesis',
    description: 'Pre-register a falsifiable hypothesis and success criteria.',
    gate: false,
  },
  RESEARCH_PROJECT: {
    stage: 'RESEARCH_PROJECT',
    order: 1,
    label: 'Research project',
    description: 'Scope the project, objectives and plan.',
    gate: false,
  },
  DATASET_SELECTION: {
    stage: 'DATASET_SELECTION',
    order: 2,
    label: 'Dataset selection',
    description: 'Select governed, point-in-time datasets.',
    gate: false,
  },
  FEATURE_RESEARCH: {
    stage: 'FEATURE_RESEARCH',
    order: 3,
    label: 'Feature research',
    description: 'Propose and build candidate features.',
    gate: false,
  },
  FEATURE_VALIDATION: {
    stage: 'FEATURE_VALIDATION',
    order: 4,
    label: 'Feature validation',
    description: 'Deterministic feature validation gate.',
    gate: true,
  },
  SIGNAL_RESEARCH: {
    stage: 'SIGNAL_RESEARCH',
    order: 5,
    label: 'Signal research',
    description: 'Compose features into candidate signals.',
    gate: false,
  },
  SIGNAL_VALIDATION: {
    stage: 'SIGNAL_VALIDATION',
    order: 6,
    label: 'Signal validation',
    description: 'Deterministic signal validation gate.',
    gate: true,
  },
  STRATEGY_RESEARCH: {
    stage: 'STRATEGY_RESEARCH',
    order: 7,
    label: 'Strategy research',
    description: 'Assemble signals into candidate strategies.',
    gate: false,
  },
  STRATEGY_VALIDATION: {
    stage: 'STRATEGY_VALIDATION',
    order: 8,
    label: 'Strategy validation',
    description: 'Deterministic strategy validation gate.',
    gate: true,
  },
  PORTFOLIO_CONSTRUCTION: {
    stage: 'PORTFOLIO_CONSTRUCTION',
    order: 9,
    label: 'Portfolio construction',
    description: 'Construct a candidate portfolio.',
    gate: false,
  },
  RISK_REVIEW: {
    stage: 'RISK_REVIEW',
    order: 10,
    label: 'Risk review',
    description: 'Independent risk review.',
    gate: true,
  },
  APPROVAL: {
    stage: 'APPROVAL',
    order: 11,
    label: 'Approval',
    description: 'Human/governance capital-eligibility approval.',
    gate: true,
  },
};

export function describeStage(stage: ResearchStage): ResearchStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: ResearchStage): number {
  return DESCRIPTORS[stage].order;
}

export function nextStage(stage: ResearchStage): ResearchStage | null {
  const index = DESCRIPTORS[stage].order;
  return RESEARCH_STAGES[index + 1] ?? null;
}

export function listStages(): readonly ResearchStageDescriptor[] {
  return RESEARCH_STAGES.map((stage) => DESCRIPTORS[stage]);
}
