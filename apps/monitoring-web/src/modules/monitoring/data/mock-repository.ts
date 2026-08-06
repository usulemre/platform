/**
 * In-memory mock adapter for development. Synthetic operational METADATA ONLY —
 * no metrics collection, no alert delivery, no monitoring infrastructure, no
 * persistence (all out of scope / forbidden). All levels/statuses are
 * pre-classified. Values mirror the shapes the platform services expose.
 */
import type {
  AgentDto,
  AlertDto,
  AuditEventDto,
  DatasetMonitorDto,
  ExecutionMonitorDto,
  IncidentDto,
  MetricDto,
  PlatformOverviewDto,
  ServiceDto,
  ValidationMonitorDto,
  WorkflowMonitorDto,
} from '../domain/dto';
import { applyServiceQuery, type ServiceQuery } from '../domain/query';
import type { MonitoringRepository } from './repository';

const SERVICES: readonly ServiceDto[] = [
  {
    id: 'svc-research',
    name: 'research-service',
    category: 'Research',
    statusLabel: 'Healthy',
    level: 'OK',
    latency: '42ms',
    uptime: '99.98%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-dataset',
    name: 'dataset-service',
    category: 'Data',
    statusLabel: 'Healthy',
    level: 'OK',
    latency: '55ms',
    uptime: '99.95%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-validation',
    name: 'validation-service',
    category: 'Validation',
    statusLabel: 'Healthy',
    level: 'OK',
    latency: '61ms',
    uptime: '99.97%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-portfolio',
    name: 'portfolio-service',
    category: 'Portfolio',
    statusLabel: 'Degraded',
    level: 'WARN',
    latency: '180ms',
    uptime: '99.4%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-execution',
    name: 'execution-service',
    category: 'Execution',
    statusLabel: 'Healthy',
    level: 'OK',
    latency: '48ms',
    uptime: '99.96%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-monitoring',
    name: 'monitoring-service',
    category: 'Operations',
    statusLabel: 'Healthy',
    level: 'OK',
    latency: '38ms',
    uptime: '99.99%',
    lastCheck: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'svc-risk',
    name: 'risk-service',
    category: 'Risk',
    statusLabel: 'Unknown',
    level: 'NEUTRAL',
    latency: '—',
    uptime: '—',
    lastCheck: '2026-08-01T00:00:00.000Z',
  },
];

