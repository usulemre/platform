/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. No network calls, no statistics, no secrets.
 */
import { CONNECTOR_TYPE_ORDER, typeLabel } from './catalog';
import type {
  CapabilitySupportDto,
  ConnectorConfigurationDto,
  ConnectorCredentialDto,
  ConnectorDto,
  ConnectorHealthDto,
  ConnectorMetricsDto,
  ConnectorStatusDto,
  ConnectorTypeDto,
  CredentialStatusDto,
  DiagnosticStatusDto,
  EnvironmentDto,
  HealthStatusDto,
  LifecycleEventDto,
  ValidationReportDto,
  ValidationStatusDto,
} from './dto';
import type {
  CapabilityVm,
  ConfigurationVm,
  ConnectorDetailVm,
  ConnectorListItemVm,
  ConnectorSummaryVm,
  CredentialVm,
  DiagnosticVm,
  HealthVm,
  MetricsVm,
  StatusVm,
  SummaryBucketVm,
  TimelineStepVm,
  Tone,
  ValidationVm,
} from './view-model';

const STATUS_ORDER: readonly ConnectorStatusDto[] = [
  'REGISTERED',
  'ENABLED',
  'DISABLED',
  'MAINTENANCE',
  'DEPRECATED',
  'RETIRED',
];

const STATUS_LABEL: Record<ConnectorStatusDto, string> = {
  REGISTERED: 'Registered',
  ENABLED: 'Enabled',
  DISABLED: 'Disabled',
  MAINTENANCE: 'Maintenance',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};

const STATUS_TONE: Record<ConnectorStatusDto, Tone> = {
  REGISTERED: 'info',
  ENABLED: 'positive',
  DISABLED: 'neutral',
  MAINTENANCE: 'warning',
  DEPRECATED: 'warning',
  RETIRED: 'neutral',
};

