/**
 * Risk Engine view models — UI-facing, pre-formatted shapes produced by the mappers so
 * components carry no logic. Inert data only. Shared by the researcher (research-web)
 * and administrator (admin-web) risk-engine modules.
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

export interface ControlVm {
  readonly control: 'revalidate' | 'raise-exception' | 'record-override';
  readonly label: string;
  readonly enabled: boolean;
}

export interface PolicyVm {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly description: string;
}

export interface RuleVm {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly expression: string;
  readonly severity: string;
  readonly status: StatusVm;
}

export interface LimitVm {
  readonly id: string;
  readonly scope: string;
  readonly label: string;
  readonly bound: string;
  readonly utilization: string;
  readonly status: StatusVm;
}

export interface ConstraintVm {
  readonly id: string;
  readonly label: string;
  readonly bound: string;
  readonly status: StatusVm;
  readonly note?: string;
}

export interface ExposureVm {
  readonly id: string;
  readonly dimension: string;
  readonly label: string;
  readonly value: string;
  readonly limit: string;
  readonly status: StatusVm;
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
  readonly counterSignedBy?: string;
}

export interface ExceptionVm {
  readonly id: string;
  readonly code: string;
  readonly reason: string;
  readonly status: StatusVm;
  readonly raisedBy: string;
  readonly raisedLabel: string;
  readonly expiresLabel?: string;
  readonly ruleRef?: string;
}

export interface OverrideVm {
  readonly id: string;
  readonly reason: string;
  readonly status: StatusVm;
  readonly authorizedBy: string;
  readonly counterSignedBy: string;
  readonly grantedLabel: string;
  readonly expiresLabel?: string;
}

export interface ReportVm {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly ref: string;
  readonly generatedLabel: string;
  readonly summary: string;
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
  readonly decision: StatusVm;
  readonly capturedLabel: string;
  readonly manifestHash: string;
}

export interface OwnerVm {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface RiskListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly decision: StatusVm;
  readonly subjectName: string;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly openExceptions: number;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface RiskDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly key: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly decision: StatusVm;
  readonly progress: ProgressVm;
  readonly stages: readonly StageStepVm[];
  readonly subject: { readonly kind: string; readonly name: string; readonly href?: string };
  readonly controls: readonly ControlVm[];
  readonly policies: readonly PolicyVm[];
  readonly rules: readonly RuleVm[];
  readonly limits: readonly LimitVm[];
  readonly constraints: readonly ConstraintVm[];
  readonly exposures: readonly ExposureVm[];
  readonly metrics: readonly MetricVm[];
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly reviews: readonly ReviewVm[];
  readonly approvals: readonly ApprovalVm[];
  readonly exceptions: readonly ExceptionVm[];
  readonly overrides: readonly OverrideVm[];
  readonly reports: readonly ReportVm[];
  readonly audit: readonly AuditVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly versions: readonly VersionVm[];
  readonly snapshots: readonly SnapshotVm[];
  readonly owner: OwnerVm;
  readonly links: readonly { readonly label: string; readonly href: string }[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface RiskFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly assessmentCount: number;
}

export interface PolicyListItemVm extends PolicyVm {
  readonly ref: string;
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

export interface ExposureSummaryRowVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
  readonly namespace: string;
  readonly exposures: readonly ExposureVm[];
}

export interface AuditTimelineRowVm extends AuditVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
}

export interface RuleRowVm extends RuleVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
  readonly policyRef: string;
}

export interface LimitRowVm extends LimitVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
}

export interface ExceptionRowVm extends ExceptionVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
}

export interface OverrideRowVm extends OverrideVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
}

export interface ReportRowVm extends ReportVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
}

export interface ComparisonListItemVm {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly assessmentCount: number;
  readonly metricCount: number;
  readonly createdLabel: string;
}

export interface ComparisonCellVm {
  readonly key: string;
  readonly value: string;
}

export interface ComparisonRowVm {
  readonly assessmentId: string;
  readonly assessmentName: string;
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

export interface RiskEngineSummaryVm {
  readonly totalAssessments: number;
  readonly inValidation: number;
  readonly inReview: number;
  readonly awaitingApproval: number;
  readonly openExceptions: number;
  readonly activeOverrides: number;
  readonly blocked: number;
  readonly executionAuthorized: number;
  readonly families: number;
  readonly policies: number;
  readonly byStage: readonly SummaryBucketVm[];
}
