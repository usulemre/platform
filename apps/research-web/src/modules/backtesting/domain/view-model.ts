/**
 * Backtesting Engine view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic. Inert data only.
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
  readonly control: 'cancel' | 'retry' | 'pause' | 'resume';
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

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export interface ScenarioVm {
  readonly kind: string;
  readonly label: string;
  readonly window: string;
  readonly description: string;
}

export interface ParameterSetVm {
  readonly id: string;
  readonly name: string;
  readonly params: readonly MetadataRowVm[];
}

export interface ConfigurationVm {
  readonly scenario: ScenarioVm;
  readonly rows: readonly MetadataRowVm[];
  readonly parameterSets: readonly ParameterSetVm[];
  readonly notes: string;
}

export interface SessionVm {
  readonly id: string;
  readonly author: string;
  readonly summary: string;
  readonly startedLabel: string;
  readonly open: boolean;
}

export interface ResultVm {
  readonly id: string;
  readonly parameterSetId: string;
  readonly summary: string;
  readonly metrics: readonly MetricVm[];
}

export interface ReportVm {
  readonly id: string;
  readonly title: string;
  readonly ref: string;
  readonly generatedLabel: string;
  readonly summary: string;
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

export interface OwnerVm {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface BacktestListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly scenario: string;
  readonly run: StatusVm;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface BacktestDetailVm {
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
  readonly configuration: ConfigurationVm;
  readonly metrics: readonly MetricVm[];
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly sessions: readonly SessionVm[];
  readonly results: readonly ResultVm[];
  readonly reports: readonly ReportVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly artifacts: readonly ArtifactVm[];
  readonly reviews: readonly ReviewVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly versions: readonly VersionVm[];
  readonly owner: OwnerVm;
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface BacktestFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly backtestCount: number;
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

export interface ComparisonListItemVm {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly backtestCount: number;
  readonly metricCount: number;
  readonly createdLabel: string;
}

export interface ComparisonCellVm {
  readonly key: string;
  readonly value: string;
}

export interface ComparisonRowVm {
  readonly backtestId: string;
  readonly backtestName: string;
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

export interface BacktestingSummaryVm {
  readonly totalBacktests: number;
  readonly running: number;
  readonly queued: number;
  readonly awaitingApproval: number;
  readonly failed: number;
  readonly comparisons: number;
  readonly families: number;
  readonly byStage: readonly SummaryBucketVm[];
}
