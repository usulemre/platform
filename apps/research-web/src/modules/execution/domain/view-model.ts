/**
 * Execution view models — UI-facing, pre-formatted shapes produced by the mappers
 * so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface ReferenceVm {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly href?: string;
  readonly kindLabel: string;
}

export interface AuthorizationVm {
  readonly stateLabel: string;
  readonly tone: Tone;
  readonly tokenRef?: string;
  readonly issuedLabel?: string;
  readonly expiresLabel?: string;
}

export interface RiskApprovalVm {
  readonly assessmentId: string;
  readonly assessmentTitle: string;
  readonly verdict: StatusVm;
  readonly riskLevel: StatusVm;
  readonly decidedLabel?: string;
  readonly href: string;
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
  readonly actor?: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface ExecutionListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: StatusVm;
  readonly mode: StatusVm;
  readonly riskVerdict: StatusVm;
  readonly portfolioName: string;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface ExecutionDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: StatusVm;
  readonly mode: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly authorization: AuthorizationVm;
  readonly riskApproval: RiskApprovalVm;
  readonly references: readonly ReferenceVm[];
  readonly validation: ValidationVm;
  readonly timeline: readonly TimelineStepVm[];
  readonly workflow: WorkflowStatusVm;
  readonly cancellable: boolean;
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface ExecutionSummaryVm {
  readonly total: number;
  readonly pendingApproval: number;
  readonly authorized: number;
  readonly completed: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