const WORKFLOWS: readonly WorkflowMonitorDto[] = [
  {
    id: 'wf-1',
    name: 'Validation',
    workflowRef: 'WFC-46',
    statusLabel: 'Running',
    level: 'INFO',
    currentStage: 'Purged/embargoed CV',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'wf-2',
    name: 'Risk review',
    workflowRef: 'WFC-47',
    statusLabel: 'Blocked',
    level: 'ERROR',
    currentStage: 'Committee escalation',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'wf-3',
    name: 'Production deployment',
    workflowRef: 'WFC-49',
    statusLabel: 'Running',
    level: 'INFO',
    currentStage: 'Paper run',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
];

const EXECUTIONS: readonly ExecutionMonitorDto[] = [
  {
    id: 'exec-core-paper',
    title: 'Core multi-strategy — paper',
    statusLabel: 'Authorized',
    level: 'OK',
    mode: 'Paper',
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
  {
    id: 'exec-mn-pending',
    title: 'Equity market-neutral — paper',
    statusLabel: 'Pending approval',
    level: 'WARN',
    mode: 'Paper',
    updatedAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'exec-fx-rejected',
    title: 'FX carry candidate',
    statusLabel: 'Rejected',
    level: 'ERROR',
    mode: 'Paper',
    updatedAt: '2026-07-30T00:00:00.000Z',
  },
];

const VALIDATIONS: readonly ValidationMonitorDto[] = [
  {
    id: 'val-1',
    subject: 'Reversal signal',
    statusLabel: 'Passed',
    level: 'OK',
    updatedAt: '2026-05-30T00:00:00.000Z',
  },
  {
    id: 'val-2',
    subject: 'FX carry signal',
    statusLabel: 'Pending',
    level: 'WARN',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'val-3',
    subject: 'Crowding score (feature)',
    statusLabel: 'Failed',
    level: 'ERROR',
    updatedAt: '2026-07-02T00:00:00.000Z',
  },
];

const DATASETS: readonly DatasetMonitorDto[] = [
  {
    id: 'ds-equity-eod',
    name: 'US Equity Prices (EOD)',
    statusLabel: 'Certified',
    level: 'OK',
    freshness: 'Fresh (1d)',
    updatedAt: '2026-07-28T00:00:00.000Z',
  },
  {
    id: 'ds-fx-spot',
    name: 'FX Spot Rates',
    statusLabel: 'Ingested',
    level: 'INFO',
    freshness: 'Fresh (0d)',
    updatedAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'ds-credit-spreads',
    name: 'Credit Spreads',
    statusLabel: 'Quarantined',
    level: 'ERROR',
    freshness: 'Stale (18d)',
    updatedAt: '2026-07-15T00:00:00.000Z',
  },
];

const AGENTS: readonly AgentDto[] = [
  {
    id: 'RD-001',
    name: 'Research discovery',
    authority: 'PROPOSES',
    statusLabel: 'Active',
    level: 'OK',
    lastSeen: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'VN-001',
    name: 'Validation narrator',
    authority: 'NARRATES',
    statusLabel: 'Active',
    level: 'OK',
    lastSeen: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'MO-001',
    name: 'Monitoring narrator',
    authority: 'NARRATES',
    statusLabel: 'Idle',
    level: 'NEUTRAL',
    lastSeen: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'EN-001',
    name: 'Engineering',
    authority: 'PROPOSES',
    statusLabel: 'Suspended',
    level: 'WARN',
    lastSeen: '2026-07-30T00:00:00.000Z',
  },
];

const ALERTS: readonly AlertDto[] = [
  {
    id: 'al-1',
    title: 'portfolio-service latency elevated',
    source: 'monitoring-service',
    severityLabel: 'Warning',
    level: 'WARN',
    raisedAt: '2026-08-02T00:00:00.000Z',
    acknowledged: false,
  },
  {
    id: 'al-2',
    title: 'Credit Spreads quarantined',
    source: 'dataset-service',
    severityLabel: 'Critical',
    level: 'ERROR',
    raisedAt: '2026-07-15T00:00:00.000Z',
    acknowledged: true,
  },
  {
    id: 'al-3',
    title: 'Risk review WFC-47 blocked',
    source: 'workflow-engine',
    severityLabel: 'Critical',
    level: 'ERROR',
    raisedAt: '2026-08-01T00:00:00.000Z',
    acknowledged: false,
  },
];

const INCIDENTS: readonly IncidentDto[] = [
  {
    id: 'inc-1',
    title: 'Credit data vendor outage',
    statusLabel: 'Mitigating',
    severityLabel: 'High',
    level: 'WARN',
    openedAt: '2026-07-15T00:00:00.000Z',
  },
  {
    id: 'inc-2',
    title: 'FX candidate liquidity breach',
    statusLabel: 'Open',
    severityLabel: 'High',
    level: 'ERROR',
    openedAt: '2026-07-29T00:00:00.000Z',
  },
];

const METRICS: readonly MetricDto[] = [
  { key: 'p99', label: 'API p99 latency', value: '120ms', level: 'OK' },
  { key: 'error-rate', label: 'Error rate (1h)', value: '0.3%', level: 'OK' },
  { key: 'queue-depth', label: 'Execution queue depth', value: '3', level: 'INFO' },
  { key: 'alerts-open', label: 'Open alerts', value: '2', level: 'WARN' },
];

const AUDIT: readonly AuditEventDto[] = [
  {
    id: 'au-1',
    actor: 'Execution Governance',
    action: 'Issued authorization token',
    target: 'exec-core-paper',
    occurredAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'au-2',
    actor: 'Risk Management',
    action: 'Rejected execution',
    target: 'exec-fx-rejected',
    occurredAt: '2026-07-29T00:00:00.000Z',
  },
  {
    id: 'au-3',
    actor: 'Scientific Governance',
    action: 'Approved strategy',
    target: 'str-reversal-ls',
    occurredAt: '2026-06-12T00:00:00.000Z',
  },
  {
    id: 'au-4',
    actor: 'Data Engineering',
    action: 'Quarantined dataset',
    target: 'ds-credit-spreads',
    occurredAt: '2026-07-15T00:00:00.000Z',
  },
];

const OVERVIEW: PlatformOverviewDto = {
  services: SERVICES.length,
  servicesHealthy: SERVICES.filter((service) => service.level === 'OK').length,
  workflowsRunning: WORKFLOWS.filter((workflow) => workflow.statusLabel === 'Running').length,
  executionsQueued: EXECUTIONS.length,
  agentsActive: AGENTS.filter((agent) => agent.statusLabel === 'Active').length,
  openAlerts: ALERTS.filter((alert) => !alert.acknowledged).length,
  openIncidents: INCIDENTS.filter((incident) => incident.statusLabel !== 'Resolved').length,
  system: {
    statusLabel: 'Operational (degraded)',
    level: 'WARN',
    message:
      'All critical services operational; portfolio-service degraded and one dataset quarantined.',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
};

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockMonitoringRepository implements MonitoringRepository {
  private readonly latencyMs: number;

  constructor(options: MockRepositoryOptions = {}) {
    this.latencyMs = options.latencyMs ?? 0;
  }

  async overview(): Promise<PlatformOverviewDto> {
    await this.delay();
    return OVERVIEW;
  }

  async services(query: ServiceQuery): Promise<readonly ServiceDto[]> {
    await this.delay();
    return applyServiceQuery(SERVICES, query);
  }

  async workflows(): Promise<readonly WorkflowMonitorDto[]> {
    await this.delay();
    return WORKFLOWS;
  }

  async executions(): Promise<readonly ExecutionMonitorDto[]> {
    await this.delay();
    return EXECUTIONS;
  }

  async validations(): Promise<readonly ValidationMonitorDto[]> {
    await this.delay();
    return VALIDATIONS;
  }

  async datasets(): Promise<readonly DatasetMonitorDto[]> {
    await this.delay();
    return DATASETS;
  }

  async agents(): Promise<readonly AgentDto[]> {
    await this.delay();
    return AGENTS;
  }

  async alerts(): Promise<readonly AlertDto[]> {
    await this.delay();
    return ALERTS;
  }

  async incidents(): Promise<readonly IncidentDto[]> {
    await this.delay();
    return INCIDENTS;
  }

  async metrics(): Promise<readonly MetricDto[]> {
    await this.delay();
    return METRICS;
  }

  async auditEvents(): Promise<readonly AuditEventDto[]> {
    await this.delay();
    return AUDIT;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const MONITORING_SEED = {
  services: SERVICES,
  workflows: WORKFLOWS,
  executions: EXECUTIONS,
  validations: VALIDATIONS,
  datasets: DATASETS,
  agents: AGENTS,
  alerts: ALERTS,
  incidents: INCIDENTS,
  metrics: METRICS,
  audit: AUDIT,
  overview: OVERVIEW,
} as const;
