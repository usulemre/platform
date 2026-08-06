/**
 * Signal Engine view models — UI-facing, pre-formatted shapes produced by the
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

export interface VersionVm {
  readonly version: string;
  readonly stage: StatusVm;
  readonly createdLabel: string;
  readonly note: string;
  readonly manifestHash: string;
  readonly current: boolean;
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

export interface ApprovalVm {
  readonly id: string;
  readonly role: string;
  readonly status: StatusVm;
  readonly decidedLabel?: string;
  readonly rationale?: string;
}

export interface ReviewVm {
  readonly id: string;
  readonly reviewer: string;
  readonly stageLabel: string;
  readonly status: StatusVm;
  readonly note?: string;
  readonly reviewedLabel?: string;
}

export interface OwnerVm {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface UsageVm {
  readonly strategies: string;
  readonly backtests: string;
  readonly portfolios: string;
  readonly lastAccessedLabel?: string;
}

export interface QualityVm {
  readonly grade: StatusVm;
  readonly coverage: string;
  readonly stability: string;
  readonly checkedLabel?: string;
}

export interface HealthVm {
  readonly status: StatusVm;
  readonly message: string;
  readonly refreshedLabel?: string;
}

export interface SyncVm {
  readonly status: StatusVm;
  readonly registryRef: string;
  readonly syncedLabel?: string;
}

export interface ValidationVm {
  readonly status: StatusVm;
  readonly method: string;
  readonly checkedLabel?: string;
  readonly note: string;
}

export interface PromotionVm {
  readonly status: StatusVm;
  readonly target: string;
  readonly queuedLabel?: string;
  readonly promotedLabel?: string;
}

export interface SignalCatalogItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly stage: StatusVm;
  readonly validation: StatusVm;
  readonly approval: StatusVm;
  readonly promotion: StatusVm;
  readonly quality: StatusVm;
  readonly health: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly updatedLabel: string;
}

export interface SignalDetailVm {
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
  readonly validation: ValidationVm;
  readonly approval: StatusVm;
  readonly promotion: PromotionVm;
  readonly quality: QualityVm;
  readonly health: HealthVm;
  readonly sync: SyncVm;
  readonly owner: OwnerVm;
  readonly usage: UsageVm;
  readonly definition: {
    readonly entity: string;
    readonly horizon: string;
    readonly direction: string;
    readonly rationale: string;
    readonly features: readonly { readonly ref: string; readonly href: string }[];
  };
  readonly versions: readonly VersionVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly approvals: readonly ApprovalVm[];
  readonly reviews: readonly ReviewVm[];
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface SignalFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly signalCount: number;
}

export interface QueueItemVm {
  readonly id: string;
  readonly name: string;
  readonly namespace: string;
  readonly family: string;
  readonly stageLabel: string;
  readonly primaryStatus: StatusVm;
  readonly owner: string;
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface SignalEngineSummaryVm {
  readonly totalSignals: number;
  readonly production: number;
  readonly awaitingValidation: number;
  readonly awaitingApproval: number;
  readonly queuedForPromotion: number;
  readonly qualityWarnings: number;
  readonly syncDrift: number;
  readonly families: number;
  readonly byStage: readonly SummaryBucketVm[];
}
