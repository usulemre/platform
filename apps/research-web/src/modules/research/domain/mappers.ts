/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Stage/capability labels come from `@platform/research-sdk`.
 * Progress is derived (completed / total stages) — never a statistic.
 */
import {
  describeStage,
  isStageDone,
  RESEARCH_STAGES,
  stageOrder,
  type ApprovalStatus,
  type ArtifactKind,
  type DependencyStatus,
  type MilestoneStatus,
  type ObjectiveStatus,
  type ProjectStatus,
  type ResearchApproval,
  type ResearchArtifact,
  type ResearchDependency,
  type ResearchMilestone,
  type ResearchObjective,
  type ResearchProject,
  type ResearchReview,
  type ResearchSession,
  type ResearchStage,
  type ResearchTemplate,
  type ReviewStatus,
  type StageProgress,
  type StageState,
} from '@platform/research-sdk';
import type {
  ApprovalVm,
  ArtifactVm,
  DependencyVm,
  MetricsVm,
  MilestoneVm,
  ObjectiveVm,
  ProgressVm,
  ProjectDetailVm,
  ProjectListItemVm,
  ResearchSummaryVm,
  ReviewVm,
  SessionVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  TemplateVm,
  Tone,
} from './view-model';

const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  REJECTED: 'Rejected',
};
const PROJECT_STATUS_TONE: Record<ProjectStatus, Tone> = {
  DRAFT: 'info',
  ACTIVE: 'positive',
  BLOCKED: 'danger',
  ON_HOLD: 'warning',
  COMPLETED: 'positive',
  ARCHIVED: 'neutral',
  REJECTED: 'danger',
};

const STAGE_STATE_LABEL: Record<StageState, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In progress',
  COMPLETE: 'Complete',
  BLOCKED: 'Blocked',
};
const STAGE_STATE_TONE: Record<StageState, Tone> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETE: 'positive',
  BLOCKED: 'danger',
};

const OBJECTIVE_LABEL: Record<ObjectiveStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  MET: 'Met',
  MISSED: 'Missed',
};
const OBJECTIVE_TONE: Record<ObjectiveStatus, Tone> = {
  OPEN: 'neutral',
  IN_PROGRESS: 'info',
  MET: 'positive',
  MISSED: 'danger',
};

const DEP_LABEL: Record<DependencyStatus, string> = {
  SATISFIED: 'Satisfied',
  PENDING: 'Pending',
  BLOCKED: 'Blocked',
};
const DEP_TONE: Record<DependencyStatus, Tone> = {
  SATISFIED: 'positive',
  PENDING: 'warning',
  BLOCKED: 'danger',
};

const MILESTONE_LABEL: Record<MilestoneStatus, string> = {
  PENDING: 'Pending',
  REACHED: 'Reached',
  MISSED: 'Missed',
};
const MILESTONE_TONE: Record<MilestoneStatus, Tone> = {
  PENDING: 'neutral',
  REACHED: 'positive',
  MISSED: 'danger',
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  NOT_REQUESTED: 'Not requested',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};
const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  NOT_REQUESTED: 'neutral',
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
};

const REVIEW_LABEL: Record<ReviewStatus, string> = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  CHANGES_REQUESTED: 'Changes requested',
};
const REVIEW_TONE: Record<ReviewStatus, Tone> = {
  PENDING: 'warning',
  PASSED: 'positive',
  CHANGES_REQUESTED: 'danger',
};

