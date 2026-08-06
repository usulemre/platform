/**
 * Monitoring application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository and maps operational DTOs to view models. No infrastructure, no
 * UI, no metrics collection, no alert delivery. It consumes operational data
 * exposed by platform services and never contains business logic.
 */
import {
  toAgentVm,
  toAlertVm,
  toAuditEventVm,
  toDatasetVm,
  toExecutionVm,
  toIncidentVm,
  toMetricVm,
  toOverviewVm,
  toServiceVm,
  toValidationVm,
  toWorkflowVm,
} from '../domain/mappers';
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
  ValidationVm,
  WorkflowVm,
} from '../domain/view-model';
import type { ServiceQuery } from '../domain/query';
import type { MonitoringRepository } from '../data/repository';

export class MonitoringService {
  constructor(private readonly repository: MonitoringRepository) {}

  async getOverview(): Promise<PlatformOverviewVm> {
    return toOverviewVm(await this.repository.overview());
  }

  async getServices(query: ServiceQuery = {}): Promise<ServiceVm[]> {
    return (await this.repository.services(query)).map(toServiceVm);
  }

  async getWorkflows(): Promise<WorkflowVm[]> {
    return (await this.repository.workflows()).map(toWorkflowVm);
  }

  async getExecutions(): Promise<ExecutionVm[]> {
    return (await this.repository.executions()).map(toExecutionVm);
  }

  async getValidations(): Promise<ValidationVm[]> {
    return (await this.repository.validations()).map(toValidationVm);
  }

  async getDatasets(): Promise<DatasetVm[]> {
    return (await this.repository.datasets()).map(toDatasetVm);
  }

  async getAgents(): Promise<AgentVm[]> {
    return (await this.repository.agents()).map(toAgentVm);
  }

  async getAlerts(): Promise<AlertVm[]> {
    return (await this.repository.alerts()).map(toAlertVm);
  }

  async getIncidents(): Promise<IncidentVm[]> {
    return (await this.repository.incidents()).map(toIncidentVm);
  }

  async getMetrics(): Promise<MetricVm[]> {
    return (await this.repository.metrics()).map(toMetricVm);
  }

  async getAuditEvents(): Promise<AuditEventVm[]> {
    return (await this.repository.auditEvents()).map(toAuditEventVm);
  }
}
