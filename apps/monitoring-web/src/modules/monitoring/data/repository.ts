/**
 * Monitoring repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a
 * concrete data source and never touches infrastructure. Each method exposes one
 * slice of operational data.
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
import type { ServiceQuery } from '../domain/query';

export type { ServiceQuery };

export interface MonitoringRepository {
  overview(): Promise<PlatformOverviewDto>;
  services(query: ServiceQuery): Promise<readonly ServiceDto[]>;
  workflows(): Promise<readonly WorkflowMonitorDto[]>;
  executions(): Promise<readonly ExecutionMonitorDto[]>;
  validations(): Promise<readonly ValidationMonitorDto[]>;
  datasets(): Promise<readonly DatasetMonitorDto[]>;
  agents(): Promise<readonly AgentDto[]>;
  alerts(): Promise<readonly AlertDto[]>;
  incidents(): Promise<readonly IncidentDto[]>;
  metrics(): Promise<readonly MetricDto[]>;
  auditEvents(): Promise<readonly AuditEventDto[]>;
}
