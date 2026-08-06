/**
 * The canonical performance-report lifecycle — an ordered, gated progression from a draft
 * report to an archived, published performance report. Vocabulary + pure ordering only; NO
 * formulas, NO metric calculation, NO statistical algorithms. Stage transitions are decided
 * by deterministic engines, the analytics runtime and accountable humans, never here.
 */
export type ReportStage =
  | 'DRAFT'
  | 'REQUESTED'
  | 'COMPUTED'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface ReportStageDescriptor {
  readonly stage: ReportStage;
  readonly label: string;
  readonly description: string;
  /** A gate stage requires an explicit deterministic/human decision to pass. */
  readonly gate: boolean;
}

/** The lifecycle in order: draft → requested → computed → review → approved → published → archived. */
export const REPORT_STAGES: readonly ReportStage[] = [
  'DRAFT',
  'REQUESTED',
  'COMPUTED',
  'REVIEW',
  'APPROVED',
  'PUBLISHED',
  'ARCHIVED',
];

const DESCRIPTORS: Record<ReportStage, ReportStageDescriptor> = {
  DRAFT: {
    stage: 'DRAFT',
    label: 'Draft',
    description: 'A proposed performance report awaiting configuration.',
    gate: false,
  },
  REQUESTED: {
    stage: 'REQUESTED',
    label: 'Requested',
    description: 'Computation requested from the analytics runtime.',
    gate: false,
  },
  COMPUTED: {
    stage: 'COMPUTED',
    label: 'Computed',
    description: 'Metric values computed by the analytics runtime and reflected here.',
    gate: false,
  },
  REVIEW: {
    stage: 'REVIEW',
    label: 'Review',
    description: 'Independent review of the performance report.',
    gate: true,
  },
  APPROVED: {
    stage: 'APPROVED',
    label: 'Approved',
    description: 'Governance sign-off of the report (decided by accountable humans).',
    gate: true,
  },
  PUBLISHED: {
    stage: 'PUBLISHED',
    label: 'Published',
    description: 'Immutable, published performance report.',
    gate: false,
  },
  ARCHIVED: {
    stage: 'ARCHIVED',
    label: 'Archived',
    description: 'Retired; retained for reproducibility and audit.',
    gate: false,
  },
};

export function describeStage(stage: ReportStage): ReportStageDescriptor {
  return DESCRIPTORS[stage];
}

export function stageOrder(stage: ReportStage): number {
  return REPORT_STAGES.indexOf(stage);
}

/** The next stage in the lifecycle, or null at the end. Pure ordering only. */
export function nextStage(stage: ReportStage): ReportStage | null {
  const index = REPORT_STAGES.indexOf(stage);
  return index >= 0 && index < REPORT_STAGES.length - 1 ? REPORT_STAGES[index + 1]! : null;
}

/** Whether a report has been published. */
export function isPublished(stage: ReportStage): boolean {
  return stageOrder(stage) >= stageOrder('PUBLISHED');
}

/** Whether a report is terminal (archived). */
export function isArchived(stage: ReportStage): boolean {
  return stage === 'ARCHIVED';
}
