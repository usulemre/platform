/**
 * Canonical Signal Engine contracts — the shared, transport-agnostic models the
 * signal-engine service and its researcher-facing UI both speak. Inert data only;
 * no alpha models, no signal calculations, no statistics, no ML, no secrets.
 * Features, datasets and other signals are referenced by ref ONLY.
 */
import type { SignalStage } from './stages';
import type {
  ApprovalStatus,
  DependencyStatus,
  HealthStatus,
  PromotionStatus,
  QualityGrade,
  ReviewStatus,
  SyncStatus,
  ValidationStatus,
} from './statuses';

export type SignalDirection = 'LONG_SHORT' | 'LONG_ONLY' | 'DIRECTIONAL' | 'MARKET_NEUTRAL';
export type DependencyKind = 'FEATURE' | 'DATASET' | 'SIGNAL';
export type LineageNodeKind = 'RAW_SOURCE' | 'DATASET' | 'FEATURE' | 'SIGNAL' | 'TRANSFORM';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface SignalOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

export interface SignalVersion {
  readonly version: string;
  readonly stage: SignalStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

export interface SignalDependency {
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

export interface SignalLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

/** A validation record (the verdict is decided by the Validation Foundation). */
export interface SignalValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

/** A governance approval decision (made by accountable humans). */
export interface SignalApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
}

/** An independent methodology review of a signal. */
export interface SignalReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: SignalStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

/** Promotion of an approved signal toward a production candidate. */
export interface SignalPromotion {
  readonly status: PromotionStatus;
  readonly target: string;
  readonly queuedAt?: string;
  readonly promotedAt?: string;
}

export interface SignalUsage {
  readonly strategies: string;
  readonly backtests: string;
  readonly portfolios: string;
  readonly lastAccessedAt?: string;
}

export interface SignalQuality {
  readonly grade: QualityGrade;
  readonly coverage: number;
  readonly stability: number;
  readonly checkedAt?: string;
}

export interface SignalHealth {
  readonly status: HealthStatus;
  readonly message: string;
  readonly lastRefreshedAt?: string;
}

export interface RegistrySync {
  readonly status: SyncStatus;
  readonly registryRef: string;
  readonly lastSyncedAt?: string;
}

export interface SignalFamilyRef {
  readonly namespace: string;
  readonly family: string;
}

/** A signal's declarative definition (what it is — never how it is computed). */
export interface SignalDefinition {
  readonly entity: string;
  readonly horizon: string;
  readonly direction: SignalDirection;
  readonly rationale: string;
  /** Approved features this signal consumes (by ref only). */
  readonly featureRefs: readonly string[];
}

/** A registered signal — the unit the Signal Engine manages across its lifecycle. */
export interface RegisteredSignal {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: SignalStage;
  readonly version: string;
  readonly validation: SignalValidation;
  readonly approval: ApprovalStatus;
  readonly promotion: SignalPromotion;
  readonly owner: SignalOwner;
  readonly definition: SignalDefinition;
  readonly versions: readonly SignalVersion[];
  readonly dependencies: readonly SignalDependency[];
  readonly lineage: SignalLineage;
  readonly approvals: readonly SignalApproval[];
  readonly reviews: readonly SignalReview[];
  readonly usage: SignalUsage;
  readonly quality: SignalQuality;
  readonly health: SignalHealth;
  readonly sync: RegistrySync;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related signals under a namespace. */
export interface SignalFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly signalCount: number;
}

/** An immutable point-in-time snapshot reference of a signal version. */
export interface SignalSnapshot {
  readonly signalId: string;
  readonly version: string;
  readonly stage: SignalStage;
  readonly capturedAt: string;
  readonly manifestHash: string;
}
