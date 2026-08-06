/**
 * Canonical Risk Engine contracts — the shared, transport-agnostic models the
 * risk-engine service and its UIs both speak. Inert data only; NO VaR, NO CVaR, NO
 * expected shortfall, NO stress testing, NO exposure calculation, no secrets.
 * Portfolios, backtests, signals, strategies, features and experiments are referenced
 * by ref ONLY. Exposure values, limit bounds and metric VALUES are supplied as inert
 * strings — nothing is computed here.
 */
import type { MetricKey } from './metrics';
import type { RiskStage } from './stages';
import type {
  ApprovalStatus,
  DependencyStatus,
  ExceptionStatus,
  LimitStatus,
  OverrideStatus,
  ReviewStatus,
  RiskDecision,
  RuleStatus,
  ValidationStatus,
} from './statuses';

export type SubjectKind = 'PORTFOLIO' | 'STRATEGY' | 'SIGNAL';
export type PolicyCategory =
  | 'EXPOSURE'
  | 'CONCENTRATION'
  | 'LEVERAGE'
  | 'LIQUIDITY'
  | 'COMPLIANCE'
  | 'MANDATE';
export type LimitScope =
  | 'PORTFOLIO'
  | 'SECTOR'
  | 'ASSET_CLASS'
  | 'INSTRUMENT'
  | 'COUNTERPARTY'
  | 'CURRENCY';
export type ExposureDimension =
  | 'ASSET_CLASS'
  | 'SECTOR'
  | 'CURRENCY'
  | 'FACTOR'
  | 'COUNTERPARTY'
  | 'REGION';
export type DependencyKind =
  | 'PORTFOLIO'
  | 'BACKTEST'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'FEATURE'
  | 'EXPERIMENT';
export type LineageNodeKind =
  | 'PORTFOLIO'
  | 'BACKTEST'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'FEATURE'
  | 'EXPERIMENT'
  | 'ASSESSMENT'
  | 'TRANSFORM';
export type ReportKind = 'RISK_SUMMARY' | 'EXPOSURE' | 'LIMIT' | 'EXCEPTION' | 'MANIFEST';
export type AuditKind =
  | 'ASSESSMENT'
  | 'POLICY'
  | 'LIMIT'
  | 'EXCEPTION'
  | 'OVERRIDE'
  | 'APPROVAL'
  | 'REVALIDATION';

export interface MetadataEntry {
  readonly key: string;
  readonly value: string;
}

export interface RiskOwner {
  readonly owner: string;
  readonly team: string;
  readonly steward: string;
}

/** A risk policy applied to an assessment (its rules evaluated elsewhere). */
export interface RiskPolicy {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly category: PolicyCategory;
  readonly version: string;
  readonly status: RuleStatus;
  readonly description: string;
}

/** A single risk rule within a policy (its bound is an inert label; evaluation is elsewhere). */
export interface RiskRule {
  readonly id: string;
  readonly policyRef: string;
  readonly code: string;
  readonly label: string;
  readonly expression: string;
  readonly status: RuleStatus;
  readonly severity: string;
}

/** A configured risk limit (bound + reported utilization are inert strings). */
export interface RiskLimit {
  readonly id: string;
  readonly scope: LimitScope;
  readonly label: string;
  readonly bound: string;
  readonly utilization: string;
  readonly status: LimitStatus;
}

/** A declared risk constraint (evaluated elsewhere; inert here). */
export interface RiskConstraint {
  readonly id: string;
  readonly label: string;
  readonly bound: string;
  readonly status: RuleStatus;
  readonly note?: string;
}

/** A reported exposure along a dimension (VALUE is supplied, never calculated). */
export interface RiskExposure {
  readonly id: string;
  readonly dimension: ExposureDimension;
  readonly label: string;
  readonly value: string;
  readonly limit: string;
  readonly status: LimitStatus;
}

/** A risk indicator value (inert; the value is supplied, not computed). */
export interface RiskMetric {
  readonly key: MetricKey;
  readonly value: string;
}

export interface RiskReview {
  readonly id: string;
  readonly reviewer: string;
  readonly stage: RiskStage;
  readonly status: ReviewStatus;
  readonly note?: string;
  readonly reviewedAt?: string;
}

