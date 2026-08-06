/**
 * DTO → view-model mappings. All presentation decisions (labels, tones, date
 * formatting) live here so UI components stay logic-free. Pure and deterministic.
 */
import type { DatasetDto, DatasetStatusDto, ValidationReportDto, ValidationStatusDto } from './dto';
import type {
  DatasetDetailVm,
  DatasetListItemVm,
  StatusVm,
  Tone,
  ValidationVm,
} from './view-model';

const STATUS_LABEL: Record<DatasetStatusDto, string> = {
  DRAFT: 'Draft',
  INGESTED: 'Ingested',
  QUARANTINED: 'Quarantined',
  CERTIFIED: 'Certified',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<DatasetStatusDto, Tone> = {
  DRAFT: 'neutral',
  INGESTED: 'info',
  QUARANTINED: 'danger',
  CERTIFIED: 'positive',
  DEPRECATED: 'warning',
  RETIRED: 'neutral',
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

/** ISO → YYYY-MM-DD (deterministic; no locale/timezone dependence). */
function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

function toStatusVm(status: DatasetStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
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

export function toListItemVm(dataset: DatasetDto): DatasetListItemVm {
  return {
    id: dataset.id,
    slug: dataset.slug,
    name: dataset.name,
    description: dataset.description,
    status: toStatusVm(dataset.status),
    vendor: dataset.vendor,
    assetClass: dataset.assetClass,
    version: dataset.version,
    updatedLabel: dateLabel(dataset.updatedAt),
    validationTone: VALIDATION_TONE[dataset.validation.status],
    tags: dataset.tags,
  };
}

export function toDetailVm(dataset: DatasetDto): DatasetDetailVm {
  return {
    id: dataset.id,
    slug: dataset.slug,
    name: dataset.name,
    description: dataset.description,
    status: toStatusVm(dataset.status),
    metadata: [
      { label: 'Vendor', value: dataset.vendor },
      { label: 'Owner', value: dataset.owner },
      { label: 'Asset class', value: dataset.assetClass },
      { label: 'Version', value: dataset.version },
      { label: 'Rows', value: dataset.rowCount.toLocaleString('en-US') },
      { label: 'Event time', value: dateLabel(dataset.eventTime) },
      { label: 'Knowledge time', value: dateLabel(dataset.knowledgeTime) },
      { label: 'Created', value: dateLabel(dataset.createdAt) },
      { label: 'Updated', value: dateLabel(dataset.updatedAt) },
      { label: 'Provenance', value: dataset.provenanceComplete ? 'Complete' : 'Incomplete' },
    ],
    validation: toValidationVm(dataset.validation),
    tags: dataset.tags,
    provenanceComplete: dataset.provenanceComplete,
    lineageRef: dataset.lineageRef,
    versions: (dataset.versions ?? []).map((version) => ({
      version: version.version,
      knowledgeTimeLabel: dateLabel(version.knowledgeTime),
      note: version.note,
    })),
    lineage: (dataset.lineage ?? []).map((node) => ({
      id: node.id,
      label: node.label,
      kind: node.kind,
    })),
  };
}
