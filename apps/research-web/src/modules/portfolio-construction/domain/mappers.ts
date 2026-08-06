/**
 * DTO → view-model mappings + summary/comparison aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Stage labels/ordering, optimization-control predicates, the metric
 * catalog and the canonical key come from `@platform/portfolio-sdk`. Target weights,
 * constraint bounds and metric VALUES are passed through unchanged — never computed;
 * comparison is a pure lookup/reshape.
 */
import {
  PORTFOLIO_STAGES,
  canCancel,
  canRetry,
  compareVersions,
  describeMetric,
  describeStage,
  portfolioKey,
  stageOrder,
  type ApprovalStatus,
  type ConstraintStatus,
  type DependencyKind,
  type DependencyStatus,
  type LineageNode,
  type LineageNodeKind,
  type MetricKey,
  type OptimizationStatus,
  type Portfolio,
  type PortfolioApproval,
  type PortfolioArtifact,
  type PortfolioComparison,
  type PortfolioConstraint,
  type PortfolioDependency,
  type PortfolioFamily,
  type PortfolioHolding,
  type PortfolioMetric,
  type PortfolioOptimizationRequest,
  type PortfolioReview,
  type PortfolioSession,
  type PortfolioSignalSelection,
  type PortfolioStage,
  type PortfolioTemplate,
  type PortfolioVersion,
  type PositionSide,
  type ReviewStatus,
} from '@platform/portfolio-sdk';
import type {
  ApprovalVm,
  ComparisonVm,
  ConstraintVm,
  DependencyVm,
  HoldingVm,
  LineageVm,
  MetricVm,
  OptimizationRequestQueueItemVm,
  OptimizationRequestVm,
  PortfolioConstructionSummaryVm,
  PortfolioDetailVm,
  PortfolioFamilyVm,
  PortfolioListItemVm,
  PortfolioTemplateVm,
  QueueItemVm,
  ReviewVm,
  SignalSelectionVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<PortfolioStage, Tone> = {
  DRAFT: 'neutral',
  SIGNAL_SELECTION: 'info',
  CONSTRAINT_DEFINITION: 'info',
  ALLOCATION_CONFIGURATION: 'info',
  OPTIMIZATION_REQUEST: 'info',
  VALIDATION: 'warning',
  REVIEW: 'warning',
  APPROVAL: 'warning',
  PUBLISHED: 'positive',
  ARCHIVED: 'neutral',
};

const OPT_LABEL: Record<OptimizationStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};
const OPT_TONE: Record<OptimizationStatus, Tone> = {
  QUEUED: 'info',
  RUNNING: 'info',
  COMPLETED: 'positive',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

const VALIDATION_LABEL: Record<string, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};
const VALIDATION_TONE: Record<string, Tone> = {
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

const CONSTRAINT_LABEL: Record<ConstraintStatus, string> = {
  SATISFIED: 'Satisfied',
  VIOLATED: 'Violated',
  NOT_EVALUATED: 'Not evaluated',
};
const CONSTRAINT_TONE: Record<ConstraintStatus, Tone> = {
  SATISFIED: 'positive',
  VIOLATED: 'danger',
  NOT_EVALUATED: 'neutral',
};

const SIDE_TONE: Record<PositionSide, Tone> = { LONG: 'positive', SHORT: 'danger' };

const DEP_ROUTE: Record<DependencyKind, string> = {
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  FEATURE: '/features',
  DATASET: '/datasets',
  BACKTEST: '/backtesting',
  EXPERIMENT: '/experiments',
  RISK: '/risk',
};
const LINEAGE_ROUTE: Partial<Record<LineageNodeKind, string>> = {
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  FEATURE: '/features',
  DATASET: '/datasets',
  BACKTEST: '/backtesting',
  EXPERIMENT: '/experiments',
};

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: PortfolioStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function optimizationStatus(status: OptimizationStatus): StatusVm {
  return { value: status, label: OPT_LABEL[status], tone: OPT_TONE[status] };
}

function validationStatus(status: string): StatusVm {
  return {
    value: status,
    label: VALIDATION_LABEL[status] ?? status,
    tone: VALIDATION_TONE[status] ?? 'neutral',
  };
}

function approvalStatus(status: ApprovalStatus): StatusVm {
  return { value: status, label: APPROVAL_LABEL[status], tone: APPROVAL_TONE[status] };
}

function toMetricVm(metric: PortfolioMetric): MetricVm {
  const descriptor = describeMetric(metric.key);
  return {
    key: metric.key,
    label: descriptor?.label ?? metric.key,
    value: metric.value,
    unit: descriptor?.unit ?? '',
  };
}

function toProgressVm(portfolio: Portfolio): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = PORTFOLIO_STAGES.length;
  const completed = stageOrder(portfolio.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(portfolio.stage).label,
  };
}