export interface RiskApproval {
  readonly id: string;
  readonly role: string;
  readonly status: ApprovalStatus;
  readonly decidedAt?: string;
  readonly rationale?: string;
  readonly counterSignedBy?: string;
}

/** A raised risk exception (disposition decided elsewhere). */
export interface RiskException {
  readonly id: string;
  readonly code: string;
  readonly reason: string;
  readonly status: ExceptionStatus;
  readonly raisedBy: string;
  readonly raisedAt: string;
  readonly expiresAt?: string;
  readonly ruleRef?: string;
}

/** A time-boxed, counter-signed human override (recorded, never auto-applied). */
export interface RiskOverride {
  readonly id: string;
  readonly reason: string;
  readonly status: OverrideStatus;
  readonly authorizedBy: string;
  readonly counterSignedBy: string;
  readonly grantedAt: string;
  readonly expiresAt?: string;
}

/** A generated risk report reference (the artifact lives elsewhere). */
export interface RiskReport {
  readonly id: string;
  readonly kind: ReportKind;
  readonly title: string;
  readonly ref: string;
  readonly generatedAt: string;
  readonly summary: string;
}

/** A single tamper-evident audit-timeline entry (who / what / when / why). */
export interface RiskAudit {
  readonly id: string;
  readonly kind: AuditKind;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly occurredAt: string;
}

export interface RiskDependency {
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

export interface RiskLineage {
  readonly nodes: readonly LineageNode[];
  readonly edges: readonly { readonly from: string; readonly to: string }[];
}

export interface RiskValidation {
  readonly status: ValidationStatus;
  readonly method: string;
  readonly checkedAt?: string;
  readonly note: string;
}

export interface RiskVersion {
  readonly version: string;
  readonly stage: RiskStage;
  readonly createdAt: string;
  readonly note: string;
  readonly manifestHash: string;
}

/** An immutable point-in-time snapshot reference of an assessment version. */
export interface RiskSnapshot {
  readonly assessmentId: string;
  readonly version: string;
  readonly stage: RiskStage;
  readonly decision: RiskDecision;
  readonly capturedAt: string;
  readonly manifestHash: string;
}

/**
 * A registered risk ASSESSMENT — the unit the Risk Engine manages. It validates a
 * subject (usually a constructed portfolio) before execution.
 */
export interface RiskAssessment {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly namespace: string;
  readonly family: string;
  readonly stage: RiskStage;
  readonly decision: RiskDecision;
  readonly version: string;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly subjectName: string;
  readonly policies: readonly RiskPolicy[];
  readonly rules: readonly RiskRule[];
  readonly limits: readonly RiskLimit[];
  readonly constraints: readonly RiskConstraint[];
  readonly exposures: readonly RiskExposure[];
  readonly metrics: readonly RiskMetric[];
  readonly validation: RiskValidation;
  readonly approval: ApprovalStatus;
  readonly reviews: readonly RiskReview[];
  readonly approvals: readonly RiskApproval[];
  readonly exceptions: readonly RiskException[];
  readonly overrides: readonly RiskOverride[];
  readonly reports: readonly RiskReport[];
  readonly audit: readonly RiskAudit[];
  readonly dependencies: readonly RiskDependency[];
  readonly lineage: RiskLineage;
  readonly versions: readonly RiskVersion[];
  readonly snapshots: readonly RiskSnapshot[];
  readonly owner: RiskOwner;
  readonly tags: readonly string[];
  readonly metadata: readonly MetadataEntry[];
  readonly portfolioRef?: string;
  readonly backtestRef?: string;
  readonly registryRef: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
}

/** A grouping of related assessments under a namespace. */
export interface RiskFamily {
  readonly namespace: string;
  readonly family: string;
  readonly description: string;
  readonly assessmentCount: number;
}

/** A cross-assessment comparison definition (values pulled from each assessment). */
export interface RiskComparison {
  readonly id: string;
  readonly name: string;
  readonly assessmentIds: readonly string[];
  readonly metricKeys: readonly MetricKey[];
  readonly createdAt: string;
  readonly note: string;
}
