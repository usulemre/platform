/**
 * DTO → view-model mappings + summary/comparison aggregation for the administrator
 * (admin-web) Execution Simulator module. The admin console does not deep-link into
 * research-web modules, so dependency/lineage cross-links render as plain labels. All presentation and aggregation decisions
 * live here so UI components stay logic-free. Pure and deterministic. Stage
 * labels/ordering, run-control predicates, the metric catalog and the canonical key come
 * from `@platform/execution-sdk`. Quantities, prices, exposures and metric VALUES are
 * passed through unchanged — never computed; comparison is a pure lookup/reshape.
 */
import {
  SIMULATION_STAGES,
  canCancel,
  canPause,
  canReplay,
  canResume,
  canRetry,
  compareVersions,
  describeMetric,
  describeStage,
  sessionKey,
  stageOrder,
  type ApprovalStatus,
  type DependencyStatus,
  type ExecutionApproval,
  type ExecutionFill,
  type ExecutionMetric,
  type ExecutionOrder,
  type ExecutionPosition,
  type ExecutionReplay,
  type ExecutionReport,
  type ExecutionReview,
  type ExecutionTimelineEvent,
  type MetricKey,
  type OrderStatus,
  type PositionSide,
  type ReviewStatus,
  type RunStatus,
  type SessionRun,
  type SimulationComparison,
  type SimulationFamily,
  type SimulationSession,
  type SimulationStage,
  type ExecutionDependency,
  type ExecutionVersion,
  type TimelineKind,
  type ValidationStatus,
} from '@platform/execution-sdk';
import type {
  ApprovalVm,
  ComparisonVm,
  DependencyVm,
  FillVm,
  LineageVm,
  MetricVm,
  OrderVm,
  PositionVm,
  QueueItemVm,
  ReportVm,
  ReviewVm,
  RunControlVm,
  RunVm,
  ScenarioTemplateVm,
  SessionDetailVm,
  SessionFamilyVm,
  SessionListItemVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  TimelineEventVm,
  Tone,
  ExecutionSimulatorSummaryVm,
  VersionVm,
} from './view-model';
import type { ScenarioTemplate } from '@platform/execution-sdk';

