/**
 * Live Trading Platform view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic. Inert data only. Shared by the researcher
 * (research-web), administrator (admin-web) and monitoring (monitoring-web) modules.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface ProgressVm {
  readonly percent: number;
  readonly label: string;
  readonly currentStageLabel: string;
}

export interface StageStepVm {
  readonly stage: string;
  readonly label: string;
  readonly state: StatusVm;
  readonly gate: boolean;
}

export interface RuntimeControlVm {
  readonly control:
    | 'pause'
    | 'resume'
    | 'stop'
    | 'restart'
    | 'rollback'
    | 'emergency-stop'
    | 'kill-switch';
  readonly label: string;
  readonly enabled: boolean;
  readonly emergency: boolean;
}

export interface RuntimeVm {
  readonly id: string;
  readonly status: StatusVm;
  readonly mode: StatusVm;
  readonly uptime: string;
  readonly startedLabel?: string;
  readonly note: string;
}

export interface AccountVm {
  readonly id: string;
  readonly name: string;
  readonly brokerKind: string;
  readonly provider: string;
  readonly mode: StatusVm;
  readonly baseCurrency: string;
  readonly status: StatusVm;
}

export interface ConnectionVm {
  readonly id: string;
  readonly provider: string;
  readonly brokerKind: string;
  readonly label: string;
  readonly mode: StatusVm;
  readonly status: StatusVm;
  readonly credentialRef: string;
  readonly note: string;
}

export interface ProviderVm {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly description: string;
}

export interface OrderVm {
  readonly id: string;
  readonly clientOrderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly type: string;
  readonly quantity: string;
  readonly limitPrice: string;
  readonly filledQuantity: string;
  readonly status: StatusVm;
  readonly createdLabel: string;
}

export interface PositionVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly quantity: string;
  readonly averagePrice: string;
  readonly marketValue: string;
  readonly unrealizedPnl: string;
  readonly realizedPnl: string;
  readonly open: boolean;
}

export interface PortfolioVm {
  readonly rows: readonly MetadataRowVm[];
}

export interface BalanceVm {
  readonly id: string;
  readonly asset: string;
  readonly total: string;
  readonly available: string;
  readonly reserved: string;
}

export interface PermissionVm {
  readonly id: string;
  readonly capability: string;
  readonly granted: StatusVm;
  readonly note: string;
}

export interface HealthCheckVm {
  readonly id: string;
  readonly label: string;
  readonly status: StatusVm;
  readonly detail: string;
}

export interface HealthVm {
  readonly status: StatusVm;
  readonly checkedLabel?: string;
  readonly note: string;
  readonly checks: readonly HealthCheckVm[];
}

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface TimelineEventVm {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly detail: string;
  readonly atLabel: string;
  readonly tone: Tone;
}

export interface ApprovalVm {
  readonly id: string;
  readonly role: string;
  readonly kind: string;
  readonly status: StatusVm;
  readonly decidedLabel?: string;
  readonly rationale?: string;
  readonly counterSignedBy?: string;
}

export interface EmergencyActionVm {
  readonly id: string;
  readonly kind: StatusVm;
  readonly actor: string;
  readonly reason: string;
  readonly atLabel: string;
}

export interface KillSwitchVm {
  readonly status: StatusVm;
  readonly armedBy: string;
  readonly engagedBy?: string;
  readonly engagedLabel?: string;
  readonly note: string;
}

export interface AuthorizationVm {
  readonly ref: string;
  readonly issuedBy: string;
  readonly scope: string;
  readonly issuedLabel: string;
  readonly expiresLabel: string;
  readonly valid: StatusVm;
}

export interface SessionVm {
  readonly id: string;
  readonly label: string;
  readonly mode: StatusVm;
  readonly startedLabel: string;
  readonly endedLabel?: string;
  readonly note: string;
}

export interface AuditVm {
  readonly id: string;
  readonly kind: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly occurredLabel: string;
}

export interface DependencyVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly href?: string;
  readonly status: StatusVm;
}

export interface LineageNodeVm {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly href?: string;
}

export interface LineageVm {
  readonly nodes: readonly LineageNodeVm[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface ValidationVm {
  readonly status: StatusVm;
  readonly method: string;
  readonly checkedLabel?: string;
  readonly note: string;
}

export interface VersionVm {
  readonly version: string;
  readonly stage: StatusVm;
  readonly createdLabel: string;
  readonly note: string;
  readonly manifestHash: string;
  readonly current: boolean;
}

export interface SnapshotVm {
  readonly version: string;
  readonly stage: StatusVm;
  readonly capturedLabel: string;
  readonly manifestHash: string;
}

export interface OwnerVm {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface DeploymentListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly runtime: StatusVm;
  readonly mode: StatusVm;
  readonly health: StatusVm;
  readonly approval: StatusVm;
  readonly killSwitch: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface DeploymentDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly key: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly mode: StatusVm;
  readonly progress: ProgressVm;
  readonly stages: readonly StageStepVm[];
  readonly runtime: RuntimeVm;
  readonly runtimeControls: readonly RuntimeControlVm[];
  readonly account: AccountVm;
  readonly connection: ConnectionVm;
  readonly session?: SessionVm;
  readonly authorization?: AuthorizationVm;
  readonly orders: readonly OrderVm[];
  readonly positions: readonly PositionVm[];
  readonly portfolio: PortfolioVm;
  readonly balances: readonly BalanceVm[];
  readonly permissions: readonly PermissionVm[];
  readonly health: HealthVm;
  readonly metrics: readonly MetricVm[];
  readonly timeline: readonly TimelineEventVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly emergencyActions: readonly EmergencyActionVm[];
  readonly killSwitch: KillSwitchVm;
  readonly validation: ValidationVm;
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly audit: readonly AuditVm[];
  readonly versions: readonly VersionVm[];
  readonly snapshots: readonly SnapshotVm[];
  readonly owner: OwnerVm;
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface DeploymentFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly deploymentCount: number;
}

export interface QueueItemVm {
  readonly id: string;
  readonly name: string;
  readonly namespace: string;
  readonly family: string;
  readonly stageLabel: string;
  readonly primaryStatus: StatusVm;
  readonly mode: StatusVm;
  readonly owner: string;
}

export interface OrderRowVm extends OrderVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
}

export interface PositionRowVm extends PositionVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
}

export interface BalanceRowVm extends BalanceVm {
  readonly accountId: string;
  readonly deploymentId: string;
  readonly deploymentName: string;
}

export interface HealthRowVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
  readonly namespace: string;
  readonly status: StatusVm;
  readonly checkedLabel?: string;
  readonly checks: readonly HealthCheckVm[];
}

export interface TimelineRowVm extends TimelineEventVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
}

export interface AuditRowVm extends AuditVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
}

export interface EmergencyRowVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
  readonly namespace: string;
  readonly runtime: StatusVm;
  readonly mode: StatusVm;
  readonly killSwitch: StatusVm;
  readonly controls: readonly RuntimeControlVm[];
}

export interface MetricsOverviewRowVm {
  readonly deploymentId: string;
  readonly deploymentName: string;
  readonly namespace: string;
  readonly mode: StatusVm;
  readonly metrics: readonly MetricVm[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface LiveTradingSummaryVm {
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
  readonly byStage: readonly SummaryBucketVm[];
}
