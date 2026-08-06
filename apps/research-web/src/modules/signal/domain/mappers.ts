/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. Quality RATINGS are pre-assessed upstream and only mapped to a
 * tone here — the module performs no statistical assessment.
 */
import type {
  ApprovalStateDto,
  ExecutionEligibilityDto,
  QualityRatingDto,
  ReferenceDto,
  SignalApprovalDto,
  SignalDto,
  SignalStatusDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ApprovalVm,
  EligibilityVm,
  QualityIndicatorVm,
  ReferenceVm,
  SignalDetailVm,
  SignalListItemVm,
  SignalRegistryVm,
  SignalSummaryVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly SignalStatusDto[] = [
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<SignalStatusDto, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  UNDER_VALIDATION: 'Under validation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<SignalStatusDto, Tone> = {
  DRAFT: 'neutral',
  REGISTERED: 'info',
  UNDER_VALIDATION: 'warning',
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

const ELIGIBILITY_LABEL: Record<ExecutionEligibilityDto, string> = {
  NOT_ELIGIBLE: 'Not eligible',
  PAPER_ONLY: 'Paper only',
  ELIGIBLE: 'Execution eligible (token-gated)',
};

const ELIGIBILITY_TONE: Record<ExecutionEligibilityDto, Tone> = {
  NOT_ELIGIBLE: 'neutral',
  PAPER_ONLY: 'info',
  ELIGIBLE: 'positive',
};

const QUALITY_LABEL: Record<QualityRatingDto, string> = {
  GOOD: 'Good',
  MODERATE: 'Moderate',
  POOR: 'Poor',
  NOT_ASSESSED: 'Not assessed',
};

const QUALITY_TONE: Record<QualityRatingDto, Tone> = {
  GOOD: 'positive',
  MODERATE: 'warning',
  POOR: 'danger',
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

function toStatusVm(status: SignalStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toApprovalVm(approval: SignalApprovalDto): ApprovalVm {
  const detail = approval.decidedAt
    ? `Decided ${dateLabel(approval.decidedAt)}${approval.decidedBy ? ` by ${approval.decidedBy}` : ''}`
    : approval.submittedAt
      ? `Submitted ${dateLabel(approval.submittedAt)}`
      : 'Not yet submitted for approval';
  return { label: APPROVAL_LABEL[approval.state], tone: APPROVAL_TONE[approval.state], detail };
}

function toEligibilityVm(eligibility: ExecutionEligibilityDto): EligibilityVm {
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

function toQualityVm(indicator: SignalDto['quality'][number]): QualityIndicatorVm {
  return {
    key: indicator.key,
    label: indicator.label,
    value: indicator.value,
    ratingLabel: QUALITY_LABEL[indicator.rating],
    tone: QUALITY_TONE[indicator.rating],
  };
}

function toFeatureRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/features/${reference.id}`,
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

function toStrategyRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/strategies/${reference.id}`,
  };
}

export function toListItemVm(signal: SignalDto): SignalListItemVm {
  return {
    id: signal.id,
    slug: signal.slug,
    name: signal.name,
    description: signal.description,
    category: signal.category,
    assetClass: signal.assetClass,
    version: signal.version,
    status: toStatusVm(signal.status),
    approval: toApprovalVm(signal.approval),
    eligibility: toEligibilityVm(signal.executionEligibility),
    validationTone: VALIDATION_TONE[signal.validation.status],
    updatedLabel: dateLabel(signal.updatedAt),
    tags: signal.tags,
  };
}

function toRegistryVm(signal: SignalDto): SignalRegistryVm {
  return {
    registryId: signal.registryId ?? 'Not registered',
    rows: [
      { label: 'Registry ID', value: signal.registryId ?? 'Not registered' },
      { label: 'Status', value: STATUS_LABEL[signal.status] },
      { label: 'Version', value: signal.version },
      { label: 'Registered', value: signal.registeredAt ? dateLabel(signal.registeredAt) : '—' },
      { label: 'Manifest', value: signal.manifestRef ?? 'Not linked' },
      { label: 'Provenance', value: signal.provenanceComplete ? 'Complete' : 'Incomplete' },
      { label: 'Execution eligibility', value: ELIGIBILITY_LABEL[signal.executionEligibility] },
    ],
  };
}

export function toDetailVm(signal: SignalDto): SignalDetailVm {
  return {
    id: signal.id,
    slug: signal.slug,
    name: signal.name,
    description: signal.description,
    status: toStatusVm(signal.status),
    approval: toApprovalVm(signal.approval),
    eligibility: toEligibilityVm(signal.executionEligibility),
    metadata: [
      { label: 'Owner', value: signal.owner },
      { label: 'Category', value: signal.category },
      { label: 'Asset class', value: signal.assetClass },
      { label: 'Horizon', value: signal.horizon },
      { label: 'Version', value: signal.version },
      { label: 'Created', value: dateLabel(signal.createdAt) },
      { label: 'Updated', value: dateLabel(signal.updatedAt) },
    ],
    registry: toRegistryVm(signal),
    validation: toValidationVm(signal.validation),
    quality: signal.quality.map(toQualityVm),
    dependsOnFeatures: signal.dependsOnFeatures.map(toFeatureRefVm),
    strategyRefs: signal.strategyRefs.map(toStrategyRefVm),
    experimentRefs: signal.experimentRefs.map(toExperimentRefVm),
    versions: signal.versions.map((version) => ({
      version: version.version,
      registeredLabel: dateLabel(version.registeredAt),
      note: version.note,
    })),
    lineage: signal.lineage.map((node) => ({ id: node.id, label: node.label, kind: node.kind })),
    workflow: toWorkflowVm(signal.workflow),
    tags: signal.tags,
  };
}

export function toSummaryVm(signals: readonly SignalDto[]): SignalSummaryVm {
  const countOf = (status: SignalStatusDto): number =>
    signals.filter((signal) => signal.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: signals.length,
    approved: countOf('APPROVED'),
    underValidation: countOf('UNDER_VALIDATION'),
    retired: countOf('RETIRED'),
    byStatus,
  };
}
