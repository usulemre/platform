/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Constraint and risk statuses are pre-assessed upstream (Rulebook
 * / Risk Engine) and only mapped to a tone here — no optimization, no position
 * sizing, no statistics.
 */
import type {
  ApprovalStateDto,
  ConstraintDto,
  ConstraintStatusDto,
  DeploymentModeDto,
  PortfolioApprovalDto,
  PortfolioDto,
  PortfolioStatusDto,
  ReferenceDto,
  RiskIndicatorDto,
  RiskStatusDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ApprovalVm,
  CompositionEntryVm,
  ConstraintVm,
  DeploymentVm,
  PortfolioDetailVm,
  PortfolioListItemVm,
  PortfolioSummaryVm,
  ReferenceVm,
  RiskIndicatorVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly PortfolioStatusDto[] = [
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<PortfolioStatusDto, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  UNDER_VALIDATION: 'Under validation',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<PortfolioStatusDto, Tone> = {
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

const DEPLOYMENT_LABEL: Record<DeploymentModeDto, string> = {
  RESEARCH: 'Research',
  PAPER: 'Paper',
  LIVE: 'Live (token-gated)',
};

const DEPLOYMENT_TONE: Record<DeploymentModeDto, Tone> = {
  RESEARCH: 'neutral',
  PAPER: 'info',
  LIVE: 'positive',
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

const SIDE_LABEL: Record<PortfolioDto['holdings'][number]['side'], string> = {
  LONG: 'Long',
  SHORT: 'Short',
  FLAT: 'Flat',
};

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function toStatusVm(status: PortfolioStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toApprovalVm(approval: PortfolioApprovalDto): ApprovalVm {
  const detail = approval.decidedAt
    ? `Decided ${dateLabel(approval.decidedAt)}${approval.decidedBy ? ` by ${approval.decidedBy}` : ''}`
    : approval.submittedAt
      ? `Submitted ${dateLabel(approval.submittedAt)}`
      : 'Not yet submitted for approval';
  return { label: APPROVAL_LABEL[approval.state], tone: APPROVAL_TONE[approval.state], detail };
}

function toDeploymentVm(mode: DeploymentModeDto): DeploymentVm {
  return { label: DEPLOYMENT_LABEL[mode], tone: DEPLOYMENT_TONE[mode] };
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

function toConstraintVm(constraint: ConstraintDto): ConstraintVm {
  return {
    key: constraint.key,
    label: constraint.label,
    limit: constraint.limit,
    value: constraint.value,
    statusLabel: CONSTRAINT_LABEL[constraint.status],
    tone: CONSTRAINT_TONE[constraint.status],
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

function toCompositionVm(entry: PortfolioDto['composition'][number]): CompositionEntryVm {
  return {
    strategyId: entry.strategyId,
    name: entry.name,
    assetClass: entry.assetClass,
    weight: entry.weight,
    href: `/strategies/${entry.strategyId}`,
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

export function toListItemVm(portfolio: PortfolioDto): PortfolioListItemVm {
  return {
    id: portfolio.id,
    slug: portfolio.slug,
    name: portfolio.name,
    description: portfolio.description,
    mandate: portfolio.mandate,
    assetClass: portfolio.assetClass,
    version: portfolio.version,
    status: toStatusVm(portfolio.status),
    approval: toApprovalVm(portfolio.approval),
    deployment: toDeploymentVm(portfolio.deploymentMode),
    validationTone: VALIDATION_TONE[portfolio.validation.status],
    updatedLabel: dateLabel(portfolio.updatedAt),
    tags: portfolio.tags,
  };
}

export function toDetailVm(portfolio: PortfolioDto): PortfolioDetailVm {
  return {
    id: portfolio.id,
    slug: portfolio.slug,
    name: portfolio.name,
    description: portfolio.description,
    status: toStatusVm(portfolio.status),
    approval: toApprovalVm(portfolio.approval),
    deployment: toDeploymentVm(portfolio.deploymentMode),
    metadata: [
      { label: 'Owner', value: portfolio.owner },
      { label: 'Mandate', value: portfolio.mandate },
      { label: 'Asset class', value: portfolio.assetClass },
      { label: 'Base currency', value: portfolio.baseCurrency },
      { label: 'As of', value: dateLabel(portfolio.asOf) },
      { label: 'Version', value: portfolio.version },
      { label: 'Registry ID', value: portfolio.registryId ?? 'Not registered' },
      { label: 'Manifest', value: portfolio.manifestRef ?? 'Not linked' },
      { label: 'Provenance', value: portfolio.provenanceComplete ? 'Complete' : 'Incomplete' },
      {
        label: 'Registered',
        value: portfolio.registeredAt ? dateLabel(portfolio.registeredAt) : '—',
      },
      { label: 'Updated', value: dateLabel(portfolio.updatedAt) },
    ],
    validation: toValidationVm(portfolio.validation),
    risk: portfolio.risk.map(toRiskVm),
    constraints: portfolio.constraints.map(toConstraintVm),
    holdings: portfolio.holdings.map((holding) => ({
      id: holding.id,
      instrument: holding.instrument,
      assetClass: holding.assetClass,
      side: SIDE_LABEL[holding.side],
      weight: holding.weight,
    })),
    allocations: portfolio.allocations.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      weight: bucket.weight,
    })),
    composition: portfolio.composition.map(toCompositionVm),
    experimentRefs: portfolio.experimentRefs.map(toExperimentRefVm),
    versions: portfolio.versions.map((version) => ({
      version: version.version,
      registeredLabel: dateLabel(version.registeredAt),
      note: version.note,
    })),
    lineage: portfolio.lineage.map((node) => ({ id: node.id, label: node.label, kind: node.kind })),
    workflow: toWorkflowVm(portfolio.workflow),
    backtestRef: portfolio.backtestRef,
    tags: portfolio.tags,
  };
}

export function toSummaryVm(portfolios: readonly PortfolioDto[]): PortfolioSummaryVm {
  const countOf = (status: PortfolioStatusDto): number =>
    portfolios.filter((portfolio) => portfolio.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: portfolios.length,
    approved: countOf('APPROVED'),
    underReview: countOf('UNDER_REVIEW'),
    retired: countOf('RETIRED'),
    byStatus,
  };
}
