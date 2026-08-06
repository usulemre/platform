/**
 * Risk view models — UI-facing, pre-formatted shapes produced by the mappers so
 * components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface SubjectVm {
  readonly kind: string;
  readonly kindLabel: string;
  readonly id: string;
  readonly name: string;
  readonly href?: string;
}

export interface IndicatorVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly statusLabel: string;
  readonly tone: Tone;
}

export interface StrategyRiskVm {
  readonly strategyId: string;
  readonly name: string;
  readonly levelLabel: string;
  readonly tone: Tone;
  readonly note: string;
  readonly href: string;
}

export interface PolicyReferenceVm {
  readonly code: string;
  readonly title: string;
}

export interface ExceptionVm {
  readonly code: string;
  readonly description: string;
  readonly statusLabel: string;
  readonly tone: Tone;
}

export interface TimelineStepVm {
  readonly stage: string;
  readonly label: string;
  readonly actor?: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
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

export interface RiskListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subject: SubjectVm;
  readonly status: StatusVm;
  readonly verdict: StatusVm;
  readonly riskLevel: StatusVm;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface RiskDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subject: SubjectVm;
  readonly status: StatusVm;
  readonly verdict: StatusVm;
  readonly riskLevel: StatusVm;
  readonly executionRecommendation: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly validation: ValidationVm;
  readonly portfolioRisk: readonly IndicatorVm[];
  readonly strategyRisk: readonly StrategyRiskVm[];
  readonly exposures: readonly IndicatorVm[];
  readonly constraints: readonly IndicatorVm[];
  readonly policyRefs: readonly PolicyReferenceVm[];
  readonly exceptions: readonly ExceptionVm[];
  readonly timeline: readonly TimelineStepVm[];
  readonly workflow: WorkflowStatusVm;
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface RiskSummaryVm {
  readonly total: number;
  readonly approved: number;
  readonly underReview: number;
  readonly escalated: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
