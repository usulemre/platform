/**
 * Experiment view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface OutcomeVm {
  readonly label: string;
  readonly tone: Tone;
}

export interface TimelineStepVm {
  readonly stage: string;
  readonly label: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
}

export interface HypothesisVm {
  readonly statement: string;
  readonly prediction: string;
  readonly successCriteria: string;
  readonly preRegistered: boolean;
  readonly preRegisteredLabel: string;
  readonly frozen: boolean;
}

export interface ReferenceVm {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly href?: string;
}

export interface WorkflowStatusVm {
  readonly workflowRef: string;
  readonly name: string;
  readonly stateLabel: string;
  readonly tone: Tone;
  readonly currentStage: string;
}

export interface ValidationIssueVm {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly tone: Tone;
}

export interface ValidationVm {
  readonly status: string;
  readonly label: string;
  readonly tone: Tone;
  readonly issueCount: number;
  readonly issues: readonly ValidationIssueVm[];
  readonly checkedLabel?: string;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface ExperimentListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: StatusVm;
  readonly outcome: OutcomeVm;
  readonly owner: string;
  readonly assetClass: string;
  readonly updatedLabel: string;
  readonly validationTone: Tone;
  readonly workflowLabel: string;
  readonly tags: readonly string[];
}

export interface ExperimentDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly researchQuestion: string;
  readonly economicRationale: string;
  readonly status: StatusVm;
  readonly outcome: OutcomeVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly hypothesis: HypothesisVm;
  readonly datasetRefs: readonly ReferenceVm[];
  readonly featureRefs: readonly ReferenceVm[];
  readonly workflow: WorkflowStatusVm;
  readonly validation: ValidationVm;
  readonly timeline: readonly TimelineStepVm[];
  readonly tags: readonly string[];
  readonly trialLedgerRef?: string;
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface ExperimentSummaryVm {
  readonly total: number;
  readonly running: number;
  readonly underReview: number;
  readonly concluded: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
