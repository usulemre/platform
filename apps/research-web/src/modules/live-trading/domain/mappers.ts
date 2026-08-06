/**
 * DTO → view-model mappings + summary aggregation for the researcher (research-web) Live
 * Trading Platform module. All presentation and aggregation decisions live here so UI
 * components stay logic-free. Pure and deterministic. Stage labels/ordering,
 * runtime-control predicates, the metric catalog and the canonical key come from
 * `@platform/trading-sdk`. Quantities, prices, balances, exposures and metric VALUES are
 * passed through unchanged — never computed. The kill switch and emergency stop are always
 * enabled (human authority; never gated by AI).
 */
import {
  DEPLOYMENT_STAGES,
  canPause,
  canRestart,
  canResume,
  canStop,
  compareVersions,
  deploymentKey,
  describeBrokerKind,
  describeMetric,
  describeStage,
  stageOrder,
  type AccountBalance,
  type ApprovalStatus,
  type BrokerConnection,
  type ConnectionStatus,
  type DependencyKind,
  type DependencyStatus,
  type Deployment,
  type DeploymentDependency,
  type DeploymentFamily,
  type DeploymentStage,
  type DeploymentVersion,
  type EmergencyAction,
  type ExecutionMode,
  type HealthStatus,
  type KillSwitchStatus,
  type LineageNode,
  type LineageNodeKind,
  type MetricKey,
  type OrderStatus,
  type PositionSide,
  type RuntimeStatus,
  type TradingAccount,
  type TradingApproval,
  type TradingAudit,
  type TradingMetric,
  type TradingOrder,
  type TradingPosition,
  type TradingTimelineEvent,
  type ValidationStatus,
} from '@platform/trading-sdk';
import type {
  AccountVm,
  ApprovalVm,
  AuditVm,
  ConnectionVm,
  DependencyVm,
  DeploymentDetailVm,
  DeploymentFamilyVm,
  DeploymentListItemVm,
  EmergencyActionVm,
  HealthVm,
  LineageVm,
  LiveTradingSummaryVm,
  MetricVm,
  OrderVm,
  PositionVm,
  QueueItemVm,
  RuntimeControlVm,
  StageStepVm,
  StatusVm,
  SummaryBucketVm,
  TimelineEventVm,
  Tone,
  VersionVm,
} from './view-model';

const STAGE_TONE: Record<DeploymentStage, Tone> = {
  CANDIDATE_STRATEGY: 'neutral',
  DEPLOYMENT_REQUEST: 'info',
  RISK_APPROVAL: 'warning',
  DEPLOYMENT_APPROVAL: 'warning',
  PRODUCTION_READY: 'info',
  RUNNING: 'positive',
  PAUSED: 'warning',
  STOPPED: 'neutral',
  ARCHIVED: 'neutral',
};

const RUNTIME_LABEL: Record<RuntimeStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  PAUSED: 'Paused',
  STOPPED: 'Stopped',
  HALTED: 'Halted',
};
const RUNTIME_TONE: Record<RuntimeStatus, Tone> = {
  PENDING: 'neutral',
  RUNNING: 'positive',
  PAUSED: 'warning',
  STOPPED: 'neutral',
  HALTED: 'danger',
};

const MODE_LABEL: Record<ExecutionMode, string> = {
  PAPER: 'Paper',
  SHADOW: 'Shadow',
  LIVE: 'Live',
};
const MODE_TONE: Record<ExecutionMode, Tone> = { PAPER: 'neutral', SHADOW: 'info', LIVE: 'danger' };

const ORDER_LABEL: Record<OrderStatus, string> = {
  CREATED: 'Created',
  VALIDATED: 'Validated',
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  PARTIALLY_FILLED: 'Partially filled',
  FILLED: 'Filled',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};
const ORDER_TONE: Record<OrderStatus, Tone> = {
  CREATED: 'neutral',
  VALIDATED: 'info',
  SUBMITTED: 'info',
  ACCEPTED: 'info',
  PARTIALLY_FILLED: 'warning',
  FILLED: 'positive',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  EXPIRED: 'neutral',
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  UNHEALTHY: 'Unhealthy',
  UNKNOWN: 'Unknown',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'warning',
  UNHEALTHY: 'danger',
  UNKNOWN: 'neutral',
};

