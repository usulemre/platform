/**
 * DTO → view-model mappings. The only presentation decision is level → tone and
 * date formatting; everything else is pre-classified upstream. Pure and
 * deterministic. No monitoring/metric computation of any kind.
 */
import type {
  AgentDto,
  AlertDto,
  AuditEventDto,
  DatasetMonitorDto,
  ExecutionMonitorDto,
  IncidentDto,
  MetricDto,
  MonitorLevel,
  PlatformOverviewDto,
  ServiceDto,
  SystemStatusDto,
  ValidationMonitorDto,
  WorkflowMonitorDto,
} from './dto';
import type {
  AgentVm,
  AlertVm,
  AuditEventVm,
  DatasetVm,
  ExecutionVm,
  IncidentVm,
  MetricVm,
  PlatformOverviewVm,
  ServiceVm,
  SystemStatusVm,
  Tone,
  ValidationVm,
  WorkflowVm,
} from './view-model';

const LEVEL_TONE: Record<MonitorLevel, Tone> = {
  OK: 'positive',
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'danger',
  NEUTRAL: 'neutral',
};

function toneOf(level: MonitorLevel): Tone {
  return LEVEL_TONE[level];
}

function dateLabel(iso: string): string {
  return iso.slice(0, 10);
}

export function toSystemStatusVm(system: SystemStatusDto): SystemStatusVm {
  return {
    statusLabel: system.statusLabel,
    tone: toneOf(system.level),
    message: system.message,
    updatedLabel: dateLabel(system.updatedAt),
  };
}

export function toOverviewVm(overview: PlatformOverviewDto): PlatformOverviewVm {
  return {
    system: toSystemStatusVm(overview.system),
    stats: [
      { key: 'services', label: 'Services healthy', value: overview.servicesHealthy },
      { key: 'workflows', label: 'Workflows running', value: overview.workflowsRunning },
      { key: 'executions', label: 'Executions queued', value: overview.executionsQueued },
      { key: 'agents', label: 'Agents active', value: overview.agentsActive },
      { key: 'alerts', label: 'Open alerts', value: overview.openAlerts },
      { key: 'incidents', label: 'Open incidents', value: overview.openIncidents },
    ],
  };
}

export function toServiceVm(service: ServiceDto): ServiceVm {
  return {
    id: service.id,
    name: service.name,
    category: service.category,
    statusLabel: service.statusLabel,
    tone: toneOf(service.level),
    latency: service.latency,
    uptime: service.uptime,
    lastCheckLabel: dateLabel(service.lastCheck),
  };
}

export function toWorkflowVm(workflow: WorkflowMonitorDto): WorkflowVm {
  return {
    id: workflow.id,
    name: workflow.name,
    workflowRef: workflow.workflowRef,
    statusLabel: workflow.statusLabel,
    tone: toneOf(workflow.level),
    currentStage: workflow.currentStage,
    updatedLabel: dateLabel(workflow.updatedAt),
  };
}

export function toExecutionVm(execution: ExecutionMonitorDto): ExecutionVm {
  return {
    id: execution.id,
    title: execution.title,
    statusLabel: execution.statusLabel,
    tone: toneOf(execution.level),
    mode: execution.mode,
    updatedLabel: dateLabel(execution.updatedAt),
  };
}

export function toValidationVm(validation: ValidationMonitorDto): ValidationVm {
  return {
    id: validation.id,
    subject: validation.subject,
    statusLabel: validation.statusLabel,
    tone: toneOf(validation.level),
    updatedLabel: dateLabel(validation.updatedAt),
  };
}

export function toDatasetVm(dataset: DatasetMonitorDto): DatasetVm {
  return {
    id: dataset.id,
    name: dataset.name,
    statusLabel: dataset.statusLabel,
    tone: toneOf(dataset.level),
    freshness: dataset.freshness,
    updatedLabel: dateLabel(dataset.updatedAt),
  };
}

export function toAgentVm(agent: AgentDto): AgentVm {
  return {
    id: agent.id,
    name: agent.name,
    authority: agent.authority,
    statusLabel: agent.statusLabel,
    tone: toneOf(agent.level),
    lastSeenLabel: dateLabel(agent.lastSeen),
  };
}

export function toAlertVm(alert: AlertDto): AlertVm {
  return {
    id: alert.id,
    title: alert.title,
    source: alert.source,
    severityLabel: alert.severityLabel,
    tone: toneOf(alert.level),
    raisedLabel: dateLabel(alert.raisedAt),
    acknowledged: alert.acknowledged,
  };
}

export function toIncidentVm(incident: IncidentDto): IncidentVm {
  return {
    id: incident.id,
    title: incident.title,
    statusLabel: incident.statusLabel,
    severityLabel: incident.severityLabel,
    tone: toneOf(incident.level),
    openedLabel: dateLabel(incident.openedAt),
  };
}

export function toMetricVm(metric: MetricDto): MetricVm {
  return {
    key: metric.key,
    label: metric.label,
    value: metric.value,
    tone: toneOf(metric.level),
  };
}

export function toAuditEventVm(event: AuditEventDto): AuditEventVm {
  return {
    id: event.id,
    actor: event.actor,
    action: event.action,
    target: event.target,
    occurredLabel: dateLabel(event.occurredAt),
  };
}
