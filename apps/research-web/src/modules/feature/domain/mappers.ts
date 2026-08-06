/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No statistical logic and no feature calculation.
 */
import type {
  ApprovalStateDto,
  FeatureApprovalDto,
  FeatureDto,
  FeatureStatusDto,
  LeakageHarnessDto,
  ReferenceDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ApprovalVm,
  FeatureDetailVm,
  FeatureListItemVm,
  FeatureRegistryVm,
  FeatureSummaryVm,
  ReferenceVm,
  StatusVm,
  SummaryBucketVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly FeatureStatusDto[] = [
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<FeatureStatusDto, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  UNDER_VALIDATION: 'Under validation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<FeatureStatusDto, Tone> = {
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

const LEAKAGE_LABEL: Record<LeakageHarnessDto, string> = {
  PASSED: 'Leakage harness passed',
  FAILED: 'Leakage harness failed',
  NOT_RUN: 'Leakage harness not run',
};

const LEAKAGE_TONE: Record<LeakageHarnessDto, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  NOT_RUN: 'neutral',
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

function toStatusVm(status: FeatureStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toApprovalVm(approval: FeatureApprovalDto): ApprovalVm {
  const detail = approval.decidedAt
    ? `Decided ${dateLabel(approval.decidedAt)}${approval.decidedBy ? ` by ${approval.decidedBy}` : ''}`
    : approval.submittedAt
      ? `Submitted ${dateLabel(approval.submittedAt)}`
      : 'Not yet submitted for approval';
  return { label: APPROVAL_LABEL[approval.state], tone: APPROVAL_TONE[approval.state], detail };
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

function toValidationVm(report: ValidationReportDto, leakage: LeakageHarnessDto): ValidationVm {
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
    leakageHarnessLabel: LEAKAGE_LABEL[leakage],
    leakageHarnessTone: LEAKAGE_TONE[leakage],
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

function toDatasetRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/datasets/${reference.id}`,
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

function toSignalRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/signals/${reference.id}`,
  };
}

export function toListItemVm(feature: FeatureDto): FeatureListItemVm {
  return {
    id: feature.id,
    slug: feature.slug,
    name: feature.name,
    description: feature.description,
    category: feature.category,
    assetClass: feature.assetClass,
    version: feature.version,
    status: toStatusVm(feature.status),
    approval: toApprovalVm(feature.approval),
    validationTone: VALIDATION_TONE[feature.validation.status],
    updatedLabel: dateLabel(feature.updatedAt),
    tags: feature.tags,
  };
}

function toRegistryVm(feature: FeatureDto): FeatureRegistryVm {
  return {
    registryId: feature.registryId ?? 'Not registered',
    marketplaceAvailable: feature.status === 'APPROVED',
    rows: [
      { label: 'Registry ID', value: feature.registryId ?? 'Not registered' },
      { label: 'Status', value: STATUS_LABEL[feature.status] },
      { label: 'Version', value: feature.version },
      { label: 'Registered', value: feature.registeredAt ? dateLabel(feature.registeredAt) : '—' },
      { label: 'Manifest', value: feature.manifestRef ?? 'Not linked' },
      { label: 'Provenance', value: feature.provenanceComplete ? 'Complete' : 'Incomplete' },
      { label: 'Marketplace', value: feature.status === 'APPROVED' ? 'Available' : 'Unavailable' },
    ],
  };
}

export function toDetailVm(feature: FeatureDto): FeatureDetailVm {
  return {
    id: feature.id,
    slug: feature.slug,
    name: feature.name,
    description: feature.description,
    status: toStatusVm(feature.status),
    approval: toApprovalVm(feature.approval),
    metadata: [
      { label: 'Owner', value: feature.owner },
      { label: 'Category', value: feature.category },
      { label: 'Asset class', value: feature.assetClass },
      { label: 'Value type', value: feature.valueType },
      { label: 'Version', value: feature.version },
      { label: 'Created', value: dateLabel(feature.createdAt) },
      { label: 'Updated', value: dateLabel(feature.updatedAt) },
    ],
    registry: toRegistryVm(feature),
    validation: toValidationVm(feature.validation, feature.leakageHarness),
    dependsOn: feature.dependsOn.map(toFeatureRefVm),
    datasetRefs: feature.datasetRefs.map(toDatasetRefVm),
    usageExperiments: feature.usage.experiments.map(toExperimentRefVm),
    usageSignals: feature.usage.signals.map(toSignalRefVm),
    versions: feature.versions.map((version) => ({
      version: version.version,
      registeredLabel: dateLabel(version.registeredAt),
      note: version.note,
    })),
    lineage: feature.lineage.map((node) => ({ id: node.id, label: node.label, kind: node.kind })),
    workflow: toWorkflowVm(feature.workflow),
    tags: feature.tags,
  };
}

export function toSummaryVm(features: readonly FeatureDto[]): FeatureSummaryVm {
  const countOf = (status: FeatureStatusDto): number =>
    features.filter((feature) => feature.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: features.length,
    approved: countOf('APPROVED'),
    underValidation: countOf('UNDER_VALIDATION'),
    retired: countOf('RETIRED'),
    byStatus,
  };
}
