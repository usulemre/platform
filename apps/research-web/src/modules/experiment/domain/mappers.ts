/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No statistical calculation of any kind (that is out of scope
 * and forbidden for this module).
 */
import type {
  ExperimentDto,
  ExperimentOutcomeDto,
  ExperimentStatusDto,
  HypothesisDto,
  ReferenceDto,
  TimelineEventDto,
  ValidationReportDto,
  ValidationStatusDto,
  WorkflowStateDto,
  WorkflowStatusDto,
} from './dto';
import type {
  ExperimentDetailVm,
  ExperimentListItemVm,
  ExperimentSummaryVm,
  HypothesisVm,
  OutcomeVm,
  ReferenceVm,
  StatusVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
  WorkflowStatusVm,
} from './view-model';

const STATUS_ORDER: readonly ExperimentStatusDto[] = [
  'DRAFT',
  'REGISTERED',
  'PRE_REGISTERED',
  'RUNNING',
  'UNDER_VALIDATION',
  'UNDER_REVIEW',
  'CONCLUDED',
  'ARCHIVED',
];

const STATUS_LABEL: Record<ExperimentStatusDto, string> = {
  DRAFT: 'Draft',
  REGISTERED: 'Registered',
  PRE_REGISTERED: 'Pre-registered',
  RUNNING: 'Running',
  UNDER_VALIDATION: 'Under validation',
  UNDER_REVIEW: 'Under review',
  CONCLUDED: 'Concluded',
  ARCHIVED: 'Archived',
};

const STATUS_TONE: Record<ExperimentStatusDto, Tone> = {
  DRAFT: 'neutral',
  REGISTERED: 'info',
  PRE_REGISTERED: 'info',
  RUNNING: 'info',
  UNDER_VALIDATION: 'warning',
  UNDER_REVIEW: 'warning',
  CONCLUDED: 'positive',
  ARCHIVED: 'neutral',
};

// Negative results are first-class evidence (SM-4): REFUTED is informational,
// not a failure tone.
const OUTCOME_LABEL: Record<ExperimentOutcomeDto, string> = {
  SUPPORTED: 'Supported',
  REFUTED: 'Refuted',
  INCONCLUSIVE: 'Inconclusive',
  PENDING: 'Pending',
};

const OUTCOME_TONE: Record<ExperimentOutcomeDto, Tone> = {
  SUPPORTED: 'positive',
  REFUTED: 'info',
  INCONCLUSIVE: 'warning',
  PENDING: 'neutral',
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

function toStatusVm(status: ExperimentStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toOutcomeVm(outcome: ExperimentOutcomeDto): OutcomeVm {
  return { label: OUTCOME_LABEL[outcome], tone: OUTCOME_TONE[outcome] };
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

function toHypothesisVm(hypothesis: HypothesisDto): HypothesisVm {
  return {
    statement: hypothesis.statement,
    prediction: hypothesis.prediction,
    successCriteria: hypothesis.successCriteria,
    preRegistered: hypothesis.preRegistered,
    preRegisteredLabel: hypothesis.preRegisteredAt
      ? `Pre-registered ${dateLabel(hypothesis.preRegisteredAt)}`
      : 'Not pre-registered',
    frozen: hypothesis.frozen,
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

function toDatasetRefVm(reference: ReferenceDto): ReferenceVm {
  return {
    id: reference.id,
    name: reference.name,
    version: reference.version,
    href: `/datasets/${reference.id}`,
  };
}

function toFeatureRefVm(reference: ReferenceDto): ReferenceVm {
  // The Feature module does not exist yet; no href until it lands.
  return { id: reference.id, name: reference.name, version: reference.version };
}

export function toListItemVm(experiment: ExperimentDto): ExperimentListItemVm {
  return {
    id: experiment.id,
    slug: experiment.slug,
    title: experiment.title,
    status: toStatusVm(experiment.status),
    outcome: toOutcomeVm(experiment.outcome),
    owner: experiment.owner,
    assetClass: experiment.assetClass,
    updatedLabel: dateLabel(experiment.updatedAt),
    validationTone: VALIDATION_TONE[experiment.validation.status],
    workflowLabel: WORKFLOW_LABEL[experiment.workflow.state],
    tags: experiment.tags,
  };
}

export function toDetailVm(experiment: ExperimentDto): ExperimentDetailVm {
  return {
    id: experiment.id,
    slug: experiment.slug,
    title: experiment.title,
    researchQuestion: experiment.researchQuestion,
    economicRationale: experiment.economicRationale,
    status: toStatusVm(experiment.status),
    outcome: toOutcomeVm(experiment.outcome),
    metadata: [
      { label: 'Owner', value: experiment.owner },
      { label: 'Asset class', value: experiment.assetClass },
      { label: 'Universe', value: experiment.universe },
      { label: 'Horizon', value: experiment.horizon },
      { label: 'Version', value: experiment.version },
      { label: 'Created', value: dateLabel(experiment.createdAt) },
      { label: 'Updated', value: dateLabel(experiment.updatedAt) },
      {
        label: 'Registered',
        value: experiment.registeredAt ? dateLabel(experiment.registeredAt) : '—',
      },
      { label: 'Trial ledger', value: experiment.trialLedgerRef ?? 'Not linked' },
    ],
    hypothesis: toHypothesisVm(experiment.hypothesis),
    datasetRefs: experiment.datasetRefs.map(toDatasetRefVm),
    featureRefs: experiment.featureRefs.map(toFeatureRefVm),
    workflow: toWorkflowVm(experiment.workflow),
    validation: toValidationVm(experiment.validation),
    timeline: toTimeline(experiment.timeline),
    tags: experiment.tags,
    trialLedgerRef: experiment.trialLedgerRef,
  };
}

export function toSummaryVm(experiments: readonly ExperimentDto[]): ExperimentSummaryVm {
  const countOf = (status: ExperimentStatusDto): number =>
    experiments.filter((experiment) => experiment.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: experiments.length,
    running: countOf('RUNNING'),
    underReview: countOf('UNDER_REVIEW'),
    concluded: countOf('CONCLUDED'),
    byStatus,
  };
}
