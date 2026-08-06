/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Verdicts, levels, exposure and constraint statuses are
 * pre-assessed upstream and only mapped to a tone here — no VaR, no optimization.
 */
import type {
  ConstraintCheckDto,
  ConstraintStatusDto,
  DecisionTimelineEventDto,
  ExceptionStatusDto,
  ExecutionRecommendationDto,
  ExposureStatusDto,
  RiskAssessmentDto,
  RiskAssessmentStatusDto,
  RiskExceptionDto,
  RiskIndicatorDto,
  RiskLevelDto,
  RiskVerdictDto,
  StrategyRiskDto,
  SubjectKindDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ExceptionVm,
  IndicatorVm,
  MetadataRowVm,
  RiskDetailVm,
  RiskListItemVm,
  RiskSummaryVm,
  StatusVm,
  StrategyRiskVm,
  SubjectVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly RiskAssessmentStatusDto[] = [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'EXPIRED',
];

const STATUS_LABEL: Record<RiskAssessmentStatusDto, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  EXPIRED: 'Expired',
};

const STATUS_TONE: Record<RiskAssessmentStatusDto, Tone> = {
  DRAFT: 'neutral',
  UNDER_REVIEW: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  ESCALATED: 'danger',
  EXPIRED: 'neutral',
};

const VERDICT_LABEL: Record<RiskVerdictDto, string> = {
  PASS: 'Pass',
  PASS_WITH_CONDITIONS: 'Pass with conditions',
  FAIL: 'Fail',
  PENDING: 'Pending',
};

const VERDICT_TONE: Record<RiskVerdictDto, Tone> = {
  PASS: 'positive',
  PASS_WITH_CONDITIONS: 'warning',
  FAIL: 'danger',
  PENDING: 'neutral',
};

const LEVEL_LABEL: Record<RiskLevelDto, string> = {
  LOW: 'Low risk',
  MODERATE: 'Moderate risk',
  ELEVATED: 'Elevated risk',
  HIGH: 'High risk',
  NOT_ASSESSED: 'Not assessed',
};

const LEVEL_TONE: Record<RiskLevelDto, Tone> = {
  LOW: 'positive',
  MODERATE: 'info',
  ELEVATED: 'warning',
  HIGH: 'danger',
  NOT_ASSESSED: 'neutral',
};

const RECOMMENDATION_LABEL: Record<ExecutionRecommendationDto, string> = {
  DO_NOT_DEPLOY: 'Do not deploy',
  PAPER_ONLY: 'Paper only',
  ELIGIBLE_PENDING_TOKEN: 'Eligible (pending token)',
};

const RECOMMENDATION_TONE: Record<ExecutionRecommendationDto, Tone> = {
  DO_NOT_DEPLOY: 'danger',
  PAPER_ONLY: 'info',
  ELIGIBLE_PENDING_TOKEN: 'positive',
};

const EXPOSURE_LABEL: Record<ExposureStatusDto, string> = {
  WITHIN: 'Within limit',
  ELEVATED: 'Elevated',
  BREACHED: 'Breached',
  NOT_ASSESSED: 'Not assessed',
};

const EXPOSURE_TONE: Record<ExposureStatusDto, Tone> = {
  WITHIN: 'positive',
  ELEVATED: 'warning',
  BREACHED: 'danger',
  NOT_ASSESSED: 'neutral',
};

const CONSTRAINT_LABEL: Record<ConstraintStatusDto, string> = {
  SATISFIED: 'Satisfied',
  WARNING: 'Warning',
  BREACHED: 'Breached',
  NOT_ASSESSED: 'Not assessed',
};

const CONSTRAINT_TONE: Record<ConstraintStatusDto, Tone> = {
  SATISFIED: 'positive',
  WARNING: 'warning',
  BREACHED: 'danger',
  NOT_ASSESSED: 'neutral',
};

const EXCEPTION_LABEL: Record<ExceptionStatusDto, string> = {
  OPEN: 'Open',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const EXCEPTION_TONE: Record<ExceptionStatusDto, Tone> = {
  OPEN: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
};

const SUBJECT_LABEL: Record<SubjectKindDto, string> = {
  PORTFOLIO: 'Portfolio',
  STRATEGY: 'Strategy',
  EXECUTION_CANDIDATE: 'Execution candidate',
};

const WORKFLOW_LABEL: Record<WorkflowStateDto, string> = {
  NOT_STARTED: 'Not started',
  PENDING: 'Pending',
  RUNNING: 'Running',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
};

const WORKFLOW_TONE: Record<WorkflowStateDto, Tone> = {
  NOT_STARTED: 'neutral',
  PENDING: 'info',
  RUNNING: 'info',
  BLOCKED: 'danger',
  COMPLETED: 'positive',
};

const VALIDATION_LABEL: Record<ValidationStatusDto, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};

const VALIDATION_TONE: Record<ValidationStatusDto, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};

