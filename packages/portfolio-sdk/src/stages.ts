/**
 * The canonical portfolio-construction lifecycle — an ordered, gated progression
 * from a draft definition to an archived, published portfolio. Vocabulary + pure
 * ordering only; no optimization, no weight calculation, no risk computation.
 * Stage transitions are decided by deterministic engines and governance, never
 * here.
 */
export type PortfolioStage =
  | 'DRAFT'
  | 'SIGNAL_SELECTION'
  | 'CONSTRAINT_DEFINITION'
  | 'ALLOCATION_CONFIGURATION'
  | 'OPTIMIZATION_REQUEST'
  | 'VALIDATION'
  | 'REVIEW'
  | 'APPROVAL'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface PortfolioStageDescriptor {
  readonly stage: PortfolioStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: draft → signal selection → constraint definition → allocation configuration → optimization request → validation → review → approval → published → archived. */
export const PORTFOLIO_STAGES: readonly PortfolioStage[] = [
  'DRAFT',
  'SIGNAL_SELECTION',
  'CONSTRAINT_DEFINITION',
  'ALLOCATION_CONFIGURATION',
  'OPTIMIZATION_REQUEST',
  'VALIDATION',
  'REVIEW',
  'APPROVAL',
  'PUBLISHED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<PortfolioStage, PortfolioStageDescriptor> = {
  DRAFT: {
    stage: 'DRAFT',
    label: 'Draft',
    description: 'A proposed portfolio awaiting signal selection.',
    gate: false,
  },
  SIGNAL_SELECTION: {
    stage: 'SIGNAL_SELECTION',
    label: 'Signal selection',
    description: 'Approved signals selected as inputs (by reference).',
    gate: false,
  },
  CONSTRAINT_DEFINITION: {
    stage: 'CONSTRAINT_DEFINITION',
    label: 'Constraint definition',
    description: 'Weight, exposure and risk constraints declared.',
    gate: false,
  },
  ALLOCATION_CONFIGURATION: {
    stage: 'ALLOCATION_CONFIGURATION',
    label: 'Allocation configuration',
    description: 'Allocation model, universe and rebalance policy configured.',
    gate: false,
  },
  OPTIMIZATION_REQUEST: {
    stage: 'OPTIMIZATION_REQUEST',
    label: 'Optimization request',
    description: 'Optimization requested from the external optimizer (executed elsewhere).',
    gate: false,
  },
  VALIDATION: {
    stage: 'VALIDATION',
    label: 'Validation',
    description: 'Point-in-time / constraint validation (decided by Validation Foundation).',
    gate: true,
  },
  REVIEW: {
    stage: 'REVIEW',
    label: 'Review',
    description: 'Independent methodology review of the constructed portfolio.',
    gate: true,
  },
  APPROVAL: {
    stage: 'APPROVAL',
    label: 'Approval',
    description: 'Governance sign-off (decided by accountable humans).',
    gate: true,
  },
  PUBLISHED: {
    stage: 'PUBLISHED',
    label: 'Published',
    description: 'Immutable, capital-eligible portfolio snapshot.',
    gate: false,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Retired; retained for reproducibility.',
    gate: false,
  },
};

export function describeStage(stage: PortfolioStage): PortfolioStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: PortfolioStage): number {
  return PORTFOLIO_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: PortfolioStage): PortfolioStage | null {
  const index = PORTFOLIO_STAGES.indexOf(stage);
  return index >= 0 && index < PORTFOLIO_STAGES.length - 1 ? PORTFOLIO_STAGES[index + 1]! : null;
}

/** Whether a portfolio has been published (capital-eligible). */
export function isPublished(stage: PortfolioStage): boolean {
  return stageOrder(stage) >= stageOrder('PUBLISHED');
}

/** Whether a portfolio is terminal (archived). */
export function isArchived(stage: PortfolioStage): boolean {
  return stage === 'ARCHIVED';
}
