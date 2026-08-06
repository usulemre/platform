/**
 * DTO → view-model mappings + summary/comparison aggregation. All presentation
 * and aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Stage labels/ordering, run-control predicates, the metric catalog
 * and the canonical key come from `@platform/backtesting-sdk`. Metric VALUES are
 * passed through unchanged — never computed; comparison is a pure lookup/reshape.
 */
import {
  BACKTEST_STAGES,
  canCancel,
  canPause,
  canResume,
  canRetry,
  compareVersions,
  backtestKey,
  describeMetric,
  describeStage,
  stageOrder,
  type ApprovalStatus,
  type Backtest,
  type BacktestApproval,
  type BacktestArtifact,
  type BacktestComparison,
  type BacktestDependency,
  type BacktestFamily,
  type BacktestMetric,
  type BacktestReview,
  type BacktestRun,
  type BacktestSession,
  type BacktestStage,
  type BacktestVersion,
  type DependencyKind,
  type DependencyStatus,
  type LineageNode,
  type LineageNodeKind,
  type MetricKey,
  type ReviewStatus,
  type RunStatus,
  type ScenarioKind,
  type ValidationStatus,
} from '@platform/backtesting-sdk';
import type {
  ApprovalVm,
  BacktestDetailVm,
  BacktestFamilyVm,
  BacktestListItemVm,
  BacktestingSummaryVm,
  ComparisonVm,
  DependencyVm,
  LineageVm,
  MetricVm,
  QueueItemVm,
  ReviewVm,
  RunControlVm,
  RunVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<BacktestStage, Tone> = {
  DRAFT: 'neutral',
  CONFIGURATION: 'info',
  VALIDATION: 'warning',
  QUEUED: 'info',
  RUNNING: 'info',
  COMPLETED: 'positive',
  REVIEW: 'warning',
  APPROVED: 'positive',
  ARCHIVED: 'neutral',
};

const RUN_LABEL: Record<RunStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};
const RUN_TONE: Record<RunStatus, Tone> = {
  QUEUED: 'info',
  RUNNING: 'info',
  PAUSED: 'warning',
  COMPLETED: 'positive',
  FAILED: 'danger',
  CANCELLED: 'neutral',
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

const SCENARIO_LABEL: Record<ScenarioKind, string> = {
  HISTORICAL: 'Historical',
  WALK_FORWARD: 'Walk-forward',
  ROLLING_WINDOW: 'Rolling window',
};

const DEP_ROUTE: Record<DependencyKind, string> = {
  DATASET: '/datasets',
  FEATURE: '/features',
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolios',
  EXPERIMENT: '/experiments',
};
const LINEAGE_ROUTE: Partial<Record<LineageNodeKind, string>> = {
  DATASET: '/datasets',
  FEATURE: '/features',
  SIGNAL: '/signals',
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolios',
  EXPERIMENT: '/experiments',
};

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: BacktestStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function runStatus(status: RunStatus): StatusVm {
  return { value: status, label: RUN_LABEL[status], tone: RUN_TONE[status] };
}

function toMetricVm(metric: BacktestMetric): MetricVm {
  const descriptor = describeMetric(metric.key);
  return {
    key: metric.key,
    label: descriptor?.label ?? metric.key,
    value: metric.value,
    unit: descriptor?.unit ?? '',
  };
}

function toProgressVm(backtest: Backtest): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = BACKTEST_STAGES.length;
  const completed = stageOrder(backtest.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(backtest.stage).label,
  };
}