const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  DISCONNECTED: 'Disconnected',
  CONFIGURED: 'Configured',
  AUTHORIZED: 'Authorized',
  ERROR: 'Error',
};
const CONNECTION_TONE: Record<ConnectionStatus, Tone> = {
  DISCONNECTED: 'neutral',
  CONFIGURED: 'info',
  AUTHORIZED: 'positive',
  ERROR: 'danger',
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUESTED: 'Not requested',
};
const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  NOT_REQUESTED: 'neutral',
};

const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};
const VALIDATION_TONE: Record<ValidationStatus, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};

const KILL_LABEL: Record<KillSwitchStatus, string> = { ARMED: 'Armed', ENGAGED: 'Engaged' };
const KILL_TONE: Record<KillSwitchStatus, Tone> = { ARMED: 'info', ENGAGED: 'danger' };

const DEP_LABEL: Record<DependencyStatus, string> = {
  SATISFIED: 'Satisfied',
  PENDING: 'Pending',
  MISSING: 'Missing',
};
const DEP_TONE: Record<DependencyStatus, Tone> = {
  SATISFIED: 'positive',
  PENDING: 'warning',
  MISSING: 'danger',
};

const SIDE_TONE: Record<string, Tone> = {
  BUY: 'positive',
  SELL: 'danger',
  LONG: 'positive',
  SHORT: 'danger',
  FLAT: 'neutral',
};
const POSITION_LABEL: Record<PositionSide, string> = { LONG: 'Long', SHORT: 'Short', FLAT: 'Flat' };
const TIMELINE_TONE: Record<string, Tone> = {
  DEPLOYMENT: 'info',
  ORDER: 'positive',
  POSITION: 'neutral',
  HEALTH: 'info',
  EMERGENCY: 'danger',
  SESSION: 'info',
};

/** Cross-link routes into the research-web modules. */
const DEP_ROUTE: Record<DependencyKind, string> = {
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolio-construction',
  SIGNAL: '/signals',
  SIMULATION: '/execution-simulator',
  BACKTEST: '/backtesting',
  ACCOUNT: '/live-trading',
};
const LINEAGE_ROUTE: Partial<Record<LineageNodeKind, string>> = {
  STRATEGY: '/strategies',
  PORTFOLIO: '/portfolio-construction',
  SIGNAL: '/signals',
  SIMULATION: '/execution-simulator',
  BACKTEST: '/backtesting',
};

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function dateTimeLabel(iso: string): string {
  return iso.slice(0, 16).replace('T', ' ');
}

function stageStatus(stage: DeploymentStage): StatusVm {
  return { value: stage, label: describeStage(stage).label, tone: STAGE_TONE[stage] };
}

function runtimeStatus(status: RuntimeStatus): StatusVm {
  return { value: status, label: RUNTIME_LABEL[status], tone: RUNTIME_TONE[status] };
}

function modeStatus(mode: ExecutionMode): StatusVm {
  return { value: mode, label: MODE_LABEL[mode], tone: MODE_TONE[mode] };
}

function healthStatus(status: HealthStatus): StatusVm {
  return { value: status, label: HEALTH_LABEL[status], tone: HEALTH_TONE[status] };
}

function connectionStatus(status: ConnectionStatus): StatusVm {
  return { value: status, label: CONNECTION_LABEL[status], tone: CONNECTION_TONE[status] };
}

function approvalStatus(status: ApprovalStatus): StatusVm {
  return { value: status, label: APPROVAL_LABEL[status], tone: APPROVAL_TONE[status] };
}

function killStatus(status: KillSwitchStatus): StatusVm {
  return { value: status, label: KILL_LABEL[status], tone: KILL_TONE[status] };
}

function sideStatus(side: string): StatusVm {
  return {
    value: side,
    label: side.charAt(0) + side.slice(1).toLowerCase(),
    tone: SIDE_TONE[side] ?? 'neutral',
  };
}

export function toMetricVm(metric: TradingMetric): MetricVm {
  const descriptor = describeMetric(metric.key);
  return {
    key: metric.key,
    label: descriptor?.label ?? metric.key,
    value: metric.value,
    unit: descriptor?.unit ?? '',
  };
}

function toProgressVm(deployment: Deployment): {
  percent: number;
  label: string;
  currentStageLabel: string;
} {
  const total = DEPLOYMENT_STAGES.length;
  const completed = stageOrder(deployment.stage) + 1;
  return {
    percent: Math.round((completed / total) * 100),
    label: `${completed}/${total} stages`,
    currentStageLabel: describeStage(deployment.stage).label,
  };
}