function toStageSteps(portfolio: Portfolio): StageStepVm[] {
  const currentOrder = stageOrder(portfolio.stage);
  const blocked =
    portfolio.optimization.status === 'FAILED' || portfolio.optimization.status === 'CANCELLED';
  return PORTFOLIO_STAGES.map((stage) => {
    const order = stageOrder(stage);
    let state: StatusVm;
    if (order < currentOrder) state = { value: 'COMPLETE', label: 'Complete', tone: 'positive' };
    else if (order === currentOrder)
      state = blocked
        ? { value: 'BLOCKED', label: 'Blocked', tone: 'danger' }
        : { value: 'CURRENT', label: 'Current', tone: 'info' };
    else state = { value: 'PENDING', label: 'Pending', tone: 'neutral' };
    return { stage, label: describeStage(stage).label, state, gate: describeStage(stage).gate };
  });
}

function toOptimizationRequestVm(request: PortfolioOptimizationRequest): OptimizationRequestVm {
  return {
    id: request.id,
    status: optimizationStatus(request.status),
    objective: request.objective,
    attempt: request.attempt,
    progressPercent: request.progress,
    requestedLabel: request.requestedAt ? dateTimeLabel(request.requestedAt) : undefined,
    completedLabel: request.completedAt ? dateTimeLabel(request.completedAt) : undefined,
    note: request.note,
  };
}

function toSignalSelectionVm(selection: PortfolioSignalSelection): SignalSelectionVm {
  return {
    id: selection.id,
    name: selection.name,
    href: `/signals/${selection.ref}`,
    weightHint: selection.weightHint,
    status: {
      value: selection.status,
      label: DEP_LABEL[selection.status],
      tone: DEP_TONE[selection.status],
    },
  };
}

function toConstraintVm(constraint: PortfolioConstraint): ConstraintVm {
  return {
    id: constraint.id,
    kind: constraint.kind,
    label: constraint.label,
    bound: constraint.bound,
    status: {
      value: constraint.status,
      label: CONSTRAINT_LABEL[constraint.status],
      tone: CONSTRAINT_TONE[constraint.status],
    },
    note: constraint.note,
  };
}

function toHoldingVm(holding: PortfolioHolding): HoldingVm {
  return {
    id: holding.id,
    ref: holding.ref,
    name: holding.name,
    assetClass: holding.assetClass,
    side: {
      value: holding.side,
      label: holding.side === 'LONG' ? 'Long' : 'Short',
      tone: SIDE_TONE[holding.side],
    },
    targetWeight: holding.targetWeight,
  };
}

function toDependencyVm(dependency: PortfolioDependency): DependencyVm {
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

function toLineageVm(portfolio: Portfolio): LineageVm {
  const nodeHref = (node: LineageNode): string | undefined => {
    const base = LINEAGE_ROUTE[node.kind];
    return base ? `${base}/${node.ref}` : undefined;
  };
  return {
    nodes: portfolio.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      href: nodeHref(node),
    })),
    edges: portfolio.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function toArtifactVm(artifact: PortfolioArtifact): { id: string; kind: string; name: string } {
  return { id: artifact.id, kind: artifact.kind.replace('_', ' '), name: artifact.name };
}

function toReviewVm(review: PortfolioReview): ReviewVm {
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

function toApprovalVm(approval: PortfolioApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: approvalStatus(approval.status),
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
  };
}

function toSessionVm(session: PortfolioSession): {
  id: string;
  author: string;
  summary: string;
  startedLabel: string;
  open: boolean;
} {
  return {
    id: session.id,
    author: session.author,
    summary: session.summary,
    startedLabel: dateTimeLabel(session.startedAt),
    open: !session.endedAt,
  };
}

function currentVersionString(portfolio: Portfolio): string {
  return (
    portfolio.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || portfolio.version
  );
}

