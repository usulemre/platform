/**
 * Execution application service — the ONLY layer the UI/hooks call. Orchestrates the repository and
 * maps canonical executions to view models, including cross-execution aggregate views (timeline,
 * audit, metrics, health) and the planner preview. No infrastructure, no broker/exchange SDK, no
 * execution, no persistence. The lifecycle/policy logic lives in the SDK / Execution Engine service.
 */
import {
  computeHealth,
  computeMetrics,
  policyCatalogVms,
  replay,
  toDetailVm,
  toHealthVm,
  toMetricsVm,
  toPlanPreviewVm,
  toReplayVm,
  toRowVm,
  toSessionVm,
  toSummaryVm,
  statusVm,
  venueVms,
} from '../domain/mappers';
import type { ExecutionQuery } from '../domain/query';
import { previewPlan, type PlannerInput } from '../data/planner';
import type {
  AuditRowVm,
  ExecutionDetailVm,
  ExecutionRowVm,
  ExecutionSummaryVm,
  HealthVm,
  MetricsVm,
  PlanPreviewVm,
  PolicyDescriptorVm,
  ReplayVm,
  SessionVm,
  StatusVm,
  TimelineRowVm,
  VenueVm,
} from '../domain/view-model';
import type { ExecutionRepository } from '../data/repository';

export interface ExecutionRefVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly status: StatusVm;
}

export class ExecutionAdminService {
  constructor(private readonly repository: ExecutionRepository) {}

  async listExecutions(query: ExecutionQuery = {}): Promise<ExecutionRowVm[]> {
    return (await this.repository.listExecutions(query)).map(toRowVm);
  }

  async getExecution(id: string): Promise<ExecutionDetailVm | null> {
    const execution = await this.repository.getExecution(id);
    return execution ? toDetailVm(execution) : null;
  }

  async getSummary(): Promise<ExecutionSummaryVm> {
    return toSummaryVm(await this.repository.listAll());
  }

  async getMetrics(): Promise<MetricsVm> {
    return toMetricsVm(computeMetrics(await this.repository.listAll()));
  }

  async getHealth(): Promise<HealthVm> {
    return toHealthVm(computeHealth(await this.repository.listAll()));
  }

  async getTimeline(): Promise<TimelineRowVm[]> {
    const executions = await this.repository.listAll();
    return executions
      .flatMap((execution) => execution.events.map((event) => ({ event, execution })))
      .sort((a, b) => b.event.at.localeCompare(a.event.at))
      .map(({ event, execution }) => ({
        id: event.id,
        type: event.type.replace(/_/g, ' '),
        status: event.status ? statusVm(event.status) : undefined,
        message: event.message,
        actor: event.actor,
        atLabel: event.at.slice(0, 16).replace('T', ' '),
        tone: event.type === 'FAILED' ? 'danger' : event.type === 'COMPLETED' ? 'positive' : 'info',
        executionId: execution.id,
        clientOrderId: execution.clientOrderId,
        symbol: execution.symbol,
      }));
  }

  async getAudit(): Promise<AuditRowVm[]> {
    const executions = await this.repository.listAll();
    return executions
      .flatMap((execution) => execution.audit.map((entry) => ({ entry, execution })))
      .sort((a, b) => b.entry.at.localeCompare(a.entry.at))
      .map(({ entry, execution }) => ({
        id: entry.id,
        actor: entry.actor,
        action: entry.action.replace(/_/g, ' '),
        detail: entry.detail,
        atLabel: entry.at.slice(0, 16).replace('T', ' '),
        executionId: execution.id,
        clientOrderId: execution.clientOrderId,
      }));
  }

  async getReplay(id: string): Promise<ReplayVm | null> {
    const execution = await this.repository.getExecution(id);
    return execution ? toReplayVm(execution, replay(execution)) : null;
  }

  async listRefs(): Promise<ExecutionRefVm[]> {
    return (await this.repository.listAll()).map((execution) => ({
      id: execution.id,
      clientOrderId: execution.clientOrderId,
      symbol: execution.symbol,
      status: statusVm(execution.status),
    }));
  }

  listPolicies(): PolicyDescriptorVm[] {
    return policyCatalogVms();
  }

  listVenues(): VenueVm[] {
    return venueVms();
  }

  async listSessions(): Promise<SessionVm[]> {
    return (await this.repository.listSessions()).map(toSessionVm);
  }

  planPreview(input: PlannerInput): PlanPreviewVm {
    return toPlanPreviewVm(previewPlan(input));
  }
}