function toStageSteps(deployment: Deployment): StageStepVm[] {
  const currentOrder = stageOrder(deployment.stage);
  const blocked = deployment.runtime.status === 'HALTED';
  return DEPLOYMENT_STAGES.map((stage) => {
    const order = stageOrder(stage);
    let state: StatusVm;
    if (order < currentOrder) state = { value: 'COMPLETE', label: 'Complete', tone: 'positive' };
    else if (order === currentOrder)
      state = blocked
        ? { value: 'HALTED', label: 'Halted', tone: 'danger' }
        : { value: 'CURRENT', label: 'Current', tone: 'info' };
    else state = { value: 'PENDING', label: 'Pending', tone: 'neutral' };
    return { stage, label: describeStage(stage).label, state, gate: describeStage(stage).gate };
  });
}

/** Runtime controls including the ALWAYS-available emergency stop and kill switch. */
function toRuntimeControls(deployment: Deployment): RuntimeControlVm[] {
  const status = deployment.runtime.status;
  const notArchived = deployment.stage !== 'ARCHIVED';
  return [
    { control: 'pause', label: 'Pause', enabled: canPause(status), emergency: false },
    { control: 'resume', label: 'Resume', enabled: canResume(status), emergency: false },
    { control: 'stop', label: 'Stop', enabled: canStop(status), emergency: false },
    { control: 'restart', label: 'Restart', enabled: canRestart(status), emergency: false },
    {
      control: 'rollback',
      label: 'Rollback',
      enabled:
        deployment.stage === 'RUNNING' ||
        deployment.stage === 'PAUSED' ||
        deployment.stage === 'STOPPED',
      emergency: false,
    },
    {
      control: 'emergency-stop',
      label: 'Emergency stop',
      enabled: status !== 'STOPPED',
      emergency: true,
    },
    { control: 'kill-switch', label: 'Kill switch', enabled: notArchived, emergency: true },
  ];
}

export function toOrderVm(order: TradingOrder): OrderVm {
  return {
    id: order.id,
    clientOrderId: order.clientOrderId,
    symbol: order.symbol,
    side: sideStatus(order.side),
    type: order.type.replace('_', ' '),
    quantity: order.quantity,
    limitPrice: order.limitPrice ?? '—',
    filledQuantity: order.filledQuantity,
    status: {
      value: order.status,
      label: ORDER_LABEL[order.status],
      tone: ORDER_TONE[order.status],
    },
    createdLabel: dateTimeLabel(order.createdAt),
  };
}

export function toPositionVm(position: TradingPosition): PositionVm {
  return {
    id: position.id,
    symbol: position.symbol,
    side: {
      value: position.side,
      label: POSITION_LABEL[position.side],
      tone: SIDE_TONE[position.side] ?? 'neutral',
    },
    quantity: position.quantity,
    averagePrice: position.averagePrice,
    marketValue: position.marketValue,
    unrealizedPnl: position.unrealizedPnl,
    realizedPnl: position.realizedPnl,
    open: position.open,
  };
}

export function toAccountVm(account: TradingAccount): AccountVm {
  return {
    id: account.id,
    name: account.name,
    brokerKind: describeBrokerKind(account.brokerKind).label,
    provider: account.provider,
    mode: modeStatus(account.mode),
    baseCurrency: account.baseCurrency,
    status: connectionStatus(account.status),
  };
}

export function toConnectionVm(connection: BrokerConnection): ConnectionVm {
  return {
    id: connection.id,
    provider: connection.provider,
    brokerKind: describeBrokerKind(connection.brokerKind).label,
    label: connection.label,
    mode: modeStatus(connection.mode),
    status: connectionStatus(connection.status),
    credentialRef: connection.credentialRef,
    note: connection.note,
  };
}

export function toBalanceVm(balance: AccountBalance): {
  id: string;
  asset: string;
  total: string;
  available: string;
  reserved: string;
} {
  return {
    id: balance.id,
    asset: balance.asset,
    total: balance.total,
    available: balance.available,
    reserved: balance.reserved,
  };
}

function toHealthVm(deployment: Deployment): HealthVm {
  return {
    status: healthStatus(deployment.health.status),
    checkedLabel: dateTimeLabel_opt(deployment.health.checkedAt),
    note: deployment.health.note,
    checks: deployment.health.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: healthStatus(check.status),
      detail: check.detail,
    })),
  };
}

function dateTimeLabel_opt(iso?: string): string | undefined {
  return iso ? dateTimeLabel(iso) : undefined;
}

