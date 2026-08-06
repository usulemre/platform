/**
 * Performance Analytics Engine view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic. Inert data only. Shared by the researcher
 * (research-web) and administrator (admin-web) modules.
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

export interface MetricVm {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly category: string;
  readonly definitionVersion: string;
}

export interface MetricGroupVm {
  readonly category: string;
  readonly label: string;
  readonly metrics: readonly MetricVm[];
}

export interface SeriesPointVm {
  readonly t: string;
  readonly value: string;
  readonly percent: number;
}

export interface SeriesVm {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  readonly points: readonly SeriesPointVm[];
}

export interface BenchmarkRowVm {
  readonly key: string;
  readonly label: string;
  readonly subjectValue: string;
  readonly benchmarkValue: string;
}

export interface BenchmarkVm {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly note: string;
  readonly rows: readonly BenchmarkRowVm[];
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

export interface ArtifactVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
}

export interface TimelineEventVm {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly detail: string;
  readonly atLabel: string;
  readonly tone: Tone;
}

export interface DependencyVm {
  readonly id: string;
  readonly kind: string;
  readonly name: string;
  readonly href?: string;
  readonly status: StatusVm;
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

export interface ReportListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly computation: StatusVm;
  readonly subject: StatusVm;
  readonly subjectName: string;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface ReportDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly key: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly computation: StatusVm;
  readonly subject: { readonly kind: StatusVm; readonly name: string; readonly href?: string };
  readonly window: string;
  readonly progress: ProgressVm;
  readonly stages: readonly StageStepVm[];
  readonly metricGroups: readonly MetricGroupVm[];
  readonly series: readonly SeriesVm[];
  readonly benchmark?: BenchmarkVm;
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly reviews: readonly ReviewVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly artifacts: readonly ArtifactVm[];
  readonly timeline: readonly TimelineEventVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly versions: readonly VersionVm[];
  readonly snapshots: readonly SnapshotVm[];
  readonly owner: OwnerVm;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface ReportFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly reportCount: number;
}

export interface MetricDefinitionVm {
  readonly key: string;
  readonly label: string;
  readonly category: string;
  readonly categoryLabel: string;
  readonly unit: string;
  readonly description: string;
  readonly formulaDescription: string;
  readonly higherIsBetter: boolean;
  readonly version: string;
}

export interface MetricCategoryGroupVm {
  readonly category: string;
  readonly label: string;
  readonly description: string;
  readonly definitions: readonly MetricDefinitionVm[];
}

export interface BenchmarkListVm {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly ref: string;
  readonly description: string;
}

export interface QueueItemVm {
  readonly id: string;
  readonly name: string;
  readonly namespace: string;
  readonly family: string;
  readonly subjectName: string;
  readonly stageLabel: string;
  readonly primaryStatus: StatusVm;
  readonly owner: string;
}

export interface ComparisonListItemVm {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly note: string;
  readonly reportCount: number;
  readonly metricCount: number;
  readonly createdLabel: string;
}

export interface ComparisonCellVm {
  readonly key: string;
  readonly value: string;
}

export interface ComparisonRowVm {
  readonly reportId: string;
  readonly reportName: string;
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

export interface PerformanceSummaryVm {
  readonly totalReports: number;
  readonly computed: number;
  readonly inReview: number;
  readonly awaitingApproval: number;
  readonly published: number;
  readonly families: number;
  readonly comparisons: number;
  readonly metrics: number;
  readonly byStage: readonly SummaryBucketVm[];
  readonly bySubject: readonly SummaryBucketVm[];
}
