/**
 * Canonical research-engine contracts — the shared, transport-agnostic models the
 * research service and its researcher-facing UI both speak. Inert data only; no
 * quantitative algorithms, no statistics, no secrets. Artifacts from other
 * modules (datasets, features, signals, strategies, portfolios) are referenced by
 * ref ONLY — never embedded.
 */
import type { ResearchStage } from './lifecycle';
import type {
  ApprovalStatus,
  DependencyStatus,
  MilestoneStatus,
  ObjectiveStatus,
  ProjectStatus,
  ReviewStatus,
  StageState,
} from './statuses';

export type ArtifactKind =
  | 'DATASET'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO'
  | 'EXPERIMENT'
  | 'NOTEBOOK';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface ResearchHypothesis {
  readonly id: string;
  readonly statement: string;
  readonly prediction: string;
  readonly successCriteria: string;
  /** Pre-registration flag — frozen before any evaluation (SM-2). */
  readonly preRegistered: boolean;
  readonly registeredAt?: string;
}

export interface ResearchQuestion {
  readonly id: string;
  readonly question: string;
  readonly answered: boolean;
}

export interface ResearchObjective {
  readonly id: string;
  readonly label: string;
  readonly status: ObjectiveStatus;
}

export interface ResearchArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
  readonly stage: ResearchStage;
}

export interface ResearchNotebook {
  readonly id: string;
  readonly title: string;
  readonly ref: string;
}

export interface ResearchDependency {
  readonly id: string;
  readonly stage: ResearchStage;
  readonly dependsOnStage: ResearchStage;
  readonly status: DependencyStatus;
}

export interface ResearchMilestone {
  readonly id: string;
  readonly label: string;
  readonly stage: ResearchStage;
  readonly status: MilestoneStatus;
  readonly dueAt?: string;
}

export interface ResearchApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

export interface ResearchReview {
  readonly id: string;
  readonly stage: ResearchStage;
  readonly reviewer: string;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface ResearchSession {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedAt: string;
  readonly endedAt?: string;
}

export interface StageProgress {
  readonly stage: ResearchStage;
  readonly state: StageState;
  readonly owner?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly artifactRefs: readonly string[];
  readonly note?: string;
}

export interface ProgressInfo {
  readonly completedStages: number;
  readonly totalStages: number;
  readonly percent: number;
  readonly currentStage: ResearchStage;
}

export interface ResearchMetrics {
  readonly openObjectives: string;
  readonly artifacts: string;
  readonly sessions: string;
  readonly reviewsPending: string;
  readonly ageDays: string;
}

export interface ResearchTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly stages: readonly ResearchStage[];
  readonly objectives: readonly string[];
}

export interface ResearchProject {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly owner: string;
  readonly team: string;
  readonly status: ProjectStatus;
  readonly templateId?: string;
  readonly hypothesis: ResearchHypothesis;
  readonly questions: readonly ResearchQuestion[];
  readonly objectives: readonly ResearchObjective[];
  readonly stages: readonly StageProgress[];
  readonly dependencies: readonly ResearchDependency[];
  readonly milestones: readonly ResearchMilestone[];
  readonly approvals: readonly ResearchApproval[];
  readonly reviews: readonly ResearchReview[];
  readonly sessions: readonly ResearchSession[];
  readonly artifacts: readonly ResearchArtifact[];
  readonly notebooks: readonly ResearchNotebook[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
