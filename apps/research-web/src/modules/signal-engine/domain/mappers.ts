/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Stage labels/ordering and the canonical key come from
 * `@platform/signal-sdk`. Progress is derived (stage position) — never a statistic.
 */
import {
  SIGNAL_STAGES,
  compareVersions,
  describeStage,
  signalKey,
  stageOrder,
  type ApprovalStatus,
  type DependencyKind,
  type DependencyStatus,
  type HealthStatus,
  type LineageNode,
  type LineageNodeKind,
  type PromotionStatus,
  type QualityGrade,
  type RegisteredSignal,
  type ReviewStatus,
  type SignalApproval,
  type SignalDependency,
  type SignalDirection,
  type SignalFamily,
  type SignalReview,
  type SignalStage,
  type SignalVersion,
  type SyncStatus,
  type ValidationStatus,
} from '@platform/signal-sdk';
import type {
  ApprovalVm,
  DependencyVm,
  LineageVm,
  ProgressVm,
  QueueItemVm,
  ReviewVm,
  SignalCatalogItemVm,
  SignalDetailVm,
  SignalEngineSummaryVm,
  SignalFamilyVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<SignalStage, Tone> = {
  CANDIDATE: 'neutral',
  RESEARCH: 'info',
  VALIDATION: 'warning',
  REVIEW: 'warning',
  APPROVAL: 'warning',
  REGISTRY: 'info',
  PRODUCTION_CANDIDATE: 'positive',
};

const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};
const VALIDATION_TONE: Record<ValidationStatus, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUESTED: 'Not requested',
};
const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  NOT_REQUESTED: 'neutral',
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

const PROMOTION_LABEL: Record<PromotionStatus, string> = {
  NOT_QUEUED: 'Not queued',
  QUEUED: 'Queued',
  PROMOTED: 'Promoted',
  BLOCKED: 'Blocked',
};
const PROMOTION_TONE: Record<PromotionStatus, Tone> = {
  NOT_QUEUED: 'neutral',
  QUEUED: 'warning',
  PROMOTED: 'positive',
  BLOCKED: 'danger',
};

const QUALITY_LABEL: Record<QualityGrade, string> = { PASS: 'Pass', WARN: 'Warn', FAIL: 'Fail' };
const QUALITY_TONE: Record<QualityGrade, Tone> = {
  PASS: 'positive',
  WARN: 'warning',
  FAIL: 'danger',
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  STALE: 'Stale',
  UNKNOWN: 'Unknown',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'danger',
  STALE: 'warning',
  UNKNOWN: 'neutral',
};

const SYNC_LABEL: Record<SyncStatus, string> = {
  SYNCED: 'Synced',
  PENDING: 'Pending',
  DRIFTED: 'Drifted',
  ERROR: 'Error',
};
const SYNC_TONE: Record<SyncStatus, Tone> = {
  SYNCED: 'positive',
  PENDING: 'warning',
  DRIFTED: 'warning',
  ERROR: 'danger',
};

const DEP_LABEL: Record<DependencyStatus, string> = {
  SATISFIED: 'Satisfied',
  PENDING: 'Pending',
  MISSING: 'Missing',
};
const DEP_TONE: Record<DependencyStatus, Tone> = {
  SATISFIED: 'positive',
  PENDING: 'warning',
  MISSING: 'danger',
};

const DIRECTION_LABEL: Record<SignalDirection, string> = {
  LONG_SHORT: 'Long / short',
  LONG_ONLY: 'Long only',
  DIRECTIONAL: 'Directional',
  MARKET_NEUTRAL: 'Market neutral',
};

