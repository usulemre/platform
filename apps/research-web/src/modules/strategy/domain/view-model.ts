/**
 * Strategy view models — UI-facing, pre-formatted shapes produced by the mappers
 * so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface ApprovalVm {
  readonly label: string;
  readonly tone: Tone;
  readonly detail: string;
}

export interface EligibilityVm {
  readonly label: string;
  readonly tone: Tone;
}

export interface ReferenceVm {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly href?: string;
}

export interface CompositionEntryVm {
  readonly signalId: string;
  readonly name: string;
  readonly assetClass: string;
  readonly weight: string;
  readonly href: string;
}

export interface RiskIndicatorVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly statusLabel: string;
  readonly tone: Tone;
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

export interface WorkflowStatusVm {
  readonly workflowRef: string;
  readonly name: string;
  readonly stateLabel: string;
  readonly tone: Tone;
  readonly currentStage: string;
}

export interface TimelineStepVm {
  readonly stage: string;
  readonly label: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface StrategyVersionVm {
  readonly version: string;
  readonly registeredLabel: string;
  readonly note: string;
}

export interface LineageNodeVm {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface StrategyListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly assetClass: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly eligibility: EligibilityVm;
  readonly validationTone: Tone;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface StrategyDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly eligibility: EligibilityVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly validation: ValidationVm;
  readonly risk: readonly RiskIndicatorVm[];
  readonly composition: readonly CompositionEntryVm[];
  readonly portfolioRefs: readonly ReferenceVm[];
  readonly experimentRefs: readonly ReferenceVm[];
  readonly versions: readonly StrategyVersionVm[];
  readonly lineage: readonly LineageNodeVm[];
  readonly workflow: WorkflowStatusVm;
  readonly timeline: readonly TimelineStepVm[];
  readonly backtestRef?: string;
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface StrategySummaryVm {
  readonly total: number;
  readonly approved: number;
  readonly underReview: number;
  readonly retired: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
