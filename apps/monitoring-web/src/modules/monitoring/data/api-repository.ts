/**
 * Real adapter over the governed API gateway (Monitoring Service). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never metrics collection, never alert delivery.
 */
import type { ApiClient } from '@platform/api-client';
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
import type { ServiceQuery } from '../domain/query';
import type { MonitoringRepository } from './repository';

function serviceQueryString(query: ServiceQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.level && query.level !== 'ALL') params.set('level', query.level);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiMonitoringRepository implements MonitoringRepository {
  constructor(private readonly api: ApiClient) {}

  overview(): Promise<PlatformOverviewDto> {
    return this.api.request<PlatformOverviewDto>('/monitoring/overview');
  }

  services(query: ServiceQuery): Promise<readonly ServiceDto[]> {
    return this.api.request<readonly ServiceDto[]>(
      `/monitoring/services${serviceQueryString(query)}`,
    );
  }

  workflows(): Promise<readonly WorkflowMonitorDto[]> {
    return this.api.request<readonly WorkflowMonitorDto[]>('/monitoring/workflows');
  }

  executions(): Promise<readonly ExecutionMonitorDto[]> {
    return this.api.request<readonly ExecutionMonitorDto[]>('/monitoring/executions');
  }

  validations(): Promise<readonly ValidationMonitorDto[]> {
    return this.api.request<readonly ValidationMonitorDto[]>('/monitoring/validations');
  }

  datasets(): Promise<readonly DatasetMonitorDto[]> {
    return this.api.request<readonly DatasetMonitorDto[]>('/monitoring/datasets');
  }

  agents(): Promise<readonly AgentDto[]> {
    return this.api.request<readonly AgentDto[]>('/monitoring/agents');
  }

  alerts(): Promise<readonly AlertDto[]> {
    return this.api.request<readonly AlertDto[]>('/monitoring/alerts');
  }

  incidents(): Promise<readonly IncidentDto[]> {
    return this.api.request<readonly IncidentDto[]>('/monitoring/incidents');
  }

  metrics(): Promise<readonly MetricDto[]> {
    return this.api.request<readonly MetricDto[]>('/monitoring/metrics');
  }

  auditEvents(): Promise<readonly AuditEventDto[]> {
    return this.api.request<readonly AuditEventDto[]>('/monitoring/audit');
  }
}