function toStageSteps(backtest: Backtest): StageStepVm[] {
  const currentOrder = stageOrder(backtest.stage);
  const blocked = backtest.run.status === 'FAILED' || backtest.run.status === 'CANCELLED';
  return BACKTEST_STAGES.map((stage) => {
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

function toRunVm(run: BacktestRun): RunVm {
  return {
    id: run.id,
    status: runStatus(run.status),
    attempt: run.attempt,
    progressPercent: run.progress,
    startedLabel: run.startedAt ? dateTimeLabel(run.startedAt) : undefined,
    endedLabel: run.endedAt ? dateTimeLabel(run.endedAt) : undefined,
    note: run.note,
  };
}

function toRunControls(run: BacktestRun): RunControlVm[] {
  return [
    { control: 'pause', label: 'Pause', enabled: canPause(run.status) },
    { control: 'resume', label: 'Resume', enabled: canResume(run.status) },
    { control: 'cancel', label: 'Cancel', enabled: canCancel(run.status) },
    { control: 'retry', label: 'Retry', enabled: canRetry(run.status) },
  ];
}

function toDependencyVm(dependency: BacktestDependency): DependencyVm {
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

function toLineageVm(backtest: Backtest): LineageVm {
  const nodeHref = (node: LineageNode): string | undefined => {
    const base = LINEAGE_ROUTE[node.kind];
    return base ? `${base}/${node.ref}` : undefined;
  };
  return {
    nodes: backtest.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      href: nodeHref(node),
    })),
    edges: backtest.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function toArtifactVm(artifact: BacktestArtifact): { id: string; kind: string; name: string } {
  return { id: artifact.id, kind: artifact.kind.replace('_', ' '), name: artifact.name };
}

function toReviewVm(review: BacktestReview): ReviewVm {
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

function toApprovalVm(approval: BacktestApproval): ApprovalVm {
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

function toSessionVm(session: BacktestSession): {
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

function currentVersionString(backtest: Backtest): string {
  return (
    backtest.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || backtest.version
  );
}

function toVersionVm(version: BacktestVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

export function toListItemVm(backtest: Backtest): BacktestListItemVm {
  return {
    id: backtest.id,
    slug: backtest.slug,
    name: backtest.name,
    description: backtest.description,
    namespace: backtest.namespace,
    family: backtest.family,
    version: backtest.version,
    stage: stageStatus(backtest.stage),
    scenario: SCENARIO_LABEL[backtest.configuration.scenario.kind],
    run: runStatus(backtest.run.status),
    validation: {
      value: backtest.validation.status,
      label: VALIDATION_LABEL[backtest.validation.status],
      tone: VALIDATION_TONE[backtest.validation.status],
    },
    approval: {
      value: backtest.approval,
      label: APPROVAL_LABEL[backtest.approval],
      tone: APPROVAL_TONE[backtest.approval],
    },
    owner: backtest.owner.owner,
    tags: backtest.tags,
    updatedLabel: dateLabel(backtest.updatedAt) ?? '—',
  };
}

export function toDetailVm(backtest: Backtest): BacktestDetailVm {
  const currentValue = currentVersionString(backtest);
  const config = backtest.configuration;
  const links: { label: string; href: string }[] = [];
  if (backtest.experimentRef)
    links.push({ label: 'Experiment', href: `/experiments/${backtest.experimentRef}` });
  if (backtest.portfolioRef)
    links.push({ label: 'Portfolio', href: `/portfolios/${backtest.portfolioRef}` });

  return {
    id: backtest.id,
    slug: backtest.slug,
    name: backtest.name,
    description: backtest.description,
    namespace: backtest.namespace,
    family: backtest.family,
    key: backtestKey(backtest.namespace, backtest.family, backtest.name),
    version: backtest.version,
    stage: stageStatus(backtest.stage),
    progress: toProgressVm(backtest),
    stages: toStageSteps(backtest),
    run: toRunVm(backtest.run),
    runControls: toRunControls(backtest.run),
    configuration: {
      scenario: {
        kind: config.scenario.kind,
        label: config.scenario.label,
        window: config.scenario.window,
        description: config.scenario.description,
      },
      rows: [
        { label: 'Scenario', value: SCENARIO_LABEL[config.scenario.kind] },
        { label: 'Universe', value: config.universe },
        { label: 'Window', value: `${config.startDate} → ${config.endDate}` },
        { label: 'Frequency', value: config.frequency },
        { label: 'Cost model', value: config.costModel },
      ],
      parameterSets: config.parameterSets.map((set) => ({
        id: set.id,
        name: set.name,
        params: set.params.map((param) => ({ label: param.key, value: param.value })),
      })),
      notes: config.notes,
    },
    metrics: backtest.metrics.map(toMetricVm),
    validation: {
      status: {
        value: backtest.validation.status,
        label: VALIDATION_LABEL[backtest.validation.status],
        tone: VALIDATION_TONE[backtest.validation.status],
      },
      method: backtest.validation.method,
      checkedLabel: dateLabel(backtest.validation.checkedAt),
      note: backtest.validation.note,
    },
    approval: {
      value: backtest.approval,
      label: APPROVAL_LABEL[backtest.approval],
      tone: APPROVAL_TONE[backtest.approval],
    },
    sessions: backtest.sessions.map(toSessionVm),
    results: backtest.results.map((result) => ({
      id: result.id,
      parameterSetId: result.parameterSetId,
      summary: result.summary,
      metrics: result.metrics.map(toMetricVm),
    })),
    reports: backtest.reports.map((report) => ({
      id: report.id,
      title: report.title,
      ref: report.ref,
      generatedLabel: dateLabel(report.generatedAt) ?? '—',
      summary: report.summary,
    })),
    dependencies: backtest.dependencies.map(toDependencyVm),
    lineage: toLineageVm(backtest),
    artifacts: backtest.artifacts.map(toArtifactVm),
    reviews: backtest.reviews.map(toReviewVm),
    approvals: backtest.approvals.map(toApprovalVm),
    versions: [...backtest.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    owner: {
      owner: backtest.owner.owner,
      team: backtest.owner.team,
      steward: backtest.owner.steward,
    },
    links,
    tags: backtest.tags,
    metadata: [
      { label: 'Namespace', value: backtest.namespace },
      { label: 'Family', value: backtest.family },
      { label: 'Registry ref', value: backtest.registryRef },
      { label: 'Registered', value: dateLabel(backtest.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(backtest.updatedAt) ?? '—' },
      ...backtest.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: BacktestFamily): BacktestFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    backtestCount: family.backtestCount,
  };
}

function toQueueItemVm(backtest: Backtest, primary: StatusVm): QueueItemVm {
  return {
    id: backtest.id,
    name: backtest.name,
    namespace: backtest.namespace,
    family: backtest.family,
    stageLabel: describeStage(backtest.stage).label,
    primaryStatus: primary,
    progressPercent: backtest.run.progress,
    owner: backtest.owner.owner,
  };
}

/** Execution-queue row: primary status is the run state. */
export function toExecutionQueueItemVm(backtest: Backtest): QueueItemVm {
  return toQueueItemVm(backtest, runStatus(backtest.run.status));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(backtest: Backtest): QueueItemVm {
  return toQueueItemVm(backtest, {
    value: backtest.approval,
    label: APPROVAL_LABEL[backtest.approval],
    tone: APPROVAL_TONE[backtest.approval],
  });
}

export function toComparisonListItemVm(comparison: BacktestComparison): {
  id: string;
  name: string;
  note: string;
  backtestCount: number;
  metricCount: number;
  createdLabel: string;
} {
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    backtestCount: comparison.backtestIds.length,
    metricCount: comparison.metricKeys.length,
    createdLabel: dateLabel(comparison.createdAt) ?? '—',
  };
}

/**
 * Assemble a comparison view by pulling each backtest's supplied metric values.
 * PURE lookup + reshape — no metric is computed, ranked or scored.
 */
export function toComparisonVm(
  comparison: BacktestComparison,
  backtests: readonly Backtest[],
): ComparisonVm {
  const byId = new Map(backtests.map((backtest) => [backtest.id, backtest]));
  const metricColumns = comparison.metricKeys.map((key: MetricKey) => ({
    key,
    label: describeMetric(key)?.label ?? key,
  }));
  const rows = comparison.backtestIds.map((backtestId) => {
    const backtest = byId.get(backtestId);
    const values = new Map((backtest?.metrics ?? []).map((metric) => [metric.key, metric.value]));
    return {
      backtestId,
      backtestName: backtest?.name ?? backtestId,
      cells: comparison.metricKeys.map((key) => ({ key, value: values.get(key) ?? '—' })),
    };
  });
  return { id: comparison.id, name: comparison.name, note: comparison.note, metricColumns, rows };
}

export function toSummaryVm(
  backtests: readonly Backtest[],
  families: readonly BacktestFamily[],
  comparisonCount: number,
): BacktestingSummaryVm {
  const stageCount = new Map<BacktestStage, number>();
  for (const backtest of backtests)
    stageCount.set(backtest.stage, (stageCount.get(backtest.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = BACKTEST_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalBacktests: backtests.length,
    running: backtests.filter((b) => b.run.status === 'RUNNING').length,
    queued: backtests.filter((b) => b.run.status === 'QUEUED').length,
    awaitingApproval: backtests.filter((b) => b.approvals.some((a) => a.status === 'PENDING'))
      .length,
    failed: backtests.filter((b) => b.run.status === 'FAILED').length,
    comparisons: comparisonCount,
    families: families.length,
    byStage,
  };
}