const SEVERITY_TONE: Record<string, Tone> = {
  ERROR: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function toStatusVm(status: RiskAssessmentStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toVerdictVm(verdict: RiskVerdictDto): StatusVm {
  return { value: verdict, label: VERDICT_LABEL[verdict], tone: VERDICT_TONE[verdict] };
}

function toLevelVm(level: RiskLevelDto): StatusVm {
  return { value: level, label: LEVEL_LABEL[level], tone: LEVEL_TONE[level] };
}

function toRecommendationVm(recommendation: ExecutionRecommendationDto): StatusVm {
  return {
    value: recommendation,
    label: RECOMMENDATION_LABEL[recommendation],
    tone: RECOMMENDATION_TONE[recommendation],
  };
}

function subjectHref(kind: SubjectKindDto, id: string): string | undefined {
  if (kind === 'PORTFOLIO') return `/portfolios/${id}`;
  if (kind === 'STRATEGY') return `/strategies/${id}`;
  return undefined; // execution candidates have no dedicated page yet
}

function toSubjectVm(assessment: RiskAssessmentDto): SubjectVm {
  return {
    kind: assessment.subjectKind,
    kindLabel: SUBJECT_LABEL[assessment.subjectKind],
    id: assessment.subjectId,
    name: assessment.subjectName,
    href: subjectHref(assessment.subjectKind, assessment.subjectId),
  };
}

function toExposureVm(exposure: RiskIndicatorDto): IndicatorVm {
  return {
    key: exposure.key,
    label: exposure.label,
    value: exposure.value,
    limit: exposure.limit,
    statusLabel: EXPOSURE_LABEL[exposure.status],
    tone: EXPOSURE_TONE[exposure.status],
  };
}

function toConstraintVm(constraint: ConstraintCheckDto): IndicatorVm {
  return {
    key: constraint.key,
    label: constraint.label,
    value: constraint.value,
    limit: constraint.limit,
    statusLabel: CONSTRAINT_LABEL[constraint.status],
    tone: CONSTRAINT_TONE[constraint.status],
  };
}

function toStrategyRiskVm(entry: StrategyRiskDto): StrategyRiskVm {
  return {
    strategyId: entry.strategyId,
    name: entry.name,
    levelLabel: LEVEL_LABEL[entry.level],
    tone: LEVEL_TONE[entry.level],
    note: entry.note,
    href: `/strategies/${entry.strategyId}`,
  };
}

function toExceptionVm(exception: RiskExceptionDto): ExceptionVm {
  return {
    code: exception.code,
    description: exception.description,
    statusLabel: EXCEPTION_LABEL[exception.status],
    tone: EXCEPTION_TONE[exception.status],
  };
}

function toWorkflowVm(workflow: WorkflowStatusDto): WorkflowStatusVm {
  return {
    workflowRef: workflow.workflowRef,
    name: workflow.name,
    stateLabel: WORKFLOW_LABEL[workflow.state],
    tone: WORKFLOW_TONE[workflow.state],
    currentStage: workflow.currentStage,
  };
}

function toValidationVm(report: ValidationReportDto): ValidationVm {
  return {
    status: report.status,
    label: VALIDATION_LABEL[report.status],
    tone: VALIDATION_TONE[report.status],
    issueCount: report.issues.length,
    issues: report.issues.map((issue) => ({
      code: issue.code,
      severity: issue.severity,
      message: issue.message,
      tone: SEVERITY_TONE[issue.severity] ?? 'neutral',
    })),
    checkedLabel: report.checkedAt ? dateLabel(report.checkedAt) : undefined,
  };
}

function toTimeline(events: readonly DecisionTimelineEventDto[]): TimelineStepVm[] {
  let currentAssigned = false;
  return events.map((event) => {
    if (event.occurredAt) {
      return {
        stage: event.stage,
        label: event.label,
        actor: event.actor,
        dateLabel: dateLabel(event.occurredAt),
        state: 'done',
      };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { stage: event.stage, label: event.label, actor: event.actor, state: 'current' };
    }
    return { stage: event.stage, label: event.label, actor: event.actor, state: 'pending' };
  });
}

export function toListItemVm(assessment: RiskAssessmentDto): RiskListItemVm {
  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    subject: toSubjectVm(assessment),
    status: toStatusVm(assessment.status),
    verdict: toVerdictVm(assessment.verdict),
    riskLevel: toLevelVm(assessment.riskLevel),
    updatedLabel: dateLabel(assessment.updatedAt),
    tags: assessment.tags,
  };
}

export function toDetailVm(assessment: RiskAssessmentDto): RiskDetailVm {
  const metadata: MetadataRowVm[] = [
    { label: 'Owner', value: assessment.owner },
    {
      label: 'Subject',
      value: `${SUBJECT_LABEL[assessment.subjectKind]} · ${assessment.subjectName}`,
    },
    { label: 'Version', value: assessment.version },
    { label: 'Registry ID', value: assessment.registryId ?? 'Not registered' },
    { label: 'Assessed', value: assessment.assessedAt ? dateLabel(assessment.assessedAt) : '—' },
    { label: 'Expires', value: assessment.expiresAt ? dateLabel(assessment.expiresAt) : '—' },
    { label: 'Updated', value: dateLabel(assessment.updatedAt) },
  ];

  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    subject: toSubjectVm(assessment),
    status: toStatusVm(assessment.status),
    verdict: toVerdictVm(assessment.verdict),
    riskLevel: toLevelVm(assessment.riskLevel),
    executionRecommendation: toRecommendationVm(assessment.executionRecommendation),
    metadata,
    validation: toValidationVm(assessment.validation),
    portfolioRisk: assessment.portfolioRisk.map(toExposureVm),
    strategyRisk: assessment.strategyRisk.map(toStrategyRiskVm),
    exposures: assessment.exposures.map(toExposureVm),
    constraints: assessment.constraints.map(toConstraintVm),
    policyRefs: assessment.policyRefs.map((ref) => ({ code: ref.code, title: ref.title })),
    exceptions: assessment.exceptions.map(toExceptionVm),
    timeline: toTimeline(assessment.timeline),
    workflow: toWorkflowVm(assessment.workflow),
    tags: assessment.tags,
  };
}

export function toSummaryVm(assessments: readonly RiskAssessmentDto[]): RiskSummaryVm {
  const countOf = (status: RiskAssessmentStatusDto): number =>
    assessments.filter((assessment) => assessment.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: assessments.length,
    approved: countOf('APPROVED'),
    underReview: countOf('UNDER_REVIEW'),
    escalated: countOf('ESCALATED'),
    byStatus,
  };
}
