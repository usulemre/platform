/**
 * Execution Simulator application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models. No infrastructure,
 * no execution algorithm, no exchange/broker connectivity, no fill/price/PnL computation,
 * no persistence. Aggregation and comparison assembly are pure lookups/reshapes.
 */
import {
  toApprovalQueueItemVm,
  toComparisonListItemVm,
  toComparisonVm,
  toDetailVm,
  toExecutionQueueItemVm,
  toFamilyVm,
  toListItemVm,
  toReportVm,
  toReviewQueueItemVm,
  toSummaryVm,
  toTemplateVm,
} from '../domain/mappers';
import type { SessionQuery } from '../domain/query';
import type {
  ComparisonListItemVm,
  ComparisonVm,
  ExecutionSimulatorSummaryVm,
  QueueItemVm,
  ReportRowVm,
  ScenarioTemplateVm,
  SessionDetailVm,
  SessionFamilyVm,
  SessionListItemVm,
} from '../domain/view-model';
import type { ExecutionSimulatorRepository } from '../data/repository';

export class ExecutionSimulatorAdminService {
  constructor(private readonly repository: ExecutionSimulatorRepository) {}

  async listSessions(query: SessionQuery = {}): Promise<SessionListItemVm[]> {
    return (await this.repository.listSessions(query)).map(toListItemVm);
  }

  async getSession(id: string): Promise<SessionDetailVm | null> {
    const session = await this.repository.getSession(id);
    return session ? toDetailVm(session) : null;
  }

  async listFamilies(): Promise<SessionFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async listTemplates(): Promise<ScenarioTemplateVm[]> {
    return (await this.repository.listTemplates()).map(toTemplateVm);
  }

  async getExecutionQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.executionQueue()).map(toExecutionQueueItemVm);
  }

  async getReviewQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.reviewQueue()).map(toReviewQueueItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  async getHistory(): Promise<SessionListItemVm[]> {
    return (await this.repository.history()).map(toListItemVm);
  }

  /** Execution Reports — every generated report reference across sessions. */
  async getReports(): Promise<ReportRowVm[]> {
    const sessions = await this.repository.listSessions({});
    return sessions.flatMap((session) =>
      session.reports.map((report) => ({
        ...toReportVm(report),
        sessionId: session.id,
        sessionName: session.name,
      })),
    );
  }

  async listComparisons(): Promise<ComparisonListItemVm[]> {
    return (await this.repository.listComparisons()).map(toComparisonListItemVm);
  }

  async getComparison(id: string): Promise<ComparisonVm | null> {
    const comparison = await this.repository.getComparison(id);
    if (!comparison) return null;
    const sessions = await this.repository.listSessions({});
    return toComparisonVm(comparison, sessions);
  }

  async getSummary(): Promise<ExecutionSimulatorSummaryVm> {
    const [sessions, families, templates, comparisons] = await Promise.all([
      this.repository.listSessions({}),
      this.repository.listFamilies(),
      this.repository.listTemplates(),
      this.repository.listComparisons(),
    ]);
    return toSummaryVm(sessions, families.length, templates.length, comparisons.length);
  }
}