export function toTimelineVm(event: TradingTimelineEvent): TimelineEventVm {
  return {
    id: event.id,
    kind: event.kind,
    label: event.label,
    detail: event.detail,
    atLabel: dateTimeLabel(event.at),
    tone: TIMELINE_TONE[event.kind] ?? 'neutral',
  };
}

export function toApprovalVm(approval: TradingApproval): ApprovalVm {
  return {
    id: approval.id,
    role: approval.role,
    kind: approval.kind,
    status: approvalStatus(approval.status),
    decidedLabel: dateLabel(approval.decidedAt),
    rationale: approval.rationale,
    counterSignedBy: approval.counterSignedBy,
  };
}

export function toEmergencyActionVm(action: EmergencyAction): EmergencyActionVm {
  return {
    id: action.id,
    kind: { value: action.kind, label: action.kind.replace(/_/g, ' '), tone: 'danger' },
    actor: action.actor,
    reason: action.reason,
    atLabel: dateTimeLabel(action.at),
  };
}

export function toAuditVm(entry: TradingAudit): AuditVm {
  return {
    id: entry.id,
    kind: entry.kind.replace(/_/g, ' '),
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    occurredLabel: dateTimeLabel(entry.occurredAt),
  };
}

function toDependencyVm(dependency: DeploymentDependency): DependencyVm {
  return {
    id: dependency.id,
    kind: dependency.kind,
    name: dependency.name,
    href: `${DEP_ROUTE[dependency.kind]}/${dependency.ref}`,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function toLineageVm(deployment: Deployment): LineageVm {
  const nodeHref = (node: LineageNode): string | undefined => {
    const base = LINEAGE_ROUTE[node.kind];
    return base ? `${base}/${node.ref}` : undefined;
  };
  return {
    nodes: deployment.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      href: nodeHref(node),
    })),
    edges: deployment.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function currentVersionString(deployment: Deployment): string {
  return (
    deployment.versions.reduce<string>(
      (best, candidate) =>
        best === '' || compareVersions(candidate.version, best) > 0 ? candidate.version : best,
      '',
    ) || deployment.version
  );
}

function toVersionVm(version: DeploymentVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    stage: stageStatus(version.stage),
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

export function toListItemVm(deployment: Deployment): DeploymentListItemVm {
  return {
    id: deployment.id,
    slug: deployment.slug,
    name: deployment.name,
    description: deployment.description,
    namespace: deployment.namespace,
    family: deployment.family,
    version: deployment.version,
    stage: stageStatus(deployment.stage),
    runtime: runtimeStatus(deployment.runtime.status),
    mode: modeStatus(deployment.mode),
    health: healthStatus(deployment.health.status),
    approval: approvalStatus(overallApprovalStatus(deployment)),
    killSwitch: killStatus(deployment.killSwitch.status),
    owner: deployment.owner.owner,
    tags: deployment.tags,
    updatedLabel: dateLabel(deployment.updatedAt) ?? '—',
  };
}

function overallApprovalStatus(deployment: Deployment): ApprovalStatus {
  if (deployment.approvals.length === 0) return 'NOT_REQUESTED';
  if (deployment.approvals.some((a) => a.status === 'REJECTED')) return 'REJECTED';
  if (deployment.approvals.some((a) => a.status === 'PENDING')) return 'PENDING';
  if (deployment.approvals.every((a) => a.status === 'APPROVED')) return 'APPROVED';
  return 'NOT_REQUESTED';
}

export function toDetailVm(deployment: Deployment): DeploymentDetailVm {
  const currentValue = currentVersionString(deployment);
  const portfolio = deployment.portfolio;
  const links: { label: string; href: string }[] = [];
  if (deployment.strategyRef)
    links.push({ label: 'Strategy', href: `/strategies/${deployment.strategyRef}` });
  if (deployment.portfolioRef)
    links.push({ label: 'Portfolio', href: `/portfolio-construction/${deployment.portfolioRef}` });
  if (deployment.simulationRef)
    links.push({ label: 'Simulation', href: `/execution-simulator/${deployment.simulationRef}` });

  return {
    id: deployment.id,
    slug: deployment.slug,
    name: deployment.name,
    description: deployment.description,
    namespace: deployment.namespace,
    family: deployment.family,
    key: deploymentKey(deployment.namespace, deployment.family, deployment.name),
    version: deployment.version,
    stage: stageStatus(deployment.stage),
    mode: modeStatus(deployment.mode),
    progress: toProgressVm(deployment),
    stages: toStageSteps(deployment),
    runtime: {
      id: deployment.runtime.id,
      status: runtimeStatus(deployment.runtime.status),
      mode: modeStatus(deployment.runtime.mode),
      uptime: deployment.runtime.uptime,
      startedLabel: deployment.runtime.startedAt
        ? dateTimeLabel(deployment.runtime.startedAt)
        : undefined,
      note: deployment.runtime.note,
    },
    runtimeControls: toRuntimeControls(deployment),
    account: toAccountVm(deployment.account),
    connection: toConnectionVm(deployment.connection),
    session: deployment.session
      ? {
          id: deployment.session.id,
          label: deployment.session.label,
          mode: modeStatus(deployment.session.mode),
          startedLabel: dateTimeLabel(deployment.session.startedAt),
          endedLabel: deployment.session.endedAt
            ? dateTimeLabel(deployment.session.endedAt)
            : undefined,
          note: deployment.session.note,
        }
      : undefined,
    authorization: deployment.authorization
      ? {
          ref: deployment.authorization.ref,
          issuedBy: deployment.authorization.issuedBy,
          scope: deployment.authorization.scope,
          issuedLabel: dateLabel(deployment.authorization.issuedAt) ?? '—',
          expiresLabel: dateLabel(deployment.authorization.expiresAt) ?? '—',
          valid: {
            value: String(deployment.authorization.valid),
            label: deployment.authorization.valid ? 'Valid' : 'Invalid/expired',
            tone: deployment.authorization.valid ? 'positive' : 'danger',
          },
        }
      : undefined,
    orders: deployment.orders.map(toOrderVm),
    positions: deployment.positions.map(toPositionVm),
    portfolio: {
      rows: [
        { label: 'Base currency', value: portfolio.baseCurrency },
        { label: 'Equity', value: portfolio.equity },
        { label: 'Cash', value: portfolio.cash },
        { label: 'Gross exposure', value: portfolio.grossExposure },
        { label: 'Net exposure', value: portfolio.netExposure },
        { label: 'Realized PnL', value: portfolio.realizedPnl },
        { label: 'Unrealized PnL', value: portfolio.unrealizedPnl },
      ],
    },
    balances: deployment.balances.map(toBalanceVm),
    permissions: deployment.permissions.map((permission) => ({
      id: permission.id,
      capability: permission.capability,
      granted: {
        value: String(permission.granted),
        label: permission.granted ? 'Granted' : 'Denied',
        tone: permission.granted ? 'positive' : 'neutral',
      },
      note: permission.note,
    })),
    health: toHealthVm(deployment),
    metrics: deployment.metrics.map(toMetricVm),
    timeline: deployment.timeline.map(toTimelineVm),
    approvals: deployment.approvals.map(toApprovalVm),
    emergencyActions: deployment.emergencyActions.map(toEmergencyActionVm),
    killSwitch: {
      status: killStatus(deployment.killSwitch.status),
      armedBy: deployment.killSwitch.armedBy,
      engagedBy: deployment.killSwitch.engagedBy,
      engagedLabel: deployment.killSwitch.engagedAt
        ? dateTimeLabel(deployment.killSwitch.engagedAt)
        : undefined,
      note: deployment.killSwitch.note,
    },
    validation: {
      status: {
        value: deployment.validation.status,
        label: VALIDATION_LABEL[deployment.validation.status],
        tone: VALIDATION_TONE[deployment.validation.status],
      },
      method: deployment.validation.method,
      checkedLabel: dateLabel(deployment.validation.checkedAt),
      note: deployment.validation.note,
    },
    dependencies: deployment.dependencies.map(toDependencyVm),
    lineage: toLineageVm(deployment),
    audit: [...deployment.audit]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .map(toAuditVm),
    versions: [...deployment.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    snapshots: deployment.snapshots.map((snapshot) => ({
      version: snapshot.version,
      stage: stageStatus(snapshot.stage),
      capturedLabel: dateLabel(snapshot.capturedAt) ?? '—',
      manifestHash: snapshot.manifestHash,
    })),
    owner: {
      owner: deployment.owner.owner,
      team: deployment.owner.team,
      steward: deployment.owner.steward,
    },
    links,
    tags: deployment.tags,
    metadata: [
      { label: 'Namespace', value: deployment.namespace },
      { label: 'Family', value: deployment.family },
      { label: 'Account', value: deployment.account.name },
      { label: 'Connection', value: deployment.connection.label },
      { label: 'Registry ref', value: deployment.registryRef },
      { label: 'Registered', value: dateLabel(deployment.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(deployment.updatedAt) ?? '—' },
      ...deployment.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: DeploymentFamily): DeploymentFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    deploymentCount: family.deploymentCount,
  };
}

function toQueueItemVm(deployment: Deployment, primary: StatusVm): QueueItemVm {
  return {
    id: deployment.id,
    name: deployment.name,
    namespace: deployment.namespace,
    family: deployment.family,
    stageLabel: describeStage(deployment.stage).label,
    primaryStatus: primary,
    mode: modeStatus(deployment.mode),
    owner: deployment.owner.owner,
  };
}

/** Running-strategies row: primary status is the runtime state. */
export function toRunningItemVm(deployment: Deployment): QueueItemVm {
  return toQueueItemVm(deployment, runtimeStatus(deployment.runtime.status));
}

/** Approval-queue row: primary status is the overall approval state. */
export function toApprovalQueueItemVm(deployment: Deployment): QueueItemVm {
  return toQueueItemVm(deployment, approvalStatus(overallApprovalStatus(deployment)));
}

/** History row: primary status is the deployment stage. */
export function toHistoryItemVm(deployment: Deployment): QueueItemVm {
  return toQueueItemVm(deployment, stageStatus(deployment.stage));
}

/** Emergency-controls row: runtime, mode, kill-switch and always-available controls. */
export function toEmergencyRowVm(deployment: Deployment): {
  deploymentId: string;
  deploymentName: string;
  namespace: string;
  runtime: StatusVm;
  mode: StatusVm;
  killSwitch: StatusVm;
  controls: readonly RuntimeControlVm[];
} {
  return {
    deploymentId: deployment.id,
    deploymentName: deployment.name,
    namespace: deployment.namespace,
    runtime: runtimeStatus(deployment.runtime.status),
    mode: modeStatus(deployment.mode),
    killSwitch: killStatus(deployment.killSwitch.status),
    controls: toRuntimeControls(deployment).filter((control) => control.emergency),
  };
}

/** Health-summary row across deployments. */
export function toHealthRowVm(deployment: Deployment): {
  deploymentId: string;
  deploymentName: string;
  namespace: string;
  status: StatusVm;
  checkedLabel?: string;
  checks: readonly { id: string; label: string; status: StatusVm; detail: string }[];
} {
  return {
    deploymentId: deployment.id,
    deploymentName: deployment.name,
    namespace: deployment.namespace,
    status: healthStatus(deployment.health.status),
    checkedLabel: dateTimeLabel_opt(deployment.health.checkedAt),
    checks: deployment.health.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: healthStatus(check.status),
      detail: check.detail,
    })),
  };
}

/** Metrics-overview row: a deployment's reported indicators. */
export function toMetricsRowVm(deployment: Deployment): {
  deploymentId: string;
  deploymentName: string;
  namespace: string;
  mode: StatusVm;
  metrics: readonly MetricVm[];
} {
  return {
    deploymentId: deployment.id,
    deploymentName: deployment.name,
    namespace: deployment.namespace,
    mode: modeStatus(deployment.mode),
    metrics: deployment.metrics.map(toMetricVm),
  };
}

export function toSummaryVm(
  deployments: readonly Deployment[],
  accountCount: number,
  connectionCount: number,
  familyCount: number,
): LiveTradingSummaryVm {
  const stageCount = new Map<DeploymentStage, number>();
  for (const deployment of deployments)
    stageCount.set(deployment.stage, (stageCount.get(deployment.stage) ?? 0) + 1);
  const byStage: SummaryBucketVm[] = DEPLOYMENT_STAGES.map((stage) => ({
    value: stage,
    label: describeStage(stage).label,
    count: stageCount.get(stage) ?? 0,
    tone: STAGE_TONE[stage],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalDeployments: deployments.length,
    running: deployments.filter((d) => d.runtime.status === 'RUNNING').length,
    paused: deployments.filter((d) => d.runtime.status === 'PAUSED').length,
    halted: deployments.filter((d) => d.runtime.status === 'HALTED').length,
    awaitingApproval: deployments.filter((d) => d.approvals.some((a) => a.status === 'PENDING'))
      .length,
    live: deployments.filter((d) => d.mode === 'LIVE').length,
    paper: deployments.filter((d) => d.mode === 'PAPER' || d.mode === 'SHADOW').length,
    accounts: accountCount,
    connections: connectionCount,
    families: familyCount,
    byStage,
  };
}

/** Metric label lookup for aggregate metric views. */
export function metricLabel(key: MetricKey): string {
  return describeMetric(key)?.label ?? key;
}