const ARTIFACT_ROUTE: Record<ArtifactKind, string> = {
  DATASET: '/datasets',
  FEATURE: '/features',
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolios',
  EXPERIMENT: '/experiments',
  NOTEBOOK: '#',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageLabel(stage: ResearchStage): string {
  return describeStage(stage).label;
}

function currentStage(stages: readonly StageProgress[]): ResearchStage {
  const sorted = [...stages].sort((a, b) => stageOrder(a.stage) - stageOrder(b.stage));
  const active = sorted.find((s) => s.state === 'IN_PROGRESS' || s.state === 'BLOCKED');
  if (active) return active.stage;
  const pending = sorted.find((s) => s.state === 'PENDING');
  if (pending) return pending.stage;
  return sorted[sorted.length - 1]?.stage ?? 'HYPOTHESIS';
}

function toProgressVm(stages: readonly StageProgress[]): ProgressVm {
  const total = stages.length;
  const completed = stages.filter((s) => isStageDone(s.state)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const stage = currentStage(stages);
  return { percent, label: `${completed}/${total} stages`, currentStageLabel: stageLabel(stage) };
}

function toStatusVm(status: ProjectStatus): StatusVm {
  return { value: status, label: PROJECT_STATUS_LABEL[status], tone: PROJECT_STATUS_TONE[status] };
}

export function toListItemVm(project: ResearchProject): ProjectListItemVm {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    owner: project.owner,
    status: toStatusVm(project.status),
    stageLabel: stageLabel(currentStage(project.stages)),
    progress: toProgressVm(project.stages),
    updatedLabel: dateLabel(project.updatedAt),
  };
}

function toStageStepVm(step: StageProgress): StageStepVm {
  const descriptor = describeStage(step.stage);
  return {
    stage: step.stage,
    label: descriptor.label,
    state: {
      value: step.state,
      label: STAGE_STATE_LABEL[step.state],
      tone: STAGE_STATE_TONE[step.state],
    },
    gate: descriptor.gate,
    owner: step.owner,
    dateLabel: step.completedAt
      ? dateLabel(step.completedAt)
      : step.startedAt
        ? dateLabel(step.startedAt)
        : undefined,
    note: step.note,
  };
}

function toObjectiveVm(objective: ResearchObjective): ObjectiveVm {
  return {
    id: objective.id,
    label: objective.label,
    status: {
      value: objective.status,
      label: OBJECTIVE_LABEL[objective.status],
      tone: OBJECTIVE_TONE[objective.status],
    },
  };
}

function toDependencyVm(dependency: ResearchDependency): DependencyVm {
  return {
    id: dependency.id,
    label: `${stageLabel(dependency.stage)} ← ${stageLabel(dependency.dependsOnStage)}`,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function toMilestoneVm(milestone: ResearchMilestone): MilestoneVm {
  return {
    id: milestone.id,
    label: milestone.label,
    stageLabel: stageLabel(milestone.stage),
    status: {
      value: milestone.status,
      label: MILESTONE_LABEL[milestone.status],
      tone: MILESTONE_TONE[milestone.status],
    },
    dueLabel: milestone.dueAt ? dateLabel(milestone.dueAt) : undefined,
  };
}

function toApprovalVm(approval: ResearchApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: {
      value: approval.status,
      label: APPROVAL_LABEL[approval.status],
      tone: APPROVAL_TONE[approval.status],
    },
    decidedLabel: approval.decidedAt ? dateLabel(approval.decidedAt) : undefined,
    rationale: approval.rationale,
  };
}

function toReviewVm(review: ResearchReview): ReviewVm {
  return {
    id: review.id,
    stageLabel: stageLabel(review.stage),
    reviewer: review.reviewer,
    status: {
      value: review.status,
      label: REVIEW_LABEL[review.status],
      tone: REVIEW_TONE[review.status],
    },
    note: review.note,
    reviewedLabel: review.reviewedAt ? dateLabel(review.reviewedAt) : undefined,
  };
}

function toSessionVm(session: ResearchSession): SessionVm {
  return {
    id: session.id,
    author: session.author,
    summary: session.summary,
    startedLabel: dateTimeLabel(session.startedAt),
    open: !session.endedAt,
  };
}

function toArtifactVm(artifact: ResearchArtifact): ArtifactVm {
  const base = ARTIFACT_ROUTE[artifact.kind];
  return {
    id: artifact.id,
    kind: artifact.kind,
    name: artifact.name,
    href: base === '#' ? '#' : `${base}/${artifact.ref}`,
    stageLabel: stageLabel(artifact.stage),
  };
}

export function toDetailVm(project: ResearchProject): ProjectDetailVm {
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    status: toStatusVm(project.status),
    progress: toProgressVm(project.stages),
    hypothesis: {
      statement: project.hypothesis.statement,
      prediction: project.hypothesis.prediction,
      successCriteria: project.hypothesis.successCriteria,
      preRegistered: project.hypothesis.preRegistered
        ? { value: 'true', label: 'Pre-registered', tone: 'positive' }
        : { value: 'false', label: 'Not pre-registered', tone: 'danger' },
      registeredLabel: project.hypothesis.registeredAt
        ? dateLabel(project.hypothesis.registeredAt)
        : undefined,
    },
    metadata: [
      { label: 'Owner', value: project.owner },
      { label: 'Team', value: project.team },
      { label: 'Template', value: project.templateId ?? '—' },
      { label: 'Version', value: project.version },
      { label: 'Created', value: dateLabel(project.createdAt) },
      { label: 'Updated', value: dateLabel(project.updatedAt) },
      ...project.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
    metrics: {
      openObjectives: String(
        project.objectives.filter((o) => o.status === 'OPEN' || o.status === 'IN_PROGRESS').length,
      ),
      artifacts: String(project.artifacts.length),
      sessions: String(project.sessions.length),
      reviewsPending: String(project.reviews.filter((r) => r.status === 'PENDING').length),
      ageDays: '—',
    } satisfies MetricsVm,
    stages: project.stages.map(toStageStepVm),
    objectives: project.objectives.map(toObjectiveVm),
    dependencies: project.dependencies.map(toDependencyVm),
    milestones: project.milestones.map(toMilestoneVm),
    approvals: project.approvals.map(toApprovalVm),
    reviews: project.reviews.map(toReviewVm),
    sessions: project.sessions.map(toSessionVm),
    artifacts: project.artifacts.map(toArtifactVm),
    tags: project.tags,
  };
}

export function toTemplateVm(template: ResearchTemplate): TemplateVm {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    stageLabels: template.stages.map(stageLabel),
    objectives: template.objectives,
  };
}

export function toSummaryVm(projects: readonly ResearchProject[]): ResearchSummaryVm {
  const stageCount = new Map<ResearchStage, number>();
  let awaitingApproval = 0;
  for (const project of projects) {
    const stage = currentStage(project.stages);
    stageCount.set(stage, (stageCount.get(stage) ?? 0) + 1);
    if (project.approvals.some((a) => a.status === 'PENDING')) awaitingApproval += 1;
  }
  const byStage: SummaryBucketVm[] = RESEARCH_STAGES.map((stage) => ({
    value: stage,
    label: stageLabel(stage),
    count: stageCount.get(stage) ?? 0,
    tone: 'info' as Tone,
  })).filter((bucket) => bucket.count > 0);

  return {
    totalProjects: projects.length,
    active: projects.filter((p) => p.status === 'ACTIVE').length,
    blocked: projects.filter((p) => p.status === 'BLOCKED').length,
    awaitingApproval,
    byStage,
  };
}
