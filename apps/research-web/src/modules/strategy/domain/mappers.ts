/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Risk statuses are pre-assessed upstream (Risk Engine) and only
 * mapped to a tone here — no risk/optimization computation happens.
 */
import type {
  ApprovalStateDto,
  PortfolioEligibilityDto,
  ReferenceDto,
  RiskIndicatorDto,
  RiskStatusDto,
  StrategyApprovalDto,
  StrategyDto,
  StrategyStatusDto,
  TimelineEventDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ApprovalVm,
  CompositionEntryVm,
  EligibilityVm,
  ReferenceVm,
  RiskIndicatorVm,
  StatusVm,
  StrategyDetailVm,
  StrategyListItemVm,
  StrategySummaryVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly StrategyStatusDto[] = [
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<StrategyStatusDto, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  UNDER_VALIDATION: 'Under validation',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<StrategyStatusDto, Tone> = {
  DRAFT: 'neutral',
  REGISTERED: 'info',
  UNDER_VALIDATION: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  DEPRECATED: 'warning',
  RETIRED: 'neutral',
};

const APPROVAL_LABEL: Record<ApprovalStateDto, string> = {
  NOT_SUBMITTED: 'Not submitted',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const APPROVAL_TONE: Record<ApprovalStateDto, Tone> = {
  NOT_SUBMITTED: 'neutral',
  PENDING: 'info',
  APPROVED: 'positive',
  REJECTED: 'danger',
};

const ELIGIBILITY_LABEL: Record<PortfolioEligibilityDto, string> = {
  NOT_ELIGIBLE: 'Not eligible for portfolio',
  UNDER_REVIEW: 'Under review',
  ELIGIBLE: 'Portfolio eligible (governed)',
};

const ELIGIBILITY_TONE: Record<PortfolioEligibilityDto, Tone> = {
  NOT_ELIGIBLE: 'neutral',
  UNDER_REVIEW: 'info',
  ELIGIBLE: 'positive',
};

const RISK_LABEL: Record<RiskStatusDto, string> = {
  WITHIN: 'Within limit',
  ELEVATED: 'Elevated',
  BREACHED: 'Breached',
  NOT_ASSESSED: 'Not assessed',
};

const RISK_TONE: Record<RiskStatusDto, Tone> = {
  WITHIN: 'positive',
  ELEVATED: 'warning',
  BREACHED: 'danger',
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

function toStatusVm(status: StrategyStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toApprovalVm(approval: StrategyApprovalDto): ApprovalVm {
  const detail = approval.decidedAt
    ? `Decided ${dateLabel(approval.decidedAt)}${approval.decidedBy ? ` by ${approval.decidedBy}` : ''}`
    : approval.submittedAt
      ? `Submitted ${dateLabel(approval.submittedAt)}`
      : 'Not yet submitted for approval';
  return { label: APPROVAL_LABEL[approval.state], tone: APPROVAL_TONE[approval.state], detail };
}

function toEligibilityVm(eligibility: PortfolioEligibilityDto): EligibilityVm {
  return { label: ELIGIBILITY_LABEL[eligibility], tone: ELIGIBILITY_TONE[eligibility] };
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

function toRiskVm(indicator: RiskIndicatorDto): RiskIndicatorVm {
  return {
    key: indicator.key,
    label: indicator.label,
    value: indicator.value,
    limit: indicator.limit,
    statusLabel: RISK_LABEL[indicator.status],
    tone: RISK_TONE[indicator.status],
  };
}

function toCompositionVm(entry: StrategyDto['composition'][number]): CompositionEntryVm {
  return {
    signalId: entry.signalId,
    name: entry.name,
    assetClass: entry.assetClass,
    weight: entry.weight,
    href: `/signals/${entry.signalId}`,
  };
}

function toExperimentRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/experiments/${reference.id}`,
  };
}

function toPortfolioRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/portfolios/${reference.id}`,
  };
}

function toTimeline(events: readonly TimelineEventDto[]): TimelineStepVm[] {
  let currentAssigned = false;
  return events.map((event) => {
    if (event.occurredAt) {
      return {
        stage: event.stage,
        label: event.label,
        dateLabel: dateLabel(event.occurredAt),
        state: 'done',
      };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { stage: event.stage, label: event.label, state: 'current' };
    }
    return { stage: event.stage, label: event.label, state: 'pending' };
  });
}

export function toListItemVm(strategy: StrategyDto): StrategyListItemVm {
  return {
    id: strategy.id,
    slug: strategy.slug,
    name: strategy.name,
    description: strategy.description,
    category: strategy.category,
    assetClass: strategy.assetClass,
    version: strategy.version,
    status: toStatusVm(strategy.status),
    approval: toApprovalVm(strategy.approval),
    eligibility: toEligibilityVm(strategy.portfolioEligibility),
    validationTone: VALIDATION_TONE[strategy.validation.status],
    updatedLabel: dateLabel(strategy.updatedAt),
    tags: strategy.tags,
  };
}

export function toDetailVm(strategy: StrategyDto): StrategyDetailVm {
  return {
    id: strategy.id,
    slug: strategy.slug,
    name: strategy.name,
    description: strategy.description,
    status: toStatusVm(strategy.status),
    approval: toApprovalVm(strategy.approval),
    eligibility: toEligibilityVm(strategy.portfolioEligibility),
    metadata: [
      { label: 'Owner', value: strategy.owner },
      { label: 'Category', value: strategy.category },
      { label: 'Asset class', value: strategy.assetClass },
      { label: 'Version', value: strategy.version },
      { label: 'Registry ID', value: strategy.registryId ?? 'Not registered' },
      { label: 'Manifest', value: strategy.manifestRef ?? 'Not linked' },
      { label: 'Provenance', value: strategy.provenanceComplete ? 'Complete' : 'Incomplete' },
      {
        label: 'Registered',
        value: strategy.registeredAt ? dateLabel(strategy.registeredAt) : '—',
      },
      { label: 'Created', value: dateLabel(strategy.createdAt) },
      { label: 'Updated', value: dateLabel(strategy.updatedAt) },
    ],
    validation: toValidationVm(strategy.validation),
    risk: strategy.risk.map(toRiskVm),
    composition: strategy.composition.map(toCompositionVm),
    portfolioRefs: strategy.portfolioRefs.map(toPortfolioRefVm),
    experimentRefs: strategy.experimentRefs.map(toExperimentRefVm),
    versions: strategy.versions.map((version) => ({
      version: version.version,
      registeredLabel: dateLabel(version.registeredAt),
      note: version.note,
    })),
    lineage: strategy.lineage.map((node) => ({ id: node.id, label: node.label, kind: node.kind })),
    workflow: toWorkflowVm(strategy.workflow),
    timeline: toTimeline(strategy.timeline),
    backtestRef: strategy.backtestRef,
    tags: strategy.tags,
  };
}

export function toSummaryVm(strategies: readonly StrategyDto[]): StrategySummaryVm {
  const countOf = (status: StrategyStatusDto): number =>
    strategies.filter((strategy) => strategy.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: strategies.length,
    approved: countOf('APPROVED'),
    underReview: countOf('UNDER_REVIEW'),
    retired: countOf('RETIRED'),
    byStatus,
  };
}
