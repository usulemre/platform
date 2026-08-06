/**
 * DTO → view-model mappings + summary/comparison aggregation for the administrator (admin-web)
 * Performance Analytics module. The admin console does not deep-link into research-web modules,
 * so dependency/subject cross-links render as plain labels. All presentation and aggregation decisions live here so UI
 * components stay logic-free. Pure and deterministic. Stage labels/ordering, the metric
 * catalog (definitions only) and the canonical key come from `@platform/performance-sdk`.
 * Metric VALUES, series points and benchmark values are passed through unchanged — never
 * computed; comparison is a pure lookup/reshape. Series `percent` is presentation-only scaling
 * of an already-supplied value (like a progress bar), never a metric calculation.
 */
import {
  METRIC_CATEGORIES,
  REPORT_STAGES,
  compareVersions,
  describeCategory,
  describeMetric,
  describeStage,
  reportKey,
  stageOrder,
  type ApprovalStatus,
  type Benchmark,
  type BenchmarkComparison,
  type ComputationStatus,
  type DependencyStatus,
  type MetricCategory,
  type MetricDefinition,
  type PerformanceApproval,
  type PerformanceComparison,
  type PerformanceDependency,
  type PerformanceReport,
  type PerformanceReview,
  type PerformanceSeries,
  type PerformanceTimelineEvent,
  type ReportFamily,
  type ReportStage,
  type ReportVersion,
  type ReviewStatus,
  type SubjectKind,
  type TimelineKind,
  type ValidationStatus,
} from '@platform/performance-sdk';
import type {
  ApprovalVm,
  BenchmarkVm,
  ComparisonVm,
  DependencyVm,
  MetricCategoryGroupVm,
  MetricGroupVm,
  MetricVm,
  PerformanceSummaryVm,
  QueueItemVm,
  ReportDetailVm,
  ReportFamilyVm,
  ReportListItemVm,
  ReviewVm,
  SeriesVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  TimelineEventVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<ReportStage, Tone> = {
  DRAFT: 'neutral',
  REQUESTED: 'info',
  COMPUTED: 'info',
  REVIEW: 'warning',
  APPROVED: 'positive',
  PUBLISHED: 'positive',
  ARCHIVED: 'neutral',
};

const COMPUTATION_LABEL: Record<ComputationStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};
const COMPUTATION_TONE: Record<ComputationStatus, Tone> = {
  PENDING: 'neutral',
  RUNNING: 'info',
  COMPLETED: 'positive',
  FAILED: 'danger',
};

const SUBJECT_LABEL: Record<SubjectKind, string> = {
  STRATEGY: 'Strategy',
  PORTFOLIO: 'Portfolio',
  BACKTEST: 'Backtest',
  LIVE_SESSION: 'Live session',
  SIMULATION: 'Simulation',
};
const SUBJECT_TONE: Record<SubjectKind, Tone> = {
  STRATEGY: 'info',
  PORTFOLIO: 'info',
  BACKTEST: 'neutral',
  LIVE_SESSION: 'danger',
  SIMULATION: 'warning',
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

const TIMELINE_TONE: Record<TimelineKind, Tone> = {
  REPORT: 'info',
  COMPUTATION: 'info',
  REVIEW: 'warning',
  APPROVAL: 'positive',
  SNAPSHOT: 'neutral',
};

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: ReportStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function computationStatus(status: ComputationStatus): StatusVm {
  return { value: status, label: COMPUTATION_LABEL[status], tone: COMPUTATION_TONE[status] };
}

function subjectStatus(kind: SubjectKind): StatusVm {
  return { value: kind, label: SUBJECT_LABEL[kind], tone: SUBJECT_TONE[kind] };
}

function validationStatus(status: ValidationStatus): StatusVm {
  return { value: status, label: VALIDATION_LABEL[status], tone: VALIDATION_TONE[status] };
}

function approvalStatus(status: ApprovalStatus): StatusVm {
  return { value: status, label: APPROVAL_LABEL[status], tone: APPROVAL_TONE[status] };
}

function toProgressVm(report: PerformanceReport): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = REPORT_STAGES.length;
  const completed = stageOrder(report.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(report.stage).label,
  };
}

