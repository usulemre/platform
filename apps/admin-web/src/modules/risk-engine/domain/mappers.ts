/**
 * DTO → view-model mappings + summary/comparison aggregation for the administrator
 * (admin-web) Risk Engine module. All presentation and aggregation decisions live here
 * so UI components stay logic-free. Pure and deterministic. Stage labels/ordering,
 * governance predicates, the metric catalog and the canonical key come from
 * `@platform/risk-sdk`. Exposure values, limit bounds and metric VALUES are passed
 * through unchanged — never computed; comparison is a pure lookup/reshape. The admin
 * console does not deep-link into research-web modules, so dependency/lineage/subject
 * cross-links render as plain labels (no href).
 */
import {
  RISK_STAGES,
  assessmentKey,
  canRevalidate,
  compareVersions,
  describeMetric,
  describeStage,
  stageOrder,
  type ApprovalStatus,
  type DependencyStatus,
  type ExceptionStatus,
  type LimitStatus,
  type MetricKey,
  type OverrideStatus,
  type ReviewStatus,
  type RiskApproval,
  type RiskAssessment,
  type RiskAudit,
  type RiskComparison,
  type RiskConstraint,
  type RiskDecision,
  type RiskDependency,
  type RiskException,
  type RiskExposure,
  type RiskFamily,
  type RiskLimit,
  type RiskMetric,
  type RiskOverride,
  type RiskPolicy,
  type RiskReport,
  type RiskReview,
  type RiskRule,
  type RiskStage,
  type RiskVersion,
  type RuleStatus,
  type ValidationStatus,
} from '@platform/risk-sdk';
import type {
  ApprovalVm,
  AuditVm,
  ComparisonVm,
  ConstraintVm,
  DependencyVm,
  ExceptionVm,
  ExposureVm,
  LimitVm,
  LineageVm,
  MetricVm,
  OverrideVm,
  PolicyVm,
  QueueItemVm,
  ReportVm,
  ReviewVm,
  RiskDetailVm,
  RiskEngineSummaryVm,
  RiskFamilyVm,
  RiskListItemVm,
  RuleVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<RiskStage, Tone> = {
  DRAFT: 'neutral',
  RISK_ASSESSMENT_REQUESTED: 'info',
  POLICY_VALIDATION: 'warning',
  EXPOSURE_REVIEW: 'info',
  LIMIT_VALIDATION: 'warning',
  EXCEPTION_REVIEW: 'warning',
  APPROVAL: 'warning',
  EXECUTION_AUTHORIZED: 'positive',
  ARCHIVED: 'neutral',
};

const DECISION_LABEL: Record<RiskDecision, string> = {
  CLEARED: 'Cleared',
  BLOCKED: 'Blocked',
  CONDITIONAL: 'Conditional',
  PENDING: 'Pending',
};
const DECISION_TONE: Record<RiskDecision, Tone> = {
  CLEARED: 'positive',
  BLOCKED: 'danger',
  CONDITIONAL: 'warning',
  PENDING: 'neutral',
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

const RULE_LABEL: Record<RuleStatus, string> = {
  COMPLIANT: 'Compliant',
  BREACH: 'Breach',
  WARNING: 'Warning',
  NOT_EVALUATED: 'Not evaluated',
};
const RULE_TONE: Record<RuleStatus, Tone> = {
  COMPLIANT: 'positive',
  BREACH: 'danger',
  WARNING: 'warning',
  NOT_EVALUATED: 'neutral',
};

const LIMIT_LABEL: Record<LimitStatus, string> = {
  WITHIN: 'Within',
  BREACHED: 'Breached',
  WARNING: 'Warning',
  NOT_EVALUATED: 'Not evaluated',
};
const LIMIT_TONE: Record<LimitStatus, Tone> = {
  WITHIN: 'positive',
  BREACHED: 'danger',
  WARNING: 'warning',
  NOT_EVALUATED: 'neutral',
};

const EXCEPTION_LABEL: Record<ExceptionStatus, string> = {
  OPEN: 'Open',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};
const EXCEPTION_TONE: Record<ExceptionStatus, Tone> = {
  OPEN: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

const OVERRIDE_LABEL: Record<OverrideStatus, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};
const OVERRIDE_TONE: Record<OverrideStatus, Tone> = {
  ACTIVE: 'info',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
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

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: RiskStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function decisionStatus(decision: RiskDecision): StatusVm {
  return { value: decision, label: DECISION_LABEL[decision], tone: DECISION_TONE[decision] };
}

function validationStatus(status: ValidationStatus): StatusVm {
  return { value: status, label: VALIDATION_LABEL[status], tone: VALIDATION_TONE[status] };
}

function approvalStatus(status: ApprovalStatus): StatusVm {
  return { value: status, label: APPROVAL_LABEL[status], tone: APPROVAL_TONE[status] };
}

function ruleStatus(status: RuleStatus): StatusVm {
  return { value: status, label: RULE_LABEL[status], tone: RULE_TONE[status] };
}

function limitStatus(status: LimitStatus): StatusVm {
  return { value: status, label: LIMIT_LABEL[status], tone: LIMIT_TONE[status] };
}

function toMetricVm(metric: RiskMetric): MetricVm {
  const descriptor = describeMetric(metric.key);
  return {
    key: metric.key,
    label: descriptor?.label ?? metric.key,
    value: metric.value,
    unit: descriptor?.unit ?? '',
  };
}

function toProgressVm(assessment: RiskAssessment): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = RISK_STAGES.length;
  const completed = stageOrder(assessment.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(assessment.stage).label,
  };
}

function toStageSteps(assessment: RiskAssessment): StageStepVm[] {
  const currentOrder = stageOrder(assessment.stage);
  const blocked = assessment.decision === 'BLOCKED';
  return RISK_STAGES.map((stage) => {
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

export function toPolicyVm(policy: RiskPolicy): PolicyVm {
  return {
    id: policy.id,
    name: policy.name,
    category: policy.category,
    version: policy.version,
    status: ruleStatus(policy.status),
    description: policy.description,
  };
}

export function toRuleVm(rule: RiskRule): RuleVm {
  return {
    id: rule.id,
    code: rule.code,
    label: rule.label,
    expression: rule.expression,
    severity: rule.severity,
    status: ruleStatus(rule.status),
  };
}

export function toLimitVm(limit: RiskLimit): LimitVm {
  return {
    id: limit.id,
    scope: limit.scope.replace('_', ' '),
    label: limit.label,
    bound: limit.bound,
    utilization: limit.utilization,
    status: limitStatus(limit.status),
  };
}

function toConstraintVm(constraint: RiskConstraint): ConstraintVm {
  return {
    id: constraint.id,
    label: constraint.label,
    bound: constraint.bound,
    status: ruleStatus(constraint.status),
    note: constraint.note,
  };
}

export function toExposureVm(exposure: RiskExposure): ExposureVm {
  return {
    id: exposure.id,
    dimension: exposure.dimension.replace('_', ' '),
    label: exposure.label,
    value: exposure.value,
    limit: exposure.limit,
    status: limitStatus(exposure.status),
  };
}

function toReviewVm(review: RiskReview): ReviewVm {
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

export function toApprovalVm(approval: RiskApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    status: approvalStatus(approval.status),
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
    counterSignedBy: approval.counterSignedBy,
  };
}

export function toExceptionVm(exception: RiskException): ExceptionVm {
  return {
    id: exception.id,
    code: exception.code,
    reason: exception.reason,
    status: {
      value: exception.status,
      label: EXCEPTION_LABEL[exception.status],
      tone: EXCEPTION_TONE[exception.status],
    },
    raisedBy: exception.raisedBy,
    raisedLabel: dateLabel(exception.raisedAt) ?? '—',
    expiresLabel: dateLabel(exception.expiresAt),
    ruleRef: exception.ruleRef,
  };
}

export function toOverrideVm(override: RiskOverride): OverrideVm {
  return {
    id: override.id,
    reason: override.reason,
    status: {
      value: override.status,
      label: OVERRIDE_LABEL[override.status],
      tone: OVERRIDE_TONE[override.status],
    },
    authorizedBy: override.authorizedBy,
    counterSignedBy: override.counterSignedBy,
    grantedLabel: dateLabel(override.grantedAt) ?? '—',
    expiresLabel: dateLabel(override.expiresAt),
  };
}

export function toReportVm(report: RiskReport): ReportVm {
  return {
    id: report.id,
    kind: report.kind.replace('_', ' '),
    title: report.title,
    ref: report.ref,
    generatedLabel: dateLabel(report.generatedAt) ?? '—',
    summary: report.summary,
  };
}

export function toAuditVm(entry: RiskAudit): AuditVm {
  return {
    id: entry.id,
    kind: entry.kind,
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    occurredLabel: dateTimeLabel(entry.occurredAt),
  };
}

function toDependencyVm(dependency: RiskDependency): DependencyVm {
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

function toLineageVm(assessment: RiskAssessment): LineageVm {
  return {
    nodes: assessment.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
    })),
    edges: assessment.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function currentVersionString(assessment: RiskAssessment): string {
  return (
    assessment.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || assessment.version
  );
}

function toVersionVm(version: RiskVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

function openExceptionCount(assessment: RiskAssessment): number {
  return assessment.exceptions.filter((exception) => exception.status === 'OPEN').length;
}

export function toListItemVm(assessment: RiskAssessment): RiskListItemVm {
  return {
    id: assessment.id,
    slug: assessment.slug,
    name: assessment.name,
    description: assessment.description,
    namespace: assessment.namespace,
    family: assessment.family,
    version: assessment.version,
    stage: stageStatus(assessment.stage),
    decision: decisionStatus(assessment.decision),
    subjectName: assessment.subjectName,
    validation: validationStatus(assessment.validation.status),
    approval: approvalStatus(assessment.approval),
    openExceptions: openExceptionCount(assessment),
    owner: assessment.owner.owner,
    tags: assessment.tags,
    updatedLabel: dateLabel(assessment.updatedAt) ?? '—',
  };
}

export function toDetailVm(assessment: RiskAssessment): RiskDetailVm {
  const currentValue = currentVersionString(assessment);
  const links: { label: string; href: string }[] = [];

  return {
    id: assessment.id,
    slug: assessment.slug,
    name: assessment.name,
    description: assessment.description,
    namespace: assessment.namespace,
    family: assessment.family,
    key: assessmentKey(assessment.namespace, assessment.family, assessment.name),
    version: assessment.version,
    stage: stageStatus(assessment.stage),
    decision: decisionStatus(assessment.decision),
    progress: toProgressVm(assessment),
    stages: toStageSteps(assessment),
    subject: { kind: assessment.subjectKind, name: assessment.subjectName },
    controls: [
      { control: 'revalidate', label: 'Revalidate', enabled: canRevalidate(assessment.stage) },
      {
        control: 'raise-exception',
        label: 'Raise exception',
        enabled: assessment.stage !== 'DRAFT' && assessment.stage !== 'ARCHIVED',
      },
      {
        control: 'record-override',
        label: 'Record override',
        enabled:
          assessment.stage !== 'ARCHIVED' &&
          (assessment.rules.some((r) => r.status === 'BREACH') ||
            assessment.limits.some((l) => l.status === 'BREACHED') ||
            openExceptionCount(assessment) > 0),
      },
    ],
    policies: assessment.policies.map(toPolicyVm),
    rules: assessment.rules.map(toRuleVm),
    limits: assessment.limits.map(toLimitVm),
    constraints: assessment.constraints.map(toConstraintVm),
    exposures: assessment.exposures.map(toExposureVm),
    metrics: assessment.metrics.map(toMetricVm),
    validation: {
      status: validationStatus(assessment.validation.status),
      method: assessment.validation.method,
      checkedLabel: dateLabel(assessment.validation.checkedAt),
      note: assessment.validation.note,
    },
    approval: approvalStatus(assessment.approval),
    reviews: assessment.reviews.map(toReviewVm),
    approvals: assessment.approvals.map(toApprovalVm),
    exceptions: assessment.exceptions.map(toExceptionVm),
    overrides: assessment.overrides.map(toOverrideVm),
    reports: assessment.reports.map(toReportVm),
    audit: [...assessment.audit]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map(toAuditVm),
    dependencies: assessment.dependencies.map(toDependencyVm),
    lineage: toLineageVm(assessment),
    versions: [...assessment.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    snapshots: assessment.snapshots.map((snapshot) => ({
      version: snapshot.version,
      stage: stageStatus(snapshot.stage),
      decision: decisionStatus(snapshot.decision),
      capturedLabel: dateLabel(snapshot.capturedAt) ?? '—',
      manifestHash: snapshot.manifestHash,
    })),
    owner: {
      owner: assessment.owner.owner,
      team: assessment.owner.team,
      steward: assessment.owner.steward,
    },
    links,
    tags: assessment.tags,
    metadata: [
      { label: 'Namespace', value: assessment.namespace },
      { label: 'Family', value: assessment.family },
      { label: 'Subject', value: `${assessment.subjectKind} · ${assessment.subjectName}` },
      { label: 'Registry ref', value: assessment.registryRef },
      { label: 'Registered', value: dateLabel(assessment.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(assessment.updatedAt) ?? '—' },
      ...assessment.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: RiskFamily): RiskFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    assessmentCount: family.assessmentCount,
  };
}

function toQueueItemVm(assessment: RiskAssessment, primary: StatusVm): QueueItemVm {
  return {
    id: assessment.id,
    name: assessment.name,
    namespace: assessment.namespace,
    family: assessment.family,
    subjectName: assessment.subjectName,
    stageLabel: describeStage(assessment.stage).label,
    primaryStatus: primary,
    owner: assessment.owner.owner,
  };
}

/** Validation-queue row: primary status is the validation state. */
export function toValidationQueueItemVm(assessment: RiskAssessment): QueueItemVm {
  return toQueueItemVm(assessment, validationStatus(assessment.validation.status));
}

/** Review-queue row: primary status is the assessment decision. */
export function toReviewQueueItemVm(assessment: RiskAssessment): QueueItemVm {
  return toQueueItemVm(assessment, decisionStatus(assessment.decision));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(assessment: RiskAssessment): QueueItemVm {
  return toQueueItemVm(assessment, approvalStatus(assessment.approval));
}

export function toComparisonListItemVm(comparison: RiskComparison): {
  id: string;
  name: string;
  note: string;
  assessmentCount: number;
  metricCount: number;
  createdLabel: string;
} {
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    assessmentCount: comparison.assessmentIds.length,
    metricCount: comparison.metricKeys.length,
    createdLabel: dateLabel(comparison.createdAt) ?? '—',
  };
}

/**
 * Assemble a comparison view by pulling each assessment's supplied metric values. PURE
 * lookup + reshape — no metric is computed, ranked or scored.
 */
export function toComparisonVm(
  comparison: RiskComparison,
  assessments: readonly RiskAssessment[],
): ComparisonVm {
  const byId = new Map(assessments.map((assessment) => [assessment.id, assessment]));
  const metricColumns = comparison.metricKeys.map((key: MetricKey) => ({
    key,
    label: describeMetric(key)?.label ?? key,
  }));
  const rows = comparison.assessmentIds.map((assessmentId) => {
    const assessment = byId.get(assessmentId);
    const values = new Map((assessment?.metrics ?? []).map((metric) => [metric.key, metric.value]));
    return {
      assessmentId,
      assessmentName: assessment?.name ?? assessmentId,
      cells: comparison.metricKeys.map((key) => ({ key, value: values.get(key) ?? '—' })),
    };
  });
  return { id: comparison.id, name: comparison.name, note: comparison.note, metricColumns, rows };
}

export function toSummaryVm(
  assessments: readonly RiskAssessment[],
  familyCount: number,
  policyCount: number,
): RiskEngineSummaryVm {
  const stageCount = new Map<RiskStage, number>();
  for (const assessment of assessments)
    stageCount.set(assessment.stage, (stageCount.get(assessment.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = RISK_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalAssessments: assessments.length,
    inValidation: assessments.filter(
      (a) => a.stage === 'POLICY_VALIDATION' || a.stage === 'LIMIT_VALIDATION',
    ).length,
    inReview: assessments.filter(
      (a) =>
        a.stage === 'EXPOSURE_REVIEW' ||
        a.stage === 'EXCEPTION_REVIEW' ||
        a.reviews.some((r) => r.status === 'PENDING'),
    ).length,
    awaitingApproval: assessments.filter((a) => a.approvals.some((ap) => ap.status === 'PENDING'))
      .length,
    openExceptions: assessments.reduce(
      (sum, a) => sum + a.exceptions.filter((e) => e.status === 'OPEN').length,
      0,
    ),
    activeOverrides: assessments.reduce(
      (sum, a) => sum + a.overrides.filter((o) => o.status === 'ACTIVE').length,
      0,
    ),
    blocked: assessments.filter((a) => a.decision === 'BLOCKED').length,
    executionAuthorized: assessments.filter(
      (a) => a.stage === 'EXECUTION_AUTHORIZED' || a.stage === 'ARCHIVED',
    ).length,
    families: familyCount,
    policies: policyCount,
    byStage,
  };
}
