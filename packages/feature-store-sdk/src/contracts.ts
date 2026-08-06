/**
 * Canonical Feature Store contracts — the shared, transport-agnostic models the
 * feature-store service and its researcher-facing UI both speak. Inert data only;
 * no feature calculations, no statistics, no secrets. Datasets and other features
 * are referenced by ref ONLY.
 */
import type {
  ApprovalStatus,
  DependencyStatus,
  FeatureLifecycleStatus,
  HealthStatus,
  QualityGrade,
  SyncStatus,
  ValidationStatus,
} from './statuses';

export type FeatureValueType = 'FLOAT' | 'INT' | 'BOOL' | 'CATEGORICAL' | 'TIMESTAMP';
export type DependencyKind = 'DATASET' | 'FEATURE';
export type LineageNodeKind = 'RAW_SOURCE' | 'DATASET' | 'FEATURE' | 'TRANSFORM';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface FeatureSchemaField {
  readonly name: string;
  readonly type: FeatureValueType;
  readonly nullable: boolean;
  readonly description: string;
}

export interface FeatureSchema {
  readonly fields: readonly FeatureSchemaField[];
  readonly entity: string;
  readonly timeframe: string;
}

export interface FeatureOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface FeatureVersion {
  readonly version: string;
  readonly status: FeatureLifecycleStatus;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

export interface FeatureDependency {
  readonly id: string;
  readonly kind: DependencyKind;
  readonly ref: string;
  readonly name: string;
  readonly status: DependencyStatus;
}

export interface LineageNode {
  readonly id: string;
  readonly kind: LineageNodeKind;
  readonly ref: string;
  readonly label: string;
}

export interface FeatureLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface FeatureUsage {
  readonly consumers: string;
  readonly signals: string;
  readonly backtests: string;
  readonly lastAccessedAt?: string;
}

export interface FeatureQuality {
  readonly grade: QualityGrade;
  readonly completeness: number;
  readonly stability: number;
  readonly checkedAt?: string;
}

export interface FeatureHealth {
  readonly status: HealthStatus;
  readonly message: string;
  readonly lastRefreshedAt?: string;
}

export interface RegistrySync {
  readonly status: SyncStatus;
  readonly registryRef: string;
  readonly lastSyncedAt?: string;
}

export interface FeatureFamilyRef {
  readonly namespace: string;
  readonly family: string;
}

/** A feature's declarative definition (what it is — never how it is computed). */
export interface FeatureDefinition {
  readonly entity: string;
  readonly valueType: FeatureValueType;
  readonly timeframe: string;
  readonly rationale: string;
  readonly schema: FeatureSchema;
}

/** A registered, approved feature — the unit the Feature Store manages. */
export interface RegisteredFeature {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly status: FeatureLifecycleStatus;
  readonly version: string;
  readonly approval: ApprovalStatus;
  readonly validation: ValidationStatus;
  readonly owner: FeatureOwner;
  readonly definition: FeatureDefinition;
  readonly versions: readonly FeatureVersion[];
  readonly dependencies: readonly FeatureDependency[];
  readonly lineage: FeatureLineage;
  readonly usage: FeatureUsage;
  readonly quality: FeatureQuality;
  readonly health: FeatureHealth;
  readonly sync: RegistrySync;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related features under a namespace. */
export interface FeatureFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly featureCount: number;
}