const DEP_ROUTE: Record<DependencyKind, string> = {
  FEATURE: '/features',
  DATASET: '/datasets',
  SIGNAL: '/signals',
};
const LINEAGE_ROUTE: Partial<Record<LineageNodeKind, string>> = {
  FEATURE: '/features',
  DATASET: '/datasets',
  SIGNAL: '/signals',
};

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function stageStatus(stage: SignalStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function toProgressVm(signal: RegisteredSignal): ProgressVm {
  const total = SIGNAL_STAGES.length;
  const completed = stageOrder(signal.stage) + 1;
  const percentValue = Math.round((completed / total) * 100);
  return {
    percent: percentValue,
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(signal.stage).label,
  };
}

function toStageSteps(signal: RegisteredSignal): StageStepVm[] {
  const currentOrder = stageOrder(signal.stage);
  const blocked = signal.validation.status === 'FAILED' || signal.promotion.status === 'BLOCKED';
  return SIGNAL_STAGES.map((stage) => {
    const order = stageOrder(stage);
    let state: StatusVm;
    if (order < currentOrder) state = { value: 'COMPLETE', label: 'Complete', tone: 'positive' };
    else if (order === currentOrder)
      state = blocked
        ? { value: 'BLOCKED', label: 'Blocked', tone: 'danger' }
        : { value: 'IN_PROGRESS', label: 'In progress', tone: 'info' };
    else state = { value: 'PENDING', label: 'Pending', tone: 'neutral' };
    return { stage, label: describeStage(stage).label, state, gate: describeStage(stage).gate };
  });
}

function currentVersionString(signal: RegisteredSignal): string {
  return (
    signal.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || signal.version
  );
}

function toVersionVm(version: SignalVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

function toDependencyVm(dependency: SignalDependency): DependencyVm {
  return {
    id: dependency.id,
    kind: dependency.kind,
    name: dependency.name,
    href: `${DEP_ROUTE[dependency.kind]}/${dependency.ref}`,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function toLineageVm(signal: RegisteredSignal): LineageVm {
  const nodeHref = (node: LineageNode): string | undefined => {
    const base = LINEAGE_ROUTE[node.kind];
    return base ? `${base}/${node.ref}` : undefined;
  };
  return {
    nodes: signal.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      href: nodeHref(node),
    })),
    edges: signal.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function toApprovalVm(approval: SignalApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: {
      value: approval.status,
      label: APPROVAL_LABEL[approval.status],
      tone: APPROVAL_TONE[approval.status],
    },
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
  };
}

function toReviewVm(review: SignalReview): ReviewVm {
  return {
    id: review.id,
    reviewer: review.reviewer,
    stageLabel: describeStage(review.stage).label,
    status: {
      value: review.status,
      label: REVIEW_LABEL[review.status],
      tone: REVIEW_TONE[review.status],
    },
    note: review.note,
    reviewedLabel: dateLabel(review.reviewedAt),
  };
}

export function toCatalogItemVm(signal: RegisteredSignal): SignalCatalogItemVm {
  return {
    id: signal.id,
    slug: signal.slug,
    name: signal.name,
    description: signal.description,
    namespace: signal.namespace,
    family: signal.family,
    version: signal.version,
    stage: stageStatus(signal.stage),
    validation: {
      value: signal.validation.status,
      label: VALIDATION_LABEL[signal.validation.status],
      tone: VALIDATION_TONE[signal.validation.status],
    },
    approval: {
      value: signal.approval,
      label: APPROVAL_LABEL[signal.approval],
      tone: APPROVAL_TONE[signal.approval],
    },
    promotion: {
      value: signal.promotion.status,
      label: PROMOTION_LABEL[signal.promotion.status],
      tone: PROMOTION_TONE[signal.promotion.status],
    },
    quality: {
      value: signal.quality.grade,
      label: QUALITY_LABEL[signal.quality.grade],
      tone: QUALITY_TONE[signal.quality.grade],
    },
    health: {
      value: signal.health.status,
      label: HEALTH_LABEL[signal.health.status],
      tone: HEALTH_TONE[signal.health.status],
    },
    owner: signal.owner.owner,
    tags: signal.tags,
    updatedLabel: dateLabel(signal.updatedAt) ?? '—',
  };
}

export function toDetailVm(signal: RegisteredSignal): SignalDetailVm {
  const currentValue = currentVersionString(signal);
  return {
    id: signal.id,
    slug: signal.slug,
    name: signal.name,
    description: signal.description,
    namespace: signal.namespace,
    family: signal.family,
    key: signalKey(signal.namespace, signal.family, signal.name),
    version: signal.version,
    stage: stageStatus(signal.stage),
    progress: toProgressVm(signal),
    stages: toStageSteps(signal),
    validation: {
      status: {
        value: signal.validation.status,
        label: VALIDATION_LABEL[signal.validation.status],
        tone: VALIDATION_TONE[signal.validation.status],
      },
      method: signal.validation.method,
      checkedLabel: dateLabel(signal.validation.checkedAt),
      note: signal.validation.note,
    },
    approval: {
      value: signal.approval,
      label: APPROVAL_LABEL[signal.approval],
      tone: APPROVAL_TONE[signal.approval],
    },
    promotion: {
      status: {
        value: signal.promotion.status,
        label: PROMOTION_LABEL[signal.promotion.status],
        tone: PROMOTION_TONE[signal.promotion.status],
      },
      target: signal.promotion.target,
      queuedLabel: dateLabel(signal.promotion.queuedAt),
      promotedLabel: dateLabel(signal.promotion.promotedAt),
    },
    quality: {
      grade: {
        value: signal.quality.grade,
        label: QUALITY_LABEL[signal.quality.grade],
        tone: QUALITY_TONE[signal.quality.grade],
      },
      coverage: percent(signal.quality.coverage),
      stability: percent(signal.quality.stability),
      checkedLabel: dateLabel(signal.quality.checkedAt),
    },
    health: {
      status: {
        value: signal.health.status,
        label: HEALTH_LABEL[signal.health.status],
        tone: HEALTH_TONE[signal.health.status],
      },
      message: signal.health.message,
      refreshedLabel: dateLabel(signal.health.lastRefreshedAt),
    },
    sync: {
      status: {
        value: signal.sync.status,
        label: SYNC_LABEL[signal.sync.status],
        tone: SYNC_TONE[signal.sync.status],
      },
      registryRef: signal.sync.registryRef,
      syncedLabel: dateLabel(signal.sync.lastSyncedAt),
    },
    owner: { owner: signal.owner.owner, team: signal.owner.team, steward: signal.owner.steward },
    usage: {
      strategies: signal.usage.strategies,
      backtests: signal.usage.backtests,
      portfolios: signal.usage.portfolios,
      lastAccessedLabel: dateLabel(signal.usage.lastAccessedAt),
    },
    definition: {
      entity: signal.definition.entity,
      horizon: signal.definition.horizon,
      direction: DIRECTION_LABEL[signal.definition.direction],
      rationale: signal.definition.rationale,
      features: signal.definition.featureRefs.map((ref) => ({ ref, href: `/features/${ref}` })),
    },
    versions: [...signal.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    dependencies: signal.dependencies.map(toDependencyVm),
    lineage: toLineageVm(signal),
    approvals: signal.approvals.map(toApprovalVm),
    reviews: signal.reviews.map(toReviewVm),
    tags: signal.tags,
    metadata: [
      { label: 'Namespace', value: signal.namespace },
      { label: 'Family', value: signal.family },
      { label: 'Entity', value: signal.definition.entity },
      { label: 'Horizon', value: signal.definition.horizon },
      { label: 'Direction', value: DIRECTION_LABEL[signal.definition.direction] },
      { label: 'Registry ref', value: signal.registryRef },
      { label: 'Registered', value: dateLabel(signal.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(signal.updatedAt) ?? '—' },
      ...signal.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: SignalFamily): SignalFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    signalCount: family.signalCount,
  };
}

/** Promotion-queue row: primary status is the promotion state. */
export function toPromotionQueueItemVm(signal: RegisteredSignal): QueueItemVm {
  return {
    id: signal.id,
    name: signal.name,
    namespace: signal.namespace,
    family: signal.family,
    stageLabel: describeStage(signal.stage).label,
    primaryStatus: {
      value: signal.promotion.status,
      label: PROMOTION_LABEL[signal.promotion.status],
      tone: PROMOTION_TONE[signal.promotion.status],
    },
    owner: signal.owner.owner,
  };
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(signal: RegisteredSignal): QueueItemVm {
  return {
    id: signal.id,
    name: signal.name,
    namespace: signal.namespace,
    family: signal.family,
    stageLabel: describeStage(signal.stage).label,
    primaryStatus: {
      value: signal.approval,
      label: APPROVAL_LABEL[signal.approval],
      tone: APPROVAL_TONE[signal.approval],
    },
    owner: signal.owner.owner,
  };
}

export function toSummaryVm(
  signals: readonly RegisteredSignal[],
  families: readonly SignalFamily[],
): SignalEngineSummaryVm {
  const stageCount = new Map<SignalStage, number>();
  for (const signal of signals)
    stageCount.set(signal.stage, (stageCount.get(signal.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = SIGNAL_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalSignals: signals.length,
    production: signals.filter((s) => s.stage === 'PRODUCTION_CANDIDATE').length,
    awaitingValidation: signals.filter(
      (s) => s.validation.status === 'PENDING' || s.validation.status === 'NOT_RUN',
    ).length,
    awaitingApproval: signals.filter((s) => s.approvals.some((a) => a.status === 'PENDING')).length,
    queuedForPromotion: signals.filter((s) => s.promotion.status === 'QUEUED').length,
    qualityWarnings: signals.filter((s) => s.quality.grade !== 'PASS').length,
    syncDrift: signals.filter((s) => s.sync.status === 'DRIFTED' || s.sync.status === 'ERROR')
      .length,
    families: families.length,
    byStage,
  };
}
