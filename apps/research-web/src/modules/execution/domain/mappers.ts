/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Statuses, verdicts and authorization states are governed
 * upstream and only mapped to a tone here — no execution, routing or connectivity.
 */
import type {
  AuthorizationDto,
  AuthorizationStateDto,
  ExecutionModeDto,
  ExecutionRequestDto,
  ExecutionStatusDto,
  ReferenceDto,
  RiskApprovalDto,
  RiskLevelDto,
  RiskVerdictDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  AuthorizationVm,
  ExecutionDetailVm,
  ExecutionListItemVm,
  ExecutionSummaryVm,
  ReferenceVm,
  RiskApprovalVm,
  StatusVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly ExecutionStatusDto[] = [
  'DRAFT',
  'REQUESTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'AUTHORIZED',
  'RUNNING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
];

const STATUS_LABEL: Record<ExecutionStatusDto, string> = {
  DRAFT: 'Draft',
  REQUESTED: 'Requested',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Approved',
  AUTHORIZED: 'Authorized',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

const STATUS_TONE: Record<ExecutionStatusDto, Tone> = {
  DRAFT: 'neutral',
  REQUESTED: 'info',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'info',
  AUTHORIZED: 'positive',
  RUNNING: 'info',
  COMPLETED: 'positive',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};

const MODE_LABEL: Record<ExecutionModeDto, string> = {
  PAPER: 'Paper',
  LIVE: 'Live (token-gated)',
};

const MODE_TONE: Record<ExecutionModeDto, Tone> = {
  PAPER: 'info',
  LIVE: 'positive',
};

const AUTH_LABEL: Record<AuthorizationStateDto, string> = {
  NOT_ISSUED: 'Not issued',
  PENDING: 'Pending',
  ISSUED: 'Issued',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
};

const AUTH_TONE: Record<AuthorizationStateDto, Tone> = {
  NOT_ISSUED: 'neutral',
  PENDING: 'info',
  ISSUED: 'positive',
  EXPIRED: 'warning',
  REVOKED: 'danger',
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

function toStatusVm(status: ExecutionStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toModeVm(mode: ExecutionModeDto): StatusVm {
  return { value: mode, label: MODE_LABEL[mode], tone: MODE_TONE[mode] };
}

function toVerdictVm(verdict: RiskVerdictDto): StatusVm {
  return { value: verdict, label: VERDICT_LABEL[verdict], tone: VERDICT_TONE[verdict] };
}

function toLevelVm(level: RiskLevelDto): StatusVm {
  return { value: level, label: LEVEL_LABEL[level], tone: LEVEL_TONE[level] };
}

function toAuthorizationVm(authorization: AuthorizationDto): AuthorizationVm {
  return {
    stateLabel: AUTH_LABEL[authorization.state],
    tone: AUTH_TONE[authorization.state],
    tokenRef: authorization.tokenRef,
    issuedLabel: authorization.issuedAt ? dateLabel(authorization.issuedAt) : undefined,
    expiresLabel: authorization.expiresAt ? dateLabel(authorization.expiresAt) : undefined,
  };
}

function toRiskApprovalVm(approval: RiskApprovalDto): RiskApprovalVm {
  return {
    assessmentId: approval.assessmentId,
    assessmentTitle: approval.assessmentTitle,
    verdict: toVerdictVm(approval.verdict),
    riskLevel: toLevelVm(approval.riskLevel),
    decidedLabel: approval.decidedAt ? dateLabel(approval.decidedAt) : undefined,
    href: `/risk/${approval.assessmentId}`,
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

function toTimeline(events: readonly TimelineEventDtoLike[]): TimelineStepVm[] {
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

interface TimelineEventDtoLike {
  readonly stage: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredAt?: string;
}

function reference(kindLabel: string, ref: ReferenceDto, hrefBase: string): ReferenceVm {
  return {
    id: ref.id,
    name: ref.name,
    version: ref.version,
    kindLabel,
    href: `${hrefBase}/${ref.id}`,
  };
}

export function toListItemVm(request: ExecutionRequestDto): ExecutionListItemVm {
  return {
    id: request.id,
    slug: request.slug,
    title: request.title,
    status: toStatusVm(request.status),
    mode: toModeVm(request.mode),
    riskVerdict: toVerdictVm(request.riskApproval.verdict),
    portfolioName: request.portfolioRef.name,
    updatedLabel: dateLabel(request.updatedAt),
    tags: request.tags,
  };
}

export function toDetailVm(request: ExecutionRequestDto): ExecutionDetailVm {
  const references: ReferenceVm[] = [reference('Portfolio', request.portfolioRef, '/portfolios')];
  if (request.strategyRef)
    references.push(reference('Strategy', request.strategyRef, '/strategies'));
  if (request.signalRef) references.push(reference('Signal', request.signalRef, '/signals'));

  return {
    id: request.id,
    slug: request.slug,
    title: request.title,
    status: toStatusVm(request.status),
    mode: toModeVm(request.mode),
    metadata: [
      { label: 'Owner', value: request.owner },
      { label: 'Version', value: request.version },
      { label: 'Registry ID', value: request.registryId ?? 'Not registered' },
      { label: 'Audit trail', value: request.auditRef ?? 'Not linked' },
      { label: 'Requested', value: request.requestedAt ? dateLabel(request.requestedAt) : '—' },
      { label: 'Created', value: dateLabel(request.createdAt) },
      { label: 'Updated', value: dateLabel(request.updatedAt) },
    ],
    authorization: toAuthorizationVm(request.authorization),
    riskApproval: toRiskApprovalVm(request.riskApproval),
    references,
    validation: toValidationVm(request.validation),
    timeline: toTimeline(request.timeline),
    workflow: toWorkflowVm(request.workflow),
    cancellable: request.cancellable,
    tags: request.tags,
  };
}

export function toSummaryVm(requests: readonly ExecutionRequestDto[]): ExecutionSummaryVm {
  const countOf = (status: ExecutionStatusDto): number =>
    requests.filter((request) => request.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: requests.length,
    pendingApproval: countOf('PENDING_APPROVAL'),
    authorized: countOf('AUTHORIZED'),
    completed: countOf('COMPLETED'),
    byStatus,
  };
}
