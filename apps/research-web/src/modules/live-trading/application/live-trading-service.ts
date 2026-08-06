/**
 * Live Trading Platform application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository and maps canonical DTOs to view models, including
 * cross-deployment aggregation views (production orders, open/closed positions, account
 * balances, production health, trading timeline, trading audit, emergency controls). No
 * infrastructure, no exchange/broker SDK, no API keys, no HTTP/WebSocket/FIX, no order
 * execution, no PnL/exposure computation, no persistence. Aggregation is a pure
 * lookup/reshape.
 */
import {
  toAccountVm,
  toApprovalQueueItemVm,
  toAuditVm,
  toBalanceVm,
  toConnectionVm,
  toDetailVm,
  toEmergencyRowVm,
  toFamilyVm,
  toHealthRowVm,
  toHistoryItemVm,
  toListItemVm,
  toMetricsRowVm,
  toOrderVm,
  toPositionVm,
  toRunningItemVm,
  toSummaryVm,
  toTimelineVm,
} from '../domain/mappers';
import type { DeploymentQuery } from '../domain/query';
import type {
  AccountVm,
  AuditRowVm,
  BalanceRowVm,
  ConnectionVm,
  DeploymentDetailVm,
  DeploymentFamilyVm,
  DeploymentListItemVm,
  EmergencyRowVm,
  HealthRowVm,
  LiveTradingSummaryVm,
  MetricsOverviewRowVm,
  OrderRowVm,
  PositionRowVm,
  ProviderVm,
  QueueItemVm,
  TimelineRowVm,
} from '../domain/view-model';
import type { LiveTradingRepository } from '../data/repository';

export class LiveTradingAdminService {
  constructor(private readonly repository: LiveTradingRepository) {}

  async listDeployments(query: DeploymentQuery = {}): Promise<DeploymentListItemVm[]> {
    return (await this.repository.listDeployments(query)).map(toListItemVm);
  }

  async getDeployment(id: string): Promise<DeploymentDetailVm | null> {
    const deployment = await this.repository.getDeployment(id);
    return deployment ? toDetailVm(deployment) : null;
  }

  async listFamilies(): Promise<DeploymentFamilyVm[]> {
    return (await this.repository.listFamilies()).map(toFamilyVm);
  }

  async listAccounts(): Promise<AccountVm[]> {
    return (await this.repository.listAccounts()).map(toAccountVm);
  }

  async listConnections(): Promise<ConnectionVm[]> {
    return (await this.repository.listConnections()).map(toConnectionVm);
  }

  async listProviders(): Promise<ProviderVm[]> {
    return (await this.repository.listProviders()).map((provider) => ({
      id: provider.id,
      name: provider.name,
      kind: provider.kind.replace(/_/g, ' '),
      description: provider.description,
    }));
  }

  async getRunningStrategies(): Promise<QueueItemVm[]> {
    return (await this.repository.runningStrategies()).map(toRunningItemVm);
  }

  async getApprovalQueue(): Promise<QueueItemVm[]> {
    return (await this.repository.approvalQueue()).map(toApprovalQueueItemVm);
  }

  async getHistory(): Promise<QueueItemVm[]> {
    return (await this.repository.deploymentHistory()).map(toHistoryItemVm);
  }

  /** Production Orders — every order across the registry. */
  async getOrders(): Promise<OrderRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments.flatMap((deployment) =>
      deployment.orders.map((order) => ({
        ...toOrderVm(order),
        deploymentId: deployment.id,
        deploymentName: deployment.name,
      })),
    );
  }

  /** Open positions across the registry. */
  async getOpenPositions(): Promise<PositionRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments.flatMap((deployment) =>
      deployment.positions
        .filter((position) => position.open)
        .map((position) => ({
          ...toPositionVm(position),
          deploymentId: deployment.id,
          deploymentName: deployment.name,
        })),
    );
  }

  /** Closed positions across the registry. */
  async getClosedPositions(): Promise<PositionRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments.flatMap((deployment) =>
      deployment.positions
        .filter((position) => !position.open)
        .map((position) => ({
          ...toPositionVm(position),
          deploymentId: deployment.id,
          deploymentName: deployment.name,
        })),
    );
  }

  /** Account Balances across the registry. */
  async getBalances(): Promise<BalanceRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments.flatMap((deployment) =>
      deployment.balances.map((balance) => ({
        ...toBalanceVm(balance),
        accountId: balance.accountId,
        deploymentId: deployment.id,
        deploymentName: deployment.name,
      })),
    );
  }

  /** Production Health overview across the registry. */
  async getHealthOverview(): Promise<HealthRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments.map(toHealthRowVm);
  }

  /** Trading Timeline across the registry, newest first. */
  async getTimeline(): Promise<TimelineRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments
      .flatMap((deployment) => deployment.timeline.map((event) => ({ event, deployment })))
      .sort((a, b) => b.event.at.localeCompare(a.event.at))
      .map(({ event, deployment }) => ({
        ...toTimelineVm(event),
        deploymentId: deployment.id,
        deploymentName: deployment.name,
      }));
  }

  /** Trading Audit across the registry, newest first. */
  async getAudit(): Promise<AuditRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments
      .flatMap((deployment) => deployment.audit.map((entry) => ({ entry, deployment })))
      .sort((a, b) => b.entry.occurredAt.localeCompare(a.entry.occurredAt))
      .map(({ entry, deployment }) => ({
        ...toAuditVm(entry),
        deploymentId: deployment.id,
        deploymentName: deployment.name,
      }));
  }

  /** Trading Metrics overview — reported indicators per running deployment. */
  async getMetricsOverview(): Promise<MetricsOverviewRowVm[]> {
    return (await this.repository.runningStrategies()).map(toMetricsRowVm);
  }

  /** Emergency Controls — the always-available kill switch / emergency stop per deployment. */
  async getEmergencyControls(): Promise<EmergencyRowVm[]> {
    const deployments = await this.repository.listDeployments({});
    return deployments
      .filter((deployment) => deployment.stage !== 'ARCHIVED')
      .map(toEmergencyRowVm);
  }

  async getSummary(): Promise<LiveTradingSummaryVm> {
    const [deployments, accounts, connections, families] = await Promise.all([
      this.repository.listDeployments({}),
      this.repository.listAccounts(),
      this.repository.listConnections(),
      this.repository.listFamilies(),
    ]);
    return toSummaryVm(deployments, accounts.length, connections.length, families.length);
  }
}