function toVersionVm(version: PortfolioVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

export function toListItemVm(portfolio: Portfolio): PortfolioListItemVm {
  return {
    id: portfolio.id,
    slug: portfolio.slug,
    name: portfolio.name,
    description: portfolio.description,
    namespace: portfolio.namespace,
    family: portfolio.family,
    version: portfolio.version,
    stage: stageStatus(portfolio.stage),
    allocationModel: portfolio.allocation.allocationModel,
    optimization: optimizationStatus(portfolio.optimization.status),
    validation: validationStatus(portfolio.validation.status),
    approval: approvalStatus(portfolio.approval),
    owner: portfolio.owner.owner,
    tags: portfolio.tags,
    updatedLabel: dateLabel(portfolio.updatedAt) ?? '—',
  };
}

export function toDetailVm(portfolio: Portfolio): PortfolioDetailVm {
  const currentValue = currentVersionString(portfolio);
  const allocation = portfolio.allocation;
  const links: { label: string; href: string }[] = [];
  if (portfolio.experimentRef)
    links.push({ label: 'Experiment', href: `/experiments/${portfolio.experimentRef}` });
  if (portfolio.backtestRef)
    links.push({ label: 'Backtest', href: `/backtesting/${portfolio.backtestRef}` });

  return {
    id: portfolio.id,
    slug: portfolio.slug,
    name: portfolio.name,
    description: portfolio.description,
    namespace: portfolio.namespace,
    family: portfolio.family,
    key: portfolioKey(portfolio.namespace, portfolio.family, portfolio.name),
    version: portfolio.version,
    stage: stageStatus(portfolio.stage),
    progress: toProgressVm(portfolio),
    stages: toStageSteps(portfolio),
    universe: {
      name: portfolio.universe.name,
      description: portfolio.universe.description,
      assetClasses: portfolio.universe.assetClasses,
      instrumentCount: portfolio.universe.instrumentCount,
    },
    signalSelection: portfolio.signalSelection.map(toSignalSelectionVm),
    constraints: portfolio.constraints.map(toConstraintVm),
    allocation: {
      rows: [
        { label: 'Allocation model', value: allocation.allocationModel },
        { label: 'Base currency', value: allocation.baseCurrency },
        { label: 'Rebalance', value: allocation.rebalanceFrequency },
        { label: 'Universe', value: portfolio.universe.name },
      ],
      holdings: allocation.holdings.map(toHoldingVm),
      notes: allocation.notes,
    },
    optimization: {
      id: portfolio.optimization.id,
      status: optimizationStatus(portfolio.optimization.status),
      objective: portfolio.optimization.objective,
      attempt: portfolio.optimization.attempt,
      progressPercent: portfolio.optimization.progress,
      requestedLabel: portfolio.optimization.requestedAt
        ? dateTimeLabel(portfolio.optimization.requestedAt)
        : undefined,
      completedLabel: portfolio.optimization.completedAt
        ? dateTimeLabel(portfolio.optimization.completedAt)
        : undefined,
      note: portfolio.optimization.note,
    },
    optimizationControls: [
      { control: 'cancel', label: 'Cancel', enabled: canCancel(portfolio.optimization.status) },
      { control: 'retry', label: 'Retry', enabled: canRetry(portfolio.optimization.status) },
    ],
    optimizationRequests: portfolio.optimizationRequests.map(toOptimizationRequestVm),
    metrics: portfolio.metrics.map(toMetricVm),
    validation: {
      status: validationStatus(portfolio.validation.status),
      method: portfolio.validation.method,
      checkedLabel: dateLabel(portfolio.validation.checkedAt),
      note: portfolio.validation.note,
    },
    approval: approvalStatus(portfolio.approval),
    sessions: portfolio.sessions.map(toSessionVm),
    dependencies: portfolio.dependencies.map(toDependencyVm),
    lineage: toLineageVm(portfolio),
    artifacts: portfolio.artifacts.map(toArtifactVm),
    reviews: portfolio.reviews.map(toReviewVm),
    approvals: portfolio.approvals.map(toApprovalVm),
    versions: [...portfolio.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    snapshots: portfolio.snapshots.map((snapshot) => ({
      version: snapshot.version,
      stage: stageStatus(snapshot.stage),
      capturedLabel: dateLabel(snapshot.capturedAt) ?? '—',
      manifestHash: snapshot.manifestHash,
    })),
    owner: {
      owner: portfolio.owner.owner,
      team: portfolio.owner.team,
      steward: portfolio.owner.steward,
    },
    templateLabel: portfolio.templateRef,
    links,
    tags: portfolio.tags,
    metadata: [
      { label: 'Namespace', value: portfolio.namespace },
      { label: 'Family', value: portfolio.family },
      { label: 'Registry ref', value: portfolio.registryRef },
      { label: 'Registered', value: dateLabel(portfolio.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(portfolio.updatedAt) ?? '—' },
      ...portfolio.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: PortfolioFamily): PortfolioFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    portfolioCount: family.portfolioCount,
  };
}

export function toTemplateVm(template: PortfolioTemplate): PortfolioTemplateVm {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    allocationModel: template.allocationModel,
    constraintKinds: template.constraintKinds,
  };
}

function toQueueItemVm(portfolio: Portfolio, primary: StatusVm): QueueItemVm {
  return {
    id: portfolio.id,
    name: portfolio.name,
    namespace: portfolio.namespace,
    family: portfolio.family,
    stageLabel: describeStage(portfolio.stage).label,
    primaryStatus: primary,
    progressPercent: portfolio.optimization.progress,
    owner: portfolio.owner.owner,
  };
}

/** Optimization-queue row: primary status is the optimization-request state. */
export function toOptimizationQueueItemVm(portfolio: Portfolio): QueueItemVm {
  return toQueueItemVm(portfolio, optimizationStatus(portfolio.optimization.status));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(portfolio: Portfolio): QueueItemVm {
  return toQueueItemVm(portfolio, approvalStatus(portfolio.approval));
}

/** Optimization-requests row: the current request plus its portfolio. */
export function toOptimizationRequestQueueItemVm(
  portfolio: Portfolio,
): OptimizationRequestQueueItemVm {
  return {
    id: portfolio.optimization.id,
    portfolioName: portfolio.name,
    namespace: portfolio.namespace,
    family: portfolio.family,
    objective: portfolio.optimization.objective,
    status: optimizationStatus(portfolio.optimization.status),
    progressPercent: portfolio.optimization.progress,
    owner: portfolio.owner.owner,
  };
}

export function toComparisonListItemVm(comparison: PortfolioComparison): {
  id: string;
  name: string;
  note: string;
  portfolioCount: number;
  metricCount: number;
  createdLabel: string;
} {
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    portfolioCount: comparison.portfolioIds.length,
    metricCount: comparison.metricKeys.length,
    createdLabel: dateLabel(comparison.createdAt) ?? '—',
  };
}

/**
 * Assemble a comparison view by pulling each portfolio's supplied metric values.
 * PURE lookup + reshape — no metric is computed, ranked or scored.
 */
export function toComparisonVm(
  comparison: PortfolioComparison,
  portfolios: readonly Portfolio[],
): ComparisonVm {
  const byId = new Map(portfolios.map((portfolio) => [portfolio.id, portfolio]));
  const metricColumns = comparison.metricKeys.map((key: MetricKey) => ({
    key,
    label: describeMetric(key)?.label ?? key,
  }));
  const rows = comparison.portfolioIds.map((portfolioId) => {
    const portfolio = byId.get(portfolioId);
    const values = new Map((portfolio?.metrics ?? []).map((metric) => [metric.key, metric.value]));
    return {
      portfolioId,
      portfolioName: portfolio?.name ?? portfolioId,
      cells: comparison.metricKeys.map((key) => ({ key, value: values.get(key) ?? '—' })),
    };
  });
  return { id: comparison.id, name: comparison.name, note: comparison.note, metricColumns, rows };
}

export function toSummaryVm(
  portfolios: readonly Portfolio[],
  families: readonly PortfolioFamily[],
  comparisonCount: number,
  templateCount: number,
): PortfolioConstructionSummaryVm {
  const stageCount = new Map<PortfolioStage, number>();
  for (const portfolio of portfolios)
    stageCount.set(portfolio.stage, (stageCount.get(portfolio.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = PORTFOLIO_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalPortfolios: portfolios.length,
    optimizing: portfolios.filter(
      (p) => p.optimization.status === 'RUNNING' || p.optimization.status === 'QUEUED',
    ).length,
    published: portfolios.filter((p) => p.stage === 'PUBLISHED' || p.stage === 'ARCHIVED').length,
    awaitingApproval: portfolios.filter((p) => p.approvals.some((a) => a.status === 'PENDING'))
      .length,
    failed: portfolios.filter((p) => p.optimization.status === 'FAILED').length,
    comparisons: comparisonCount,
    families: families.length,
    templates: templateCount,
    byStage,
  };
}
