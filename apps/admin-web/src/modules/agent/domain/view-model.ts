/**
 * AI Agent view models — UI-facing, pre-formatted shapes produced by the mappers
 * so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface WorkflowAssignmentVm {
  readonly workflowRef: string;
  readonly name: string;
  readonly role: string;
}

export interface EvaluationVm {
  readonly gate: StatusVm;
  readonly score: string;
  readonly drift: StatusVm;
  readonly lastEvaluatedLabel?: string;
}

export interface PerformanceVm {
  readonly invocations: string;
  readonly avgLatency: string;
  readonly costToDate: string;
  readonly tokensToDate: string;
}

export interface HealthVm {
  readonly status: StatusVm;
  readonly message: string;
  readonly lastSeenLabel: string;
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

export interface TimelineStepVm {
  readonly stage: string;
  readonly label: string;
  readonly dateLabel?: string;
  readonly state: 'done' | 'current' | 'pending';
}

export interface ActivityEventVm {
  readonly id: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredLabel: string;
}

export interface AgentVersionVm {
  readonly version: string;
  readonly registeredLabel: string;
  readonly note: string;
}

export interface AgentListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly status: StatusVm;
  readonly authority: StatusVm;
  readonly health: StatusVm;
  readonly owner: string;
  readonly version: string;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface AgentDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly authority: StatusVm;
  readonly health: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly contracts: readonly MetadataRowVm[];
  readonly workflowAssignments: readonly WorkflowAssignmentVm[];
  readonly evaluation: EvaluationVm;
  readonly performance: PerformanceVm;
  readonly healthDetail: HealthVm;
  readonly validation: ValidationVm;
  readonly lifecycle: readonly TimelineStepVm[];
  readonly activity: readonly ActivityEventVm[];
  readonly versions: readonly AgentVersionVm[];
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface AgentSummaryVm {
  readonly total: number;
  readonly active: number;
  readonly underEvaluation: number;
  readonly retired: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