const STAGE_TONE: Record<SimulationStage, Tone> = {
  DRAFT: 'neutral',
  SCENARIO_CONFIGURATION: 'info',
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

const ORDER_LABEL: Record<OrderStatus, string> = {
  CREATED: 'Created',
  VALIDATED: 'Validated',
  QUEUED: 'Queued',
  SUBMITTED: 'Submitted',
  PARTIALLY_FILLED: 'Partially filled',
  FILLED: 'Filled',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};
const ORDER_TONE: Record<OrderStatus, Tone> = {
  CREATED: 'neutral',
  VALIDATED: 'info',
  QUEUED: 'info',
  SUBMITTED: 'info',
  PARTIALLY_FILLED: 'warning',
  FILLED: 'positive',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
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

const SIDE_TONE: Record<string, Tone> = {
  BUY: 'positive',
  SELL: 'danger',
  LONG: 'positive',
  SHORT: 'danger',
  FLAT: 'neutral',
};
const TIMELINE_TONE: Record<TimelineKind, Tone> = {
  SESSION: 'info',
  ORDER: 'warning',
  FILL: 'positive',
  POSITION: 'neutral',
};
const POSITION_LABEL: Record<PositionSide, string> = { LONG: 'Long', SHORT: 'Short', FLAT: 'Flat' };

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: SimulationStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function runStatus(status: RunStatus): StatusVm {
  return { value: status, label: RUN_LABEL[status], tone: RUN_TONE[status] };
}

function validationStatus(status: ValidationStatus): StatusVm {
  return { value: status, label: VALIDATION_LABEL[status], tone: VALIDATION_TONE[status] };
}

function approvalStatus(status: ApprovalStatus): StatusVm {
  return { value: status, label: APPROVAL_LABEL[status], tone: APPROVAL_TONE[status] };
}

function sideStatus(side: string): StatusVm {
  return {
    value: side,
    label: side.charAt(0) + side.slice(1).toLowerCase(),
    tone: SIDE_TONE[side] ?? 'neutral',
  };
}

function toMetricVm(metric: ExecutionMetric): MetricVm {
  const descriptor = describeMetric(metric.key);
  return {
    key: metric.key,
    label: descriptor?.label ?? metric.key,
    value: metric.value,
    unit: descriptor?.unit ?? '',
  };
}

function toProgressVm(session: SimulationSession): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = SIMULATION_STAGES.length;
  const completed = stageOrder(session.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(session.stage).label,
  };
}

function toStageSteps(session: SimulationSession): StageStepVm[] {
  const currentOrder = stageOrder(session.stage);
  const blocked = session.run.status === 'FAILED' || session.run.status === 'CANCELLED';
  return SIMULATION_STAGES.map((stage) => {
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

function toRunVm(run: SessionRun): RunVm {
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

function toRunControls(run: SessionRun): RunControlVm[] {
  return [
    { control: 'pause', label: 'Pause', enabled: canPause(run.status) },
    { control: 'resume', label: 'Resume', enabled: canResume(run.status) },
    { control: 'cancel', label: 'Cancel', enabled: canCancel(run.status) },
    { control: 'retry', label: 'Retry', enabled: canRetry(run.status) },
    { control: 'replay', label: 'Replay', enabled: canReplay(run.status) },
  ];
}

export function toOrderVm(order: ExecutionOrder): OrderVm {
  return {
    id: order.id,
    clientOrderId: order.clientOrderId,
    symbol: order.symbol,
    side: sideStatus(order.side),
    type: order.type.replace('_', ' '),
    quantity: order.quantity,
    limitPrice: order.limitPrice ?? '—',
    filledQuantity: order.filledQuantity,
    status: {
      value: order.status,
      label: ORDER_LABEL[order.status],
      tone: ORDER_TONE[order.status],
    },
    createdLabel: dateTimeLabel(order.createdAt),
  };
}

export function toFillVm(fill: ExecutionFill): FillVm {
  return {
    id: fill.id,
    orderId: fill.orderId,
    symbol: fill.symbol,
    side: sideStatus(fill.side),
    quantity: fill.quantity,
    price: fill.price,
    liquidity: fill.liquidity,
    venue: fill.venue,
    filledLabel: dateTimeLabel(fill.filledAt),
  };
}

export function toPositionVm(position: ExecutionPosition): PositionVm {
  return {
    id: position.id,
    symbol: position.symbol,
    side: {
      value: position.side,
      label: POSITION_LABEL[position.side],
      tone: SIDE_TONE[position.side] ?? 'neutral',
    },
    quantity: position.quantity,
    averagePrice: position.averagePrice,
    marketValue: position.marketValue,
  };
}

function toTimelineVm(event: ExecutionTimelineEvent): TimelineEventVm {
  return {
    id: event.id,
    kind: event.kind,
    label: event.label,
    detail: event.detail,
    atLabel: dateTimeLabel(event.at),
    tone: TIMELINE_TONE[event.kind],
  };
}

function toReplayVm(replay: ExecutionReplay): {
  id: string;
  status: StatusVm;
  note: string;
  createdLabel: string;
} {
  return {
    id: replay.id,
    status: runStatus(replay.status),
    note: replay.note,
    createdLabel: dateLabel(replay.createdAt) ?? '—',
  };
}

export function toReportVm(report: ExecutionReport): ReportVm {
  return {
    id: report.id,
    kind: report.kind.replace(/_/g, ' '),
    title: report.title,
    ref: report.ref,
    generatedLabel: dateLabel(report.generatedAt) ?? '—',
    summary: report.summary,
  };
}

function toReviewVm(review: ExecutionReview): ReviewVm {
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

export function toApprovalVm(approval: ExecutionApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: approvalStatus(approval.status),
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
  };
}

function toDependencyVm(dependency: ExecutionDependency): DependencyVm {
  return {
    id: dependency.id,
    kind: dependency.kind,
    name: dependency.name,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function toLineageVm(session: SimulationSession): LineageVm {
  return {
    nodes: session.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
    })),
    edges: session.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function currentVersionString(session: SimulationSession): string {
  return (
    session.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || session.version
  );
}

function toVersionVm(version: ExecutionVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

export function toListItemVm(session: SimulationSession): SessionListItemVm {
  return {
    id: session.id,
    slug: session.slug,
    name: session.name,
    description: session.description,
    namespace: session.namespace,
    family: session.family,
    version: session.version,
    stage: stageStatus(session.stage),
    run: runStatus(session.run.status),
    validation: validationStatus(session.validation.status),
    approval: approvalStatus(session.approval),
    owner: session.owner.owner,
    tags: session.tags,
    updatedLabel: dateLabel(session.updatedAt) ?? '—',
  };
}

export function toDetailVm(session: SimulationSession): SessionDetailVm {
  const currentValue = currentVersionString(session);
  const scenario = session.scenario;
  const portfolio = session.portfolio;
  const links: { label: string; href: string }[] = [];

  return {
    id: session.id,
    slug: session.slug,
    name: session.name,
    description: session.description,
    namespace: session.namespace,
    family: session.family,
    key: sessionKey(session.namespace, session.family, session.name),
    version: session.version,
    stage: stageStatus(session.stage),
    progress: toProgressVm(session),
    stages: toStageSteps(session),
    run: toRunVm(session.run),
    runControls: toRunControls(session.run),
    scenario: {
      label: scenario.label,
      rows: [
        { label: 'Universe', value: scenario.universe },
        { label: 'Window', value: `${scenario.startDate} → ${scenario.endDate}` },
        { label: 'Fill model', value: scenario.fillModel },
        { label: 'Venue model', value: scenario.venueModel },
        { label: 'Latency model', value: scenario.latencyModel },
      ],
      parameters: scenario.parameters.map((param) => ({ label: param.key, value: param.value })),
      notes: scenario.notes,
    },
    orders: session.orders.map(toOrderVm),
    fills: session.fills.map(toFillVm),
    positions: session.positions.map(toPositionVm),
    portfolio: {
      rows: [
        { label: 'Base currency', value: portfolio.baseCurrency },
        { label: 'Cash', value: portfolio.cash },
        { label: 'Equity', value: portfolio.equity },
        { label: 'Gross exposure', value: portfolio.grossExposure },
        { label: 'Net exposure', value: portfolio.netExposure },
        { label: 'Realized PnL', value: portfolio.realizedPnl },
        { label: 'Unrealized PnL', value: portfolio.unrealizedPnl },
      ],
    },
    timeline: session.timeline.map(toTimelineVm),
    replays: session.replays.map(toReplayVm),
    metrics: session.metrics.map(toMetricVm),
    validation: {
      status: validationStatus(session.validation.status),
      method: session.validation.method,
      checkedLabel: dateLabel(session.validation.checkedAt),
      note: session.validation.note,
    },
    approval: approvalStatus(session.approval),
    reviews: session.reviews.map(toReviewVm),
    approvals: session.approvals.map(toApprovalVm),
    reports: session.reports.map(toReportVm),
    artifacts: session.artifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.kind,
      name: artifact.name,
    })),
    dependencies: session.dependencies.map(toDependencyVm),
    lineage: toLineageVm(session),
    versions: [...session.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    snapshots: session.snapshots.map((snapshot) => ({
      version: snapshot.version,
      stage: stageStatus(snapshot.stage),
      capturedLabel: dateLabel(snapshot.capturedAt) ?? '—',
      manifestHash: snapshot.manifestHash,
    })),
    owner: { owner: session.owner.owner, team: session.owner.team, steward: session.owner.steward },
    templateLabel: session.templateRef,
    links,
    tags: session.tags,
    metadata: [
      { label: 'Namespace', value: session.namespace },
      { label: 'Family', value: session.family },
      { label: 'Registry ref', value: session.registryRef },
      { label: 'Registered', value: dateLabel(session.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(session.updatedAt) ?? '—' },
      ...session.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: SimulationFamily): SessionFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    sessionCount: family.sessionCount,
  };
}

export function toTemplateVm(template: ScenarioTemplate): ScenarioTemplateVm {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    fillModel: template.fillModel,
    venueModel: template.venueModel,
  };
}

function toQueueItemVm(session: SimulationSession, primary: StatusVm): QueueItemVm {
  return {
    id: session.id,
    name: session.name,
    namespace: session.namespace,
    family: session.family,
    stageLabel: describeStage(session.stage).label,
    primaryStatus: primary,
    progressPercent: session.run.progress,
    owner: session.owner.owner,
  };
}

/** Execution-queue row: primary status is the run state. */
export function toExecutionQueueItemVm(session: SimulationSession): QueueItemVm {
  return toQueueItemVm(session, runStatus(session.run.status));
}

/** Review-queue row: primary status is the session stage. */
export function toReviewQueueItemVm(session: SimulationSession): QueueItemVm {
  return toQueueItemVm(session, stageStatus(session.stage));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(session: SimulationSession): QueueItemVm {
  return toQueueItemVm(session, approvalStatus(session.approval));
}

export function toComparisonListItemVm(comparison: SimulationComparison): {
  id: string;
  name: string;
  note: string;
  sessionCount: number;
  metricCount: number;
  createdLabel: string;
} {
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    sessionCount: comparison.sessionIds.length,
    metricCount: comparison.metricKeys.length,
    createdLabel: dateLabel(comparison.createdAt) ?? '—',
  };
}

/**
 * Assemble a comparison view by pulling each session's supplied metric values. PURE
 * lookup + reshape — no metric is computed, ranked or scored.
 */
export function toComparisonVm(
  comparison: SimulationComparison,
  sessions: readonly SimulationSession[],
): ComparisonVm {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  const metricColumns = comparison.metricKeys.map((key: MetricKey) => ({
    key,
    label: describeMetric(key)?.label ?? key,
  }));
  const rows = comparison.sessionIds.map((sessionId) => {
    const session = byId.get(sessionId);
    const values = new Map((session?.metrics ?? []).map((metric) => [metric.key, metric.value]));
    return {
      sessionId,
      sessionName: session?.name ?? sessionId,
      cells: comparison.metricKeys.map((key) => ({ key, value: values.get(key) ?? '—' })),
    };
  });
  return { id: comparison.id, name: comparison.name, note: comparison.note, metricColumns, rows };
}

export function toSummaryVm(
  sessions: readonly SimulationSession[],
  familyCount: number,
  templateCount: number,
  comparisonCount: number,
): ExecutionSimulatorSummaryVm {
  const stageCount = new Map<SimulationStage, number>();
  for (const session of sessions)
    stageCount.set(session.stage, (stageCount.get(session.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = SIMULATION_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalSessions: sessions.length,
    running: sessions.filter((s) => s.run.status === 'RUNNING').length,
    queued: sessions.filter((s) => s.run.status === 'QUEUED').length,
    completed: sessions.filter(
      (s) =>
        s.stage === 'COMPLETED' ||
        s.stage === 'REVIEW' ||
        s.stage === 'APPROVED' ||
        s.stage === 'ARCHIVED',
    ).length,
    awaitingApproval: sessions.filter((s) => s.approvals.some((a) => a.status === 'PENDING'))
      .length,
    failed: sessions.filter((s) => s.run.status === 'FAILED').length,
    families: familyCount,
    templates: templateCount,
    comparisons: comparisonCount,
    byStage,
  };
}
