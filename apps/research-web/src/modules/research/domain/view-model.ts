/**
 * Research view models — UI-facing, pre-formatted shapes produced by the mappers
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

export interface ProgressVm {
  readonly percent: number;
  readonly label: string;
  readonly currentStageLabel: string;
}

export interface StageStepVm {
  readonly stage: string;
  readonly label: string;
  readonly state: StatusVm;
  readonly gate: boolean;
  readonly owner?: string;
  readonly dateLabel?: string;
  readonly note?: string;
}

export interface ObjectiveVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
}

export interface DependencyVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
}

export interface MilestoneVm {
  readonly id: string;
  readonly label: string;
  readonly stageLabel: string;
  readonly status: StatusVm;
  readonly dueLabel?: string;
}

export interface ApprovalVm {
  readonly id: string;
  readonly role: string;
  readonly status: StatusVm;
  readonly decidedLabel?: string;
  readonly rationale?: string;
}

export interface ReviewVm {
  readonly id: string;
  readonly stageLabel: string;
  readonly reviewer: string;
  readonly status: StatusVm;
  readonly note?: string;
  readonly reviewedLabel?: string;
}

export interface SessionVm {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedLabel: string;
  readonly open: boolean;
}

export interface ArtifactVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly href: string;
  readonly stageLabel: string;
}

export interface HypothesisVm {
  readonly statement: string;
  readonly prediction: string;
  readonly successCriteria: string;
  readonly preRegistered: StatusVm;
  readonly registeredLabel?: string;
}

export interface MetricsVm {
  readonly openObjectives: string;
  readonly artifacts: string;
  readonly sessions: string;
  readonly reviewsPending: string;
  readonly ageDays: string;
}

export interface ProjectListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly owner: string;
  readonly status: StatusVm;
  readonly stageLabel: string;
  readonly progress: ProgressVm;
  readonly updatedLabel: string;
}

export interface ProjectDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly progress: ProgressVm;
  readonly hypothesis: HypothesisVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly metrics: MetricsVm;
  readonly stages: readonly StageStepVm[];
  readonly objectives: readonly ObjectiveVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly milestones: readonly MilestoneVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly reviews: readonly ReviewVm[];
  readonly sessions: readonly SessionVm[];
  readonly artifacts: readonly ArtifactVm[];
  readonly tags: readonly string[];
}

export interface TemplateVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly stageLabels: readonly string[];
  readonly objectives: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface ResearchSummaryVm {
  readonly totalProjects: number;
  readonly active: number;
  readonly blocked: number;
  readonly awaitingApproval: number;
  readonly byStage: readonly SummaryBucketVm[];
}

export interface WorkspaceLinkVm {
  readonly href: string;
  readonly pinnedProjects: number;
}
