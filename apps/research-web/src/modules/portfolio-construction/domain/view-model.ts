/**
 * Portfolio Construction Engine view models — UI-facing, pre-formatted shapes produced
 * by the mappers so components carry no logic. Inert data only.
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

export interface OptimizationControlVm {
  readonly control: 'cancel' | 'retry';
  readonly label: string;
  readonly enabled: boolean;
}

export interface OptimizationVm {
  readonly id: string;
  readonly status: StatusVm;
  readonly objective: string;
  readonly attempt: number;
  readonly progressPercent: number;
  readonly requestedLabel?: string;
  readonly completedLabel?: string;
  readonly note: string;
}

export interface UniverseVm {
  readonly name: string;
  readonly description: string;
  readonly assetClasses: readonly string[];
  readonly instrumentCount: number;
}

export interface SignalSelectionVm {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly weightHint: string;
  readonly status: StatusVm;
}

export interface ConstraintVm {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly bound: string;
  readonly status: StatusVm;
  readonly note?: string;
}

export interface HoldingVm {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly assetClass: string;
  readonly side: StatusVm;
  readonly targetWeight: string;
}

export interface AllocationVm {
  readonly rows: readonly MetadataRowVm[];
  readonly holdings: readonly HoldingVm[];
  readonly notes: string;
}

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface SessionVm {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedLabel: string;
  readonly open: boolean;
}

export interface DependencyVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly href: string;
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

export interface ArtifactVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
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

export interface OptimizationRequestVm {
  readonly id: string;
  readonly status: StatusVm;
  readonly objective: string;
  readonly attempt: number;
  readonly progressPercent: number;
  readonly requestedLabel?: string;
  readonly completedLabel?: string;
  readonly note: string;
}

export interface PortfolioListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly allocationModel: string;
  readonly optimization: StatusVm;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface PortfolioDetailVm {
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
  readonly universe: UniverseVm;
  readonly signalSelection: readonly SignalSelectionVm[];
  readonly constraints: readonly ConstraintVm[];
  readonly allocation: AllocationVm;
  readonly optimization: OptimizationVm;
  readonly optimizationControls: readonly OptimizationControlVm[];
  readonly optimizationRequests: readonly OptimizationRequestVm[];
  readonly metrics: readonly MetricVm[];
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly sessions: readonly SessionVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly artifacts: readonly ArtifactVm[];
  readonly reviews: readonly ReviewVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly versions: readonly VersionVm[];
  readonly snapshots: readonly SnapshotVm[];
  readonly owner: OwnerVm;
  readonly templateLabel?: string;
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface PortfolioFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly portfolioCount: number;
}

export interface PortfolioTemplateVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly allocationModel: string;
  readonly constraintKinds: readonly string[];
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

export interface OptimizationRequestQueueItemVm {
  readonly id: string;
  readonly portfolioName: string;
  readonly namespace: string;
  readonly family: string;
  readonly objective: string;
  readonly status: StatusVm;
  readonly progressPercent: number;
  readonly owner: string;
}

export interface ComparisonListItemVm {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly portfolioCount: number;
  readonly metricCount: number;
  readonly createdLabel: string;
}

export interface ComparisonCellVm {
  readonly key: string;
  readonly value: string;
}

export interface ComparisonRowVm {
  readonly portfolioId: string;
  readonly portfolioName: string;
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

export interface PortfolioConstructionSummaryVm {
  readonly totalPortfolios: number;
  readonly optimizing: number;
  readonly published: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly comparisons: number;
  readonly families: number;
  readonly templates: number;
  readonly byStage: readonly SummaryBucketVm[];
}
