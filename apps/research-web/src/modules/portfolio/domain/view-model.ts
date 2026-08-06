/**
 * Portfolio view models — UI-facing, pre-formatted shapes produced by the mappers
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

export interface DeploymentVm {
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
  readonly strategyId: string;
  readonly name: string;
  readonly assetClass: string;
  readonly weight: string;
  readonly href: string;
}

export interface HoldingVm {
  readonly id: string;
  readonly instrument: string;
  readonly assetClass: string;
  readonly side: string;
  readonly weight: string;
}

export interface AllocationBucketVm {
  readonly key: string;
  readonly label: string;
  readonly weight: string;
}

export interface ConstraintVm {
  readonly key: string;
  readonly label: string;
  readonly limit: string;
  readonly value: string;
  readonly statusLabel: string;
  readonly tone: Tone;
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

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface PortfolioVersionVm {
  readonly version: string;
  readonly registeredLabel: string;
  readonly note: string;
}

export interface LineageNodeVm {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface PortfolioListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly mandate: string;
  readonly assetClass: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly deployment: DeploymentVm;
  readonly validationTone: Tone;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface PortfolioDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly deployment: DeploymentVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly validation: ValidationVm;
  readonly risk: readonly RiskIndicatorVm[];
  readonly constraints: readonly ConstraintVm[];
  readonly holdings: readonly HoldingVm[];
  readonly allocations: readonly AllocationBucketVm[];
  readonly composition: readonly CompositionEntryVm[];
  readonly experimentRefs: readonly ReferenceVm[];
  readonly versions: readonly PortfolioVersionVm[];
  readonly lineage: readonly LineageNodeVm[];
  readonly workflow: WorkflowStatusVm;
  readonly backtestRef?: string;
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface PortfolioSummaryVm {
  readonly total: number;
  readonly approved: number;
  readonly underReview: number;
  readonly retired: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
