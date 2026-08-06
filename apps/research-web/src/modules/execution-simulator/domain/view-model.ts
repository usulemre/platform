/**
 * Execution Simulator view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic. Inert data only. Shared by the researcher
 * (research-web) and administrator (admin-web) execution-simulator modules.
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

export interface RunControlVm {
  readonly control: 'pause' | 'resume' | 'retry' | 'cancel' | 'replay';
  readonly label: string;
  readonly enabled: boolean;
}

export interface RunVm {
  readonly id: string;
  readonly status: StatusVm;
  readonly attempt: number;
  readonly progressPercent: number;
  readonly startedLabel?: string;
  readonly endedLabel?: string;
  readonly note: string;
}

export interface ScenarioVm {
  readonly label: string;
  readonly rows: readonly MetadataRowVm[];
  readonly parameters: readonly MetadataRowVm[];
  readonly notes: string;
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

export interface FillVm {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly quantity: string;
  readonly price: string;
  readonly liquidity: string;
  readonly venue: string;
  readonly filledLabel: string;
}

export interface PositionVm {
  readonly id: string;
  readonly symbol: string;
  readonly side: StatusVm;
  readonly quantity: string;
  readonly averagePrice: string;
  readonly marketValue: string;
}

export interface PortfolioVm {
  readonly rows: readonly MetadataRowVm[];
}

export interface TimelineEventVm {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly detail: string;
  readonly atLabel: string;
  readonly tone: Tone;
}

export interface ReplayVm {
  readonly id: string;
  readonly status: StatusVm;
  readonly note: string;
  readonly createdLabel: string;
}

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface ReviewVm {
  readonly id: string;
  readonly reviewer: string;
  readonly stageLabel: string;
  readonly status: StatusVm;
  readonly note?: string;
  readonly reviewedLabel?: string;
}

export interface ApprovalVm {
  readonly id: string;
  readonly role: string;
  readonly status: StatusVm;
  readonly decidedLabel?: string;
  readonly rationale?: string;
}

export interface ReportVm {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly ref: string;
  readonly generatedLabel: string;
  readonly summary: string;
}

export interface ArtifactVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
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

export interface SessionListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly run: StatusVm;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface SessionDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly key: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly progress: ProgressVm;
  readonly stages: readonly StageStepVm[];
  readonly run: RunVm;
  readonly runControls: readonly RunControlVm[];
  readonly scenario: ScenarioVm;
  readonly orders: readonly OrderVm[];
  readonly fills: readonly FillVm[];
  readonly positions: readonly PositionVm[];
  readonly portfolio: PortfolioVm;
  readonly timeline: readonly TimelineEventVm[];
  readonly replays: readonly ReplayVm[];
  readonly metrics: readonly MetricVm[];
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly reviews: readonly ReviewVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly reports: readonly ReportVm[];
  readonly artifacts: readonly ArtifactVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly versions: readonly VersionVm[];
  readonly snapshots: readonly SnapshotVm[];
  readonly owner: OwnerVm;
  readonly templateLabel?: string;
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface SessionFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly sessionCount: number;
}

export interface ScenarioTemplateVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly fillModel: string;
  readonly venueModel: string;
}

export interface QueueItemVm {
  readonly id: string;
  readonly name: string;
  readonly namespace: string;
  readonly family: string;
  readonly stageLabel: string;
  readonly primaryStatus: StatusVm;
  readonly progressPercent: number;
  readonly owner: string;
}

export interface ReportRowVm extends ReportVm {
  readonly sessionId: string;
  readonly sessionName: string;
}

export interface ComparisonListItemVm {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly sessionCount: number;
  readonly metricCount: number;
  readonly createdLabel: string;
}

export interface ComparisonCellVm {
  readonly key: string;
  readonly value: string;
}

export interface ComparisonRowVm {
  readonly sessionId: string;
  readonly sessionName: string;
  readonly cells: readonly ComparisonCellVm[];
}

export interface ComparisonVm {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly metricColumns: readonly { readonly key: string; readonly label: string }[];
  readonly rows: readonly ComparisonRowVm[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface ExecutionSimulatorSummaryVm {
  readonly totalSessions: number;
  readonly running: number;
  readonly queued: number;
  readonly completed: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly families: number;
  readonly templates: number;
  readonly comparisons: number;
  readonly byStage: readonly SummaryBucketVm[];
}
