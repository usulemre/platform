/**
 * The canonical risk-governance lifecycle — an ordered, gated progression from a
 * draft risk assessment to an archived, execution-authorized assessment. Vocabulary
 * + pure ordering only; no VaR, no CVaR, no expected shortfall, no stress testing, no
 * exposure calculation. Stage transitions are decided by deterministic engines and
 * governance, never here.
 */
export type RiskStage =
  | 'DRAFT'
  | 'RISK_ASSESSMENT_REQUESTED'
  | 'POLICY_VALIDATION'
  | 'EXPOSURE_REVIEW'
  | 'LIMIT_VALIDATION'
  | 'EXCEPTION_REVIEW'
  | 'APPROVAL'
  | 'EXECUTION_AUTHORIZED'
  | 'ARCHIVED';

export interface RiskStageDescriptor {
  readonly stage: RiskStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: draft → assessment requested → policy validation → exposure review → limit validation → exception review → approval → execution authorized → archived. */
export const RISK_STAGES: readonly RiskStage[] = [
  'DRAFT',
  'RISK_ASSESSMENT_REQUESTED',
  'POLICY_VALIDATION',
  'EXPOSURE_REVIEW',
  'LIMIT_VALIDATION',
  'EXCEPTION_REVIEW',
  'APPROVAL',
  'EXECUTION_AUTHORIZED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<RiskStage, RiskStageDescriptor> = {
  DRAFT: {
    stage: 'DRAFT',
    label: 'Draft',
    description: 'A proposed risk assessment awaiting submission.',
    gate: false,
  },
  RISK_ASSESSMENT_REQUESTED: {
    stage: 'RISK_ASSESSMENT_REQUESTED',
    label: 'Assessment requested',
    description: 'A risk assessment has been requested for the subject portfolio.',
    gate: false,
  },
  POLICY_VALIDATION: {
    stage: 'POLICY_VALIDATION',
    label: 'Policy validation',
    description: 'Applicable risk policies validated (decided by deterministic engines).',
    gate: true,
  },
  EXPOSURE_REVIEW: {
    stage: 'EXPOSURE_REVIEW',
    label: 'Exposure review',
    description: 'Reported exposures reviewed against policy (values supplied, never calculated).',
    gate: false,
  },
  LIMIT_VALIDATION: {
    stage: 'LIMIT_VALIDATION',
    label: 'Limit validation',
    description: 'Risk limits validated (decided by deterministic engines).',
    gate: true,
  },
  EXCEPTION_REVIEW: {
    stage: 'EXCEPTION_REVIEW',
    label: 'Exception review',
    description: 'Open exceptions reviewed and dispositioned.',
    gate: false,
  },
  APPROVAL: {
    stage: 'APPROVAL',
    label: 'Approval',
    description: 'Risk governance sign-off (decided by accountable humans).',
    gate: true,
  },
  EXECUTION_AUTHORIZED: {
    stage: 'EXECUTION_AUTHORIZED',
    label: 'Execution authorized',
    description: 'A time-boxed execution authorization has been granted.',
    gate: false,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Retired; retained for reproducibility and audit.',
    gate: false,
  },
};

export function describeStage(stage: RiskStage): RiskStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: RiskStage): number {
  return RISK_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: RiskStage): RiskStage | null {
  const index = RISK_STAGES.indexOf(stage);
  return index >= 0 && index < RISK_STAGES.length - 1 ? RISK_STAGES[index + 1]! : null;
}

/** Whether an assessment has reached execution authorization. */
export function isExecutionAuthorized(stage: RiskStage): boolean {
  return stageOrder(stage) >= stageOrder('EXECUTION_AUTHORIZED');
}

/** Whether an assessment is terminal (archived). */
export function isArchived(stage: RiskStage): boolean {
  return stage === 'ARCHIVED';
}

/** Whether an assessment can be revalidated (any non-terminal stage). */
export function canRevalidate(stage: RiskStage): boolean {
  return stage !== 'ARCHIVED' && stage !== 'DRAFT';
}
