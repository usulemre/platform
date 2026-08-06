/**
 * Feature Store view models — UI-facing, pre-formatted shapes produced by the
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

export interface SchemaFieldVm {
  readonly name: string;
  readonly type: string;
  readonly nullable: boolean;
  readonly description: string;
}

export interface VersionVm {
  readonly version: string;
  readonly status: StatusVm;
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

export interface LineageEdgeVm {
  readonly from: string;
  readonly to: string;
}

export interface LineageVm {
  readonly nodes: readonly LineageNodeVm[];
  readonly edges: readonly LineageEdgeVm[];
}

export interface OwnerVm {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface UsageVm {
  readonly consumers: string;
  readonly signals: string;
  readonly backtests: string;
  readonly lastAccessedLabel?: string;
}

export interface QualityVm {
  readonly grade: StatusVm;
  readonly completeness: string;
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

export interface FeatureCatalogItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly validation: StatusVm;
  readonly quality: StatusVm;
  readonly health: StatusVm;
  readonly sync: StatusVm;
  readonly owner: string;
  readonly tags: readonly string[];
  readonly usageLabel: string;
  readonly updatedLabel: string;
}

export interface FeatureDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly key: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly approval: StatusVm;
  readonly validation: StatusVm;
  readonly quality: QualityVm;
  readonly health: HealthVm;
  readonly sync: SyncVm;
  readonly owner: OwnerVm;
  readonly usage: UsageVm;
  readonly definition: {
    readonly entity: string;
    readonly valueType: string;
    readonly timeframe: string;
    readonly rationale: string;
  };
  readonly schema: readonly SchemaFieldVm[];
  readonly versions: readonly VersionVm[];
  readonly dependencies: readonly DependencyVm[];
  readonly lineage: LineageVm;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface FeatureFamilyVm {
  readonly id: string;
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly featureCount: number;
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface FeatureStoreSummaryVm {
  readonly totalFeatures: number;
  readonly approved: number;
  readonly proposed: number;
  readonly awaitingValidation: number;
  readonly qualityWarnings: number;
  readonly syncDrift: number;
  readonly families: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