const TYPE_TONE: Record<ConnectorTypeDto, Tone> = {
  MARKET_DATA: 'info',
  EXCHANGE: 'info',
  BROKER: 'info',
  OPTIONS: 'info',
  BLOCKCHAIN: 'info',
  NEWS: 'info',
  MACRO_DATA: 'info',
  ALT_DATA: 'info',
  AI_PROVIDER: 'info',
  STORAGE: 'info',
  NOTIFICATION: 'info',
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

const ENVIRONMENT_LABEL: Record<EnvironmentDto, string> = {
  SANDBOX: 'Sandbox',
  PRODUCTION: 'Production',
};

const ENVIRONMENT_TONE: Record<EnvironmentDto, Tone> = {
  SANDBOX: 'info',
  PRODUCTION: 'neutral',
};

const SUPPORT_LABEL: Record<CapabilitySupportDto, string> = {
  SUPPORTED: 'Supported',
  PARTIAL: 'Partial',
  UNSUPPORTED: 'Unsupported',
  PLANNED: 'Planned',
};

const SUPPORT_TONE: Record<CapabilitySupportDto, Tone> = {
  SUPPORTED: 'positive',
  PARTIAL: 'warning',
  UNSUPPORTED: 'neutral',
  PLANNED: 'info',
};

const CREDENTIAL_LABEL: Record<CredentialStatusDto, string> = {
  CONFIGURED: 'Configured',
  MISSING: 'Missing',
  EXPIRED: 'Expired',
  NOT_REQUIRED: 'Not required',
};

const CREDENTIAL_TONE: Record<CredentialStatusDto, Tone> = {
  CONFIGURED: 'positive',
  MISSING: 'danger',
  EXPIRED: 'warning',
  NOT_REQUIRED: 'neutral',
};

const DIAGNOSTIC_LABEL: Record<DiagnosticStatusDto, string> = {
  PASS: 'Pass',
  WARN: 'Warn',
  FAIL: 'Fail',
  SKIPPED: 'Skipped',
};

const DIAGNOSTIC_TONE: Record<DiagnosticStatusDto, Tone> = {
  PASS: 'positive',
  WARN: 'warning',
  FAIL: 'danger',
  SKIPPED: 'neutral',
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

function toStatusVm(status: ConnectorStatusDto): StatusVm {
  return { value: status, label: STATUS_LABEL[status], tone: STATUS_TONE[status] };
}

function toTypeVm(type: ConnectorTypeDto): StatusVm {
  return { value: type, label: typeLabel(type), tone: TYPE_TONE[type] };
}

function toHealthStatusVm(status: HealthStatusDto): StatusVm {
  return { value: status, label: HEALTH_LABEL[status], tone: HEALTH_TONE[status] };
}

function toEnvironmentVm(environment: EnvironmentDto): StatusVm {
  return {
    value: environment,
    label: ENVIRONMENT_LABEL[environment],
    tone: ENVIRONMENT_TONE[environment],
  };
}

function toHealthVm(health: ConnectorHealthDto): HealthVm {
  return {
    status: toHealthStatusVm(health.status),
    message: health.message,
    latency: health.latency,
    uptime: health.uptime,
    lastCheckedLabel: dateLabel(health.lastCheckedAt),
  };
}

function toMetricsVm(metrics: ConnectorMetricsDto): MetricsVm {
  return {
    requestsToDate: metrics.requestsToDate,
    errorRate: metrics.errorRate,
    avgLatency: metrics.avgLatency,
    rateLimit: metrics.rateLimit,
    lastRequestLabel: metrics.lastRequestAt ? dateLabel(metrics.lastRequestAt) : undefined,
  };
}

function toConfigurationVm(config: ConnectorConfigurationDto): ConfigurationVm {
  return {
    environment: toEnvironmentVm(config.environment),
    configRef: config.configRef,
    fields: config.fields.map((field) => ({
      key: field.key,
      label: field.label,
      // Secret-bearing fields are never displayed — only a reference/mask.
      value: field.secret ? 'Managed by secrets broker (reference only)' : field.value,
      secret: field.secret,
    })),
    updatedLabel: config.updatedAt ? dateLabel(config.updatedAt) : undefined,
  };
}

function toCredentialVm(credential: ConnectorCredentialDto): CredentialVm {
  return {
    kind: credential.kind,
    status: {
      value: credential.status,
      label: CREDENTIAL_LABEL[credential.status],
      tone: CREDENTIAL_TONE[credential.status],
    },
    secretRef: credential.secretRef,
    rotatedLabel: credential.rotatedAt ? dateLabel(credential.rotatedAt) : undefined,
  };
}

function toCapabilityVm(capability: ConnectorDto['capabilities'][number]): CapabilityVm {
  return {
    key: capability.key,
    label: capability.label,
    support: {
      value: capability.support,
      label: SUPPORT_LABEL[capability.support],
      tone: SUPPORT_TONE[capability.support],
    },
    note: capability.note,
  };
}

function toDiagnosticVm(diagnostic: ConnectorDto['diagnostics'][number]): DiagnosticVm {
  return {
    check: diagnostic.check,
    status: {
      value: diagnostic.status,
      label: DIAGNOSTIC_LABEL[diagnostic.status],
      tone: DIAGNOSTIC_TONE[diagnostic.status],
    },
    detail: diagnostic.detail,
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

export function toListItemVm(connector: ConnectorDto): ConnectorListItemVm {
  return {
    id: connector.id,
    slug: connector.slug,
    name: connector.name,
    provider: connector.provider,
    type: toTypeVm(connector.type),
    status: toStatusVm(connector.status),
    health: toHealthStatusVm(connector.health.status),
    environment: toEnvironmentVm(connector.environment),
    owner: connector.owner,
    version: connector.version,
    updatedLabel: dateLabel(connector.updatedAt),
    tags: connector.tags,
  };
}

export function toDetailVm(connector: ConnectorDto): ConnectorDetailVm {
  return {
    id: connector.id,
    slug: connector.slug,
    name: connector.name,
    provider: connector.provider,
    description: connector.description,
    type: toTypeVm(connector.type),
    typeLabel: typeLabel(connector.type),
    status: toStatusVm(connector.status),
    health: toHealthStatusVm(connector.health.status),
    environment: toEnvironmentVm(connector.environment),
    metadata: [
      { label: 'Provider', value: connector.provider },
      { label: 'Type', value: typeLabel(connector.type) },
      { label: 'Owner', value: connector.owner },
      { label: 'Team', value: connector.team },
      { label: 'Version', value: connector.version },
      { label: 'Registry ID', value: connector.registryId ?? 'Not registered' },
      { label: 'Environment', value: ENVIRONMENT_LABEL[connector.environment] },
      {
        label: 'Registered',
        value: connector.registeredAt ? dateLabel(connector.registeredAt) : '—',
      },
      { label: 'Updated', value: dateLabel(connector.updatedAt) },
    ],
    configuration: toConfigurationVm(connector.configuration),
    credentials: connector.credentials.map(toCredentialVm),
    capabilities: connector.capabilities.map(toCapabilityVm),
    healthDetail: toHealthVm(connector.health),
    metrics: toMetricsVm(connector.metrics),
    diagnostics: connector.diagnostics.map(toDiagnosticVm),
    validation: toValidationVm(connector.validation),
    lifecycle: toLifecycle(connector.lifecycle),
    activity: connector.activity.map((event) => ({
      id: event.id,
      label: event.label,
      actor: event.actor,
      occurredLabel: dateLabel(event.occurredAt),
    })),
    versions: connector.versions.map((version) => ({
      version: version.version,
      releasedLabel: dateLabel(version.releasedAt),
      note: version.note,
      apiVersion: version.apiVersion,
    })),
    tags: connector.tags,
  };
}

export function toSummaryVm(connectors: readonly ConnectorDto[]): ConnectorSummaryVm {
  const countOfStatus = (status: ConnectorStatusDto): number =>
    connectors.filter((connector) => connector.status === status).length;
  const countOfType = (type: ConnectorTypeDto): number =>
    connectors.filter((connector) => connector.type === type).length;
  const countOfHealth = (health: HealthStatusDto): number =>
    connectors.filter((connector) => connector.health.status === health).length;

  const byStatus: SummaryBucketVm[] = STATUS_ORDER.map((status) => ({
    value: status,
    label: STATUS_LABEL[status],
    count: countOfStatus(status),
    tone: STATUS_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  const byType: SummaryBucketVm[] = CONNECTOR_TYPE_ORDER.map((type) => ({
    value: type,
    label: typeLabel(type),
    count: countOfType(type),
    tone: TYPE_TONE[type],
  })).filter((bucket) => bucket.count > 0);

  return {
    total: connectors.length,
    enabled: countOfStatus('ENABLED'),
    degraded: countOfHealth('DEGRADED') + countOfHealth('DOWN'),
    retired: countOfStatus('RETIRED'),
    byStatus,
    byType,
  };
}
