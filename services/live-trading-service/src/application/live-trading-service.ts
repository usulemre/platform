/**
 * Live-trading application service — the orchestration surface of the canonical Live
 * Trading Platform. It coordinates the deployment lifecycle (candidate → deployment
 * request → risk approval → deployment approval → production ready → running → paused →
 * stopped → archived), the runtime controls (pause / resume / stop / restart / rollback),
 * the always-available emergency stop and kill switch, discovery/search, registry reads,
 * accounts, broker connections/providers, the running-strategies view, the approval queue,
 * deployment history, health, metrics and audit across the other subsystems (Execution
 * Simulator, Risk Engine, Portfolio Construction Engine, Signal Engine, Market Data
 * Platform, Connector Management, Configuration Foundation, Validation Foundation,
 * Workflow Engine, Authentication, Audit Center, Monitoring Module, Notification Center)
 * through ports ONLY.
 *
 * It holds no infrastructure, no exchange/broker SDK, no API keys, no HTTP/WebSocket/FIX,
 * no order execution, no PnL/exposure computation and no persistence. Default posture is
 * paper/shadow; live execution requires a valid governance authorization token. The kill
 * switch is ALWAYS honoured and is never gated by AI.
 */
import {
  METRIC_CATALOG,
  PROVIDERS,
  type BrokerConnection,
  type Deployment,
  type DeploymentFamily,
  type DeploymentStage,
  type DeploymentVersion,
  type MetricDescriptor,
  type ProviderDescriptor,
  type TradingAccount,
} from '@platform/trading-sdk';
import {
  approvalQueue,
  currentVersion,
  deploymentHistory,
  runningStrategies,
} from '../domain/derivations';
import { resolveByKey, searchDeployments, type DeploymentSearch } from '../domain/discovery';
import {
  canEngageKillSwitch,
  isEmergencyStoppable,
  isPausable,
  isRestartable,
  isResumable,
  isRollbackable,
  isStoppable,
  proposedNextStage,
} from '../domain/lifecycle';
import type {
  AccountQueryPort,
  AuditPort,
  AuthorizationPort,
  BrokerGatewayPort,
  ConfigurationPort,
  ConnectionQueryPort,
  DeploymentQueryPort,
  EventBusPort,
  FamilyQueryPort,
  NotificationPort,
  RiskPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface LiveTradingSummary {
  readonly totalDeployments: number;
  readonly running: number;
  readonly paused: number;
  readonly halted: number;
  readonly awaitingApproval: number;
  readonly live: number;
  readonly paper: number;
  readonly accounts: number;
  readonly connections: number;
  readonly families: number;
  readonly byStage: readonly { readonly stage: DeploymentStage; readonly count: number }[];
}

export type RuntimeControl = 'pause' | 'resume' | 'stop' | 'restart' | 'rollback';

export interface LiveTradingServiceDeps {
  readonly deployments: DeploymentQueryPort;
  readonly families: FamilyQueryPort;
  readonly accounts: AccountQueryPort;
  readonly connections: ConnectionQueryPort;
  readonly risk: RiskPort;
  readonly validation: ValidationPort;
  readonly authorization: AuthorizationPort;
  readonly broker: BrokerGatewayPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly config: ConfigurationPort;
}

export class LiveTradingService {
  constructor(private readonly deps: LiveTradingServiceDeps) {}

  /** Deployment registry — every registered deployment. */
  listDeployments(): Promise<readonly Deployment[]> {
    return this.deps.deployments.list();
  }

  /** Registry Explorer / Search — pure filter over the registry. */
  async searchDeployments(query: DeploymentSearch = {}): Promise<readonly Deployment[]> {
    return searchDeployments(await this.deps.deployments.list(), query);
  }

  /** Deployment details — resolve one deployment by id. */
  getDeployment(id: string): Promise<Deployment | null> {
    return this.deps.deployments.getById(id);
  }

  /** Resolve a deployment by its canonical `namespace/family/name` key. */
  async resolveDeployment(key: string): Promise<Deployment | null> {
    return resolveByKey(await this.deps.deployments.list(), key);
  }

  /** The current recommended version (newest by semantic order). */
  async currentVersion(id: string): Promise<DeploymentVersion | null> {
    const deployment = await this.deps.deployments.getById(id);
    return deployment ? currentVersion(deployment) : null;
  }

  /** The stage a deployment would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<DeploymentStage | null> {
    const deployment = await this.deps.deployments.getById(id);
    return deployment ? proposedNextStage(deployment) : null;
  }

  /** Deployment family browsing. */
  listFamilies(): Promise<readonly DeploymentFamily[]> {
    return this.deps.families.list();
  }

  /** Trading Accounts. */
  listAccounts(): Promise<readonly TradingAccount[]> {
    return this.deps.accounts.list();
  }

  /** Exchange / Broker Connections (abstractions only). */
  listConnections(): Promise<readonly BrokerConnection[]> {
    return this.deps.connections.list();
  }

  /** The supported broker/exchange provider placeholders (abstractions only). */
  listProviders(): readonly ProviderDescriptor[] {
    return PROVIDERS;
  }

  /** The metric catalog — descriptors only; nothing is computed. */
  metricCatalog(): readonly MetricDescriptor[] {
    return METRIC_CATALOG;
  }

  /** Running Strategies — deployments with an active runtime (running/paused). */
  async runningStrategies(): Promise<readonly Deployment[]> {
    return runningStrategies(await this.deps.deployments.list());
  }

  /** Deployments awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly Deployment[]> {
    return approvalQueue(await this.deps.deployments.list());
  }

  /** Deployment History — stopped / archived deployments. */
  async deploymentHistory(): Promise<readonly Deployment[]> {
    return deploymentHistory(await this.deps.deployments.list());
  }

  /** Whether a deployment cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  /** Whether a deployment cleared pre-deployment risk approval (decided by Risk). */
  isRiskApproved(id: string): Promise<boolean> {
    return this.deps.risk.isRiskApproved(id);
  }

  /** Whether a valid live authorization token exists (decided by Authentication/governance). */
  isLiveAuthorized(id: string): Promise<boolean> {
    return this.deps.authorization.isLiveAuthorized(id);
  }

  async getSummary(): Promise<LiveTradingSummary> {
    const [deployments, families, accounts, connections] = await Promise.all([
      this.deps.deployments.list(),
      this.deps.families.list(),
      this.deps.accounts.list(),
      this.deps.connections.list(),
    ]);
    const stageCount = new Map<DeploymentStage, number>();
    for (const deployment of deployments)
      stageCount.set(deployment.stage, (stageCount.get(deployment.stage) ?? 0) + 1);
    return {
      totalDeployments: deployments.length,
      running: deployments.filter((d) => d.runtime.status === 'RUNNING').length,
      paused: deployments.filter((d) => d.runtime.status === 'PAUSED').length,
      halted: deployments.filter((d) => d.runtime.status === 'HALTED').length,
      awaitingApproval: approvalQueue(deployments).length,
      live: deployments.filter((d) => d.mode === 'LIVE').length,
      paper: deployments.filter((d) => d.mode === 'PAPER' || d.mode === 'SHADOW').length,
      accounts: accounts.length,
      connections: connections.length,
      families: families.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /** Request a production deployment (governed; executed elsewhere after the gates). */
  async requestDeployment(deploymentId: string, at: string): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;
    await this.deps.broker.deploy(deploymentId);
    await this.deps.workflow.scheduleDeployment(deploymentId);
    await this.deps.audit.record({
      deploymentId,
      actor: 'live-trading',
      action: 'DEPLOYMENT_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${deploymentId}:DEPLOYMENT_REQUESTED:${at}`,
      deploymentId,
      type: 'DEPLOYMENT_REQUESTED',
      message: `Deployment requested for ${deployment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request pre-deployment risk approval (decided by the Risk Engine / accountable humans). */
  async requestRiskApproval(deploymentId: string, at: string): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;
    await this.deps.workflow.scheduleRiskApproval(deploymentId);
    await this.deps.audit.record({
      deploymentId,
      actor: 'live-trading',
      action: 'RISK_APPROVAL_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${deploymentId}:RISK_APPROVAL_REQUESTED:${at}`,
      deploymentId,
      type: 'RISK_APPROVAL_REQUESTED',
      message: `Risk approval requested for ${deployment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /** Request governance deployment approval (issues a time-boxed authorization token). */
  async requestDeploymentApproval(deploymentId: string, at: string): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;
    await this.deps.workflow.scheduleDeploymentApproval(deploymentId);
    await this.deps.notifications.notify({
      deploymentId,
      channel: 'deployment-governance',
      summary: `Deployment approval requested for ${deployment.name}.`,
    });
    await this.deps.audit.record({
      deploymentId,
      actor: 'live-trading',
      action: 'DEPLOYMENT_APPROVAL_REQUESTED',
      at,
    });
    await this.deps.bus.publish({
      id: `${deploymentId}:DEPLOYMENT_APPROVAL_REQUESTED:${at}`,
      deploymentId,
      type: 'DEPLOYMENT_APPROVAL_REQUESTED',
      message: `Deployment approval requested for ${deployment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Apply a normal runtime control (pause / resume / stop / restart / rollback). Returns
   * false when the control is not structurally permitted for the current runtime state or
   * the deployment is unknown. The actual state transition happens in the broker gateway.
   */
  async controlRuntime(
    deploymentId: string,
    control: RuntimeControl,
    at: string,
  ): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;

    const allowed =
      (control === 'pause' && isPausable(deployment)) ||
      (control === 'resume' && isResumable(deployment)) ||
      (control === 'stop' && isStoppable(deployment)) ||
      (control === 'restart' && isRestartable(deployment)) ||
      (control === 'rollback' && isRollbackable(deployment));
    if (!allowed) return false;

    if (control === 'pause') await this.deps.broker.pause(deploymentId);
    else if (control === 'resume') await this.deps.broker.resume(deploymentId);
    else if (control === 'stop') await this.deps.broker.stop(deploymentId);
    else if (control === 'restart') await this.deps.broker.restart(deploymentId);
    else await this.deps.broker.rollback(deploymentId);

    const type =
      control === 'pause'
        ? 'RUNTIME_PAUSED'
        : control === 'resume'
          ? 'RUNTIME_RESUMED'
          : control === 'stop'
            ? 'RUNTIME_STOPPED'
            : control === 'restart'
              ? 'RUNTIME_RESTARTED'
              : 'ROLLBACK_REQUESTED';
    await this.deps.audit.record({ deploymentId, actor: 'live-trading', action: type, at });
    await this.deps.bus.publish({
      id: `${deploymentId}:${type}:${at}`,
      deploymentId,
      type,
      message: `${type} for ${deployment.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Emergency stop — a human authority. Applicable to any non-stopped deployment; returns
   * false only for an unknown or already-stopped deployment. Never gated by AI.
   */
  async emergencyStop(deploymentId: string, actor: string, at: string): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;
    if (!isEmergencyStoppable(deployment)) return false;
    await this.deps.broker.emergencyStop(deploymentId);
    await this.deps.notifications.notify({
      deploymentId,
      channel: 'trading-ops',
      summary: `EMERGENCY STOP for ${deployment.name} by ${actor}.`,
    });
    await this.deps.audit.record({ deploymentId, actor, action: 'EMERGENCY_STOP', at });
    await this.deps.bus.publish({
      id: `${deploymentId}:EMERGENCY_STOP:${at}`,
      deploymentId,
      type: 'EMERGENCY_STOP',
      message: `Emergency stop for ${deployment.name} by ${actor}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Engage the kill switch — the ALWAYS-available human authority (HO-4). It forces the
   * deployment to halt and is NEVER gated by AI. Returns false only for an unknown or
   * already-archived deployment.
   */
  async engageKillSwitch(deploymentId: string, actor: string, at: string): Promise<boolean> {
    const deployment = await this.deps.deployments.getById(deploymentId);
    if (!deployment) return false;
    if (!canEngageKillSwitch(deployment)) return false;
    await this.deps.broker.engageKillSwitch(deploymentId);
    await this.deps.notifications.notify({
      deploymentId,
      channel: 'trading-ops',
      summary: `KILL SWITCH engaged for ${deployment.name} by ${actor}.`,
    });
    await this.deps.audit.record({ deploymentId, actor, action: 'KILL_SWITCH_ENGAGED', at });
    await this.deps.bus.publish({
      id: `${deploymentId}:KILL_SWITCH_ENGAGED:${at}`,
      deploymentId,
      type: 'KILL_SWITCH_ENGAGED',
      message: `Kill switch engaged for ${deployment.name} by ${actor}.`,
      occurredAt: at,
    });
    return true;
  }
}