function toStageSteps(report: PerformanceReport): StageStepVm[] {
  const currentOrder = stageOrder(report.stage);
  const blocked = report.computation === 'FAILED';
  return REPORT_STAGES.map((stage) => {
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

/** Group a report's metric VALUES by their catalog category (definitions from the SDK). */
function toMetricGroups(report: PerformanceReport): MetricGroupVm[] {
  const byCategory = new Map<MetricCategory, MetricVm[]>();
  for (const metric of report.metrics) {
    const definition = describeMetric(metric.key);
    if (!definition) continue;
    const vm: MetricVm = {
      key: metric.key,
      label: definition.label,
      value: metric.value,
      unit: definition.unit,
      category: definition.category,
      definitionVersion: metric.definitionVersion,
    };
    const list = byCategory.get(definition.category) ?? [];
    list.push(vm);
    byCategory.set(definition.category, list);
  }
  return METRIC_CATEGORIES.filter((category) => byCategory.has(category.category)).map(
    (category) => ({
      category: category.category,
      label: category.label,
      metrics: byCategory.get(category.category) ?? [],
    }),
  );
}

/** Parse a leading numeric magnitude from an inert value for presentation-only bar scaling. */
function magnitude(value: string): number {
  const match = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Math.abs(Number.parseFloat(match[0])) : 0;
}

function toSeriesVm(series: PerformanceSeries): SeriesVm {
  const max = series.points.reduce((best, point) => Math.max(best, magnitude(point.value)), 0) || 1;
  return {
    id: series.id,
    label: series.label,
    unit: series.unit,
    points: series.points.map((point) => ({
      t: point.t.slice(0, 10),
      value: point.value,
      percent: Math.round((magnitude(point.value) / max) * 100),
    })),
  };
}

function toBenchmarkVm(benchmark: BenchmarkComparison): BenchmarkVm {
  return {
    id: benchmark.id,
    name: benchmark.benchmark.name,
    kind: benchmark.benchmark.kind.replace('_', ' '),
    note: benchmark.note,
    rows: benchmark.rows.map((row) => ({
      key: row.key,
      label: describeMetric(row.key)?.label ?? row.key,
      subjectValue: row.subjectValue,
      benchmarkValue: row.benchmarkValue,
    })),
  };
}

function toReviewVm(review: PerformanceReview): ReviewVm {
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

export function toApprovalVm(approval: PerformanceApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: approvalStatus(approval.status),
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
  };
}

function toTimelineVm(event: PerformanceTimelineEvent): TimelineEventVm {
  return {
    id: event.id,
    kind: event.kind,
    label: event.label,
    detail: event.detail,
    atLabel: dateTimeLabel(event.at),
    tone: TIMELINE_TONE[event.kind],
  };
}

function toDependencyVm(dependency: PerformanceDependency): DependencyVm {
  return {
    id: dependency.id,
    kind: dependency.kind.replace('_', ' '),
    name: dependency.name,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function currentVersionString(report: PerformanceReport): string {
  return (
    report.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || report.version
  );
}

function toVersionVm(version: ReportVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

function overallApprovalStatus(report: PerformanceReport): ApprovalStatus {
  if (report.approvals.length === 0) return 'NOT_REQUESTED';
  if (report.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (report.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (report.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}

export function toListItemVm(report: PerformanceReport): ReportListItemVm {
  return {
    id: report.id,
    slug: report.slug,
    name: report.name,
    description: report.description,
    namespace: report.namespace,
    family: report.family,
    version: report.version,
    stage: stageStatus(report.stage),
    computation: computationStatus(report.computation),
    subject: subjectStatus(report.subjectKind),
    subjectName: report.subjectName,
    validation: validationStatus(report.validation.status),
    approval: approvalStatus(overallApprovalStatus(report)),
    owner: report.owner.owner,
    tags: report.tags,
    updatedLabel: dateLabel(report.updatedAt) ?? '—',
  };
}

export function toDetailVm(report: PerformanceReport): ReportDetailVm {
  const currentValue = currentVersionString(report);
  return {
    id: report.id,
    slug: report.slug,
    name: report.name,
    description: report.description,
    namespace: report.namespace,
    family: report.family,
    key: reportKey(report.namespace, report.family, report.name),
    version: report.version,
    stage: stageStatus(report.stage),
    computation: computationStatus(report.computation),
    subject: { kind: subjectStatus(report.subjectKind), name: report.subjectName },
    window: report.window,
    progress: toProgressVm(report),
    stages: toStageSteps(report),
    metricGroups: toMetricGroups(report),
    series: report.series.map(toSeriesVm),
    benchmark: report.benchmark ? toBenchmarkVm(report.benchmark) : undefined,
    validation: {
      status: validationStatus(report.validation.status),
      method: report.validation.method,
      checkedLabel: dateLabel(report.validation.checkedAt),
      note: report.validation.note,
    },
    approval: approvalStatus(overallApprovalStatus(report)),
    reviews: report.reviews.map(toReviewVm),
    approvals: report.approvals.map(toApprovalVm),
    artifacts: report.artifacts.map((artifact) => ({
      id: artifact.id,
      kind: artifact.kind,
      name: artifact.name,
    })),
    timeline: [...report.timeline].sort((a, b) => b.at.localeCompare(a.at)).map(toTimelineVm),
    dependencies: report.dependencies.map(toDependencyVm),
    versions: [...report.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    snapshots: report.snapshots.map((snapshot) => ({
      version: snapshot.version,
      stage: stageStatus(snapshot.stage),
      capturedLabel: dateLabel(snapshot.capturedAt) ?? '—',
      manifestHash: snapshot.manifestHash,
    })),
    owner: { owner: report.owner.owner, team: report.owner.team, steward: report.owner.steward },
    tags: report.tags,
    metadata: [
      { label: 'Namespace', value: report.namespace },
      { label: 'Family', value: report.family },
      { label: 'Subject', value: `${SUBJECT_LABEL[report.subjectKind]} · ${report.subjectName}` },
      { label: 'Window', value: report.window },
      { label: 'Registry ref', value: report.registryRef },
      { label: 'Registered', value: dateLabel(report.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(report.updatedAt) ?? '—' },
      ...report.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: ReportFamily): ReportFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    reportCount: family.reportCount,
  };
}

/** Group the metric catalog definitions by category (definitions only — nothing computed). */
export function toMetricCatalogVm(
  definitions: readonly MetricDefinition[],
): MetricCategoryGroupVm[] {
  return METRIC_CATEGORIES.map((category) => ({
    category: category.category,
    label: category.label,
    description: category.description,
    definitions: definitions
      .filter((definition) => definition.category === category.category)
      .map((definition) => ({
        key: definition.key,
        label: definition.label,
        category: definition.category,
        categoryLabel: category.label,
        unit: definition.unit,
        description: definition.description,
        formulaDescription: definition.formulaDescription,
        higherIsBetter: definition.higherIsBetter,
        version: definition.version,
      })),
  })).filter((group) => group.definitions.length > 0);
}

export function toMetricDefinitionVm(definition: MetricDefinition): {
  key: string;
  label: string;
  category: string;
  categoryLabel: string;
  unit: string;
  description: string;
  formulaDescription: string;
  higherIsBetter: boolean;
  version: string;
} {
  return {
    key: definition.key,
    label: definition.label,
    category: definition.category,
    categoryLabel: describeCategory(definition.category)?.label ?? definition.category,
    unit: definition.unit,
    description: definition.description,
    formulaDescription: definition.formulaDescription,
    higherIsBetter: definition.higherIsBetter,
    version: definition.version,
  };
}

export function toBenchmarkListVm(benchmark: Benchmark): {
  id: string;
  name: string;
  kind: string;
  ref: string;
  description: string;
} {
  return {
    id: benchmark.id,
    name: benchmark.name,
    kind: benchmark.kind.replace('_', ' '),
    ref: benchmark.ref,
    description: benchmark.description,
  };
}

function toQueueItemVm(report: PerformanceReport, primary: StatusVm): QueueItemVm {
  return {
    id: report.id,
    name: report.name,
    namespace: report.namespace,
    family: report.family,
    subjectName: report.subjectName,
    stageLabel: describeStage(report.stage).label,
    primaryStatus: primary,
    owner: report.owner.owner,
  };
}

/** Review-queue row: primary status is the report stage. */
export function toReviewQueueItemVm(report: PerformanceReport): QueueItemVm {
  return toQueueItemVm(report, stageStatus(report.stage));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(report: PerformanceReport): QueueItemVm {
  return toQueueItemVm(report, approvalStatus(overallApprovalStatus(report)));
}

/** Subject-report row: primary status is the computation state. */
export function toSubjectItemVm(report: PerformanceReport): QueueItemVm {
  return toQueueItemVm(report, computationStatus(report.computation));
}

export function toComparisonListItemVm(comparison: PerformanceComparison): {
  id: string;
  name: string;
  kind: string;
  note: string;
  reportCount: number;
  metricCount: number;
  createdLabel: string;
} {
  return {
    id: comparison.id,
    name: comparison.name,
    kind: comparison.kind,
    note: comparison.note,
    reportCount: comparison.reportIds.length,
    metricCount: comparison.metricKeys.length,
    createdLabel: dateLabel(comparison.createdAt) ?? '—',
  };
}

/**
 * Assemble a comparison view by pulling each report's supplied metric values. PURE lookup +
 * reshape — no metric is computed, ranked or scored.
 */
export function toComparisonVm(
  comparison: PerformanceComparison,
  reports: readonly PerformanceReport[],
): ComparisonVm {
  const byId = new Map(reports.map((report) => [report.id, report]));
  const metricColumns = comparison.metricKeys.map((key) => ({
    key,
    label: describeMetric(key)?.label ?? key,
  }));
  const rows = comparison.reportIds.map((reportId) => {
    const report = byId.get(reportId);
    const values = new Map((report?.metrics ?? []).map((metric) => [metric.key, metric.value]));
    return {
      reportId,
      reportName: report?.name ?? reportId,
      cells: comparison.metricKeys.map((key) => ({ key, value: values.get(key) ?? '—' })),
    };
  });
  return { id: comparison.id, name: comparison.name, note: comparison.note, metricColumns, rows };
}

export function toSummaryVm(
  reports: readonly PerformanceReport[],
  familyCount: number,
  comparisonCount: number,
  metricCount: number,
): PerformanceSummaryVm {
  const stageCount = new Map<ReportStage, number>();
  for (const report of reports)
    stageCount.set(report.stage, (stageCount.get(report.stage) ?? 0) + 1);
  const subjectCount = new Map<SubjectKind, number>();
  for (const report of reports)
    subjectCount.set(report.subjectKind, (subjectCount.get(report.subjectKind) ?? 0) + 1);

  const byStage: SummaryBucketVm[] = REPORT_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  const bySubject: SummaryBucketVm[] = [...subjectCount.entries()].map(([kind, count]) => ({
    value: kind,
    label: SUBJECT_LABEL[kind],
    count,
    tone: SUBJECT_TONE[kind],
  }));

  return {
    totalReports: reports.length,
    computed: reports.filter((r) => r.computation === 'COMPLETED').length,
    inReview: reports.filter(
      (r) => r.stage === 'REVIEW' || r.reviews.some((rv) => rv.status === 'PENDING'),
    ).length,
    awaitingApproval: reports.filter((r) => r.approvals.some((a) => a.status === 'PENDING')).length,
    published: reports.filter((r) => r.stage === 'PUBLISHED' || r.stage === 'ARCHIVED').length,
    families: familyCount,
    comparisons: comparisonCount,
    metrics: metricCount,
    byStage,
    bySubject,
  };
}
