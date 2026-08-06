/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No model inference, no prompt execution, no statistics.
 */
import type {
  AgentAuthorityDto,
  AgentDto,
  AgentStatusDto,
  DriftStatusDto,
  EvalGateDto,
  EvaluationDto,
  HealthDto,
  HealthStatusDto,
  LifecycleEventDto,
  ValidationReportDto,
  ValidationStatusDto,
} from './dto';
import type {
  AgentDetailVm,
  AgentListItemVm,
  AgentSummaryVm,
  EvaluationVm,
  HealthVm,
  StatusVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
} from './view-model';

const STATUS_ORDER: readonly AgentStatusDto[] = [
  'REGISTERED',
  'ACTIVE',
  'UNDER_EVALUATION',
  'SUSPENDED',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<AgentStatusDto, string> = {
  REGISTERED: 'Registered',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  UNDER_EVALUATION: 'Under evaluation',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<AgentStatusDto, Tone> = {
  REGISTERED: 'info',
  ACTIVE: 'positive',
  SUSPENDED: 'warning',
  UNDER_EVALUATION: 'warning',
  DEPRECATED: 'warning',
  RETIRED: 'neutral',
};

const AUTHORITY_LABEL: Record<AgentAuthorityDto, string> = {
  PROPOSES: 'Proposes',
  NARRATES: 'Narrates',
  OBSERVES: 'Observes',
};

// Advisory authorities carry no "decides" — tones are informational, never
// positive/danger, to avoid implying decision power.
const AUTHORITY_TONE: Record<AgentAuthorityDto, Tone> = {
  PROPOSES: 'info',
  NARRATES: 'info',
  OBSERVES: 'neutral',
};

const HEALTH_LABEL: Record<HealthStatusDto, string> = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  DOWN: 'Down',
  UNKNOWN: 'Unknown',
};

const HEALTH_TONE: Record<HealthStatusDto, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  DOWN: 'danger',
  UNKNOWN: 'neutral',
};

const GATE_LABEL: Record<EvalGateDto, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};

const GATE_TONE: Record<EvalGateDto, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};

const DRIFT_LABEL: Record<DriftStatusDto, string> = {
  STABLE: 'Stable',
  DRIFTING: 'Drifting',
  NOT_MONITORED: 'Not monitored',
};

const DRIFT_TONE: Record<DriftStatusDto, Tone> = {
  STABLE: 'positive',
  DRIFTING: 'danger',
  NOT_MONITORED: 'neutral',
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

function toStatusVm(status: AgentStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toAuthorityVm(authority: AgentAuthorityDto): StatusVm {
  return { value: authority, label: AUTHORITY_LABEL[authority], tone: AUTHORITY_TONE[authority] };
}

function toHealthStatusVm(status: HealthStatusDto): StatusVm {
  return { value: status, label: HEALTH_LABEL[status], tone: HEALTH_TONE[status] };
}

function toEvaluationVm(evaluation: EvaluationDto): EvaluationVm {
  return {
    gate: {
      value: evaluation.gate,
      label: GATE_LABEL[evaluation.gate],
      tone: GATE_TONE[evaluation.gate],
    },
    score: evaluation.score,
    drift: {
      value: evaluation.drift,
      label: DRIFT_LABEL[evaluation.drift],
      tone: DRIFT_TONE[evaluation.drift],
    },
    lastEvaluatedLabel: evaluation.lastEvaluated ? dateLabel(evaluation.lastEvaluated) : undefined,
  };
}

function toHealthVm(health: HealthDto): HealthVm {
  return {
    status: toHealthStatusVm(health.status),
    message: health.message,
    lastSeenLabel: dateLabel(health.lastSeen),
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

function toLifecycle(events: readonly LifecycleEventDto[]): TimelineStepVm[] {
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

export function toListItemVm(agent: AgentDto): AgentListItemVm {
  return {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    category: agent.category,
    status: toStatusVm(agent.status),
    authority: toAuthorityVm(agent.authority),
    health: toHealthStatusVm(agent.health.status),
    owner: agent.owner,
    version: agent.version,
    updatedLabel: dateLabel(agent.updatedAt),
    tags: agent.tags,
  };
}

export function toDetailVm(agent: AgentDto): AgentDetailVm {
  return {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    description: agent.description,
    status: toStatusVm(agent.status),
    authority: toAuthorityVm(agent.authority),
    health: toHealthStatusVm(agent.health.status),
    metadata: [
      { label: 'Category', value: agent.category },
      { label: 'Owner', value: agent.owner },
      { label: 'Team', value: agent.team },
      { label: 'Version', value: agent.version },
      { label: 'Registry ID', value: agent.registryId ?? 'Not registered' },
      {
        label: 'Model',
        value: `${agent.model.id}@${agent.model.version}${agent.model.pinned ? ' (pinned)' : ' (unpinned)'}`,
      },
      { label: 'Registered', value: agent.registeredAt ? dateLabel(agent.registeredAt) : '—' },
      { label: 'Updated', value: dateLabel(agent.updatedAt) },
    ],
    capabilities: agent.capabilities,
    permissions: agent.permissions,
    contracts: [
      { label: 'Agent contract', value: `${agent.contractRef} v${agent.contractVersion}` },
      { label: 'Authority ceiling', value: AUTHORITY_LABEL[agent.authority] },
      { label: 'Model binding', value: `${agent.model.id}@${agent.model.version}` },
    ],
    workflowAssignments: agent.workflowAssignments.map((assignment) => ({
      workflowRef: assignment.workflowRef,
      name: assignment.name,
      role: assignment.role,
    })),
    evaluation: toEvaluationVm(agent.evaluation),
    performance: {
      invocations: agent.performance.invocations,
      avgLatency: agent.performance.avgLatency,
      costToDate: agent.performance.costToDate,
      tokensToDate: agent.performance.tokensToDate,
    },
    healthDetail: toHealthVm(agent.health),
    validation: toValidationVm(agent.validation),
    lifecycle: toLifecycle(agent.lifecycle),
    activity: agent.activity.map((event) => ({
      id: event.id,
      label: event.label,
      actor: event.actor,
      occurredLabel: dateLabel(event.occurredAt),
    })),
    versions: agent.versions.map((version) => ({
      version: version.version,
      registeredLabel: dateLabel(version.registeredAt),
      note: version.note,
    })),
    tags: agent.tags,
  };
}

export function toSummaryVm(agents: readonly AgentDto[]): AgentSummaryVm {
  const countOf = (status: AgentStatusDto): number =>
    agents.filter((agent) => agent.status === status).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOf(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: agents.length,
    active: countOf('ACTIVE'),
    underEvaluation: countOf('UNDER_EVALUATION'),
    retired: countOf('RETIRED'),
    byStatus,
  };
}
