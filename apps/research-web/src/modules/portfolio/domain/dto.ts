/**
 * Canonical Portfolio DTOs — the transport contract mirroring the governed
 * Portfolio Registry (PFR). Inert data shapes only. Portfolios are research
 * outputs / PROPOSED allocations and MUST NOT authorize live trading; the
 * deployment mode is a governed status (surfaced read-only). No optimization, no
 * position sizing, no statistics are computed here.
 */
export type PortfolioStatusDto =
  | 'DRAFT'
  | 'REGISTERED'
  | 'UNDER_VALIDATION'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPRECATED'
  | 'RETIRED';

export type ApprovalStateDto = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Governed by Execution Governance (token-gated, paper-first). Read-only here. */
export type DeploymentModeDto = 'RESEARCH' | 'PAPER' | 'LIVE';

export type ConstraintStatusDto = 'SATISFIED' | 'WARNING' | 'BREACHED' | 'NOT_ASSESSED';

/** Pre-assessed by the Risk Engine upstream; the module never computes risk. */
export type RiskStatusDto = 'WITHIN' | 'ELEVATED' | 'BREACHED' | 'NOT_ASSESSED';

export type HoldingSideDto = 'LONG' | 'SHORT' | 'FLAT';

export type WorkflowStateDto = 'NOT_STARTED' | 'PENDING' | 'RUNNING' | 'BLOCKED' | 'COMPLETED';

export type ValidationStatusDto = 'PASSED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
export type ValidationSeverityDto = 'ERROR' | 'WARNING' | 'INFO';

export interface ValidationIssueDto {
  readonly code: string;
  readonly severity: ValidationSeverityDto;
  readonly message: string;
}

export interface ValidationReportDto {
  readonly status: ValidationStatusDto;
  readonly issues: readonly ValidationIssueDto[];
  readonly checkedAt?: string;
}

export interface ReferenceDto {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
}

export interface PortfolioVersionDto {
  readonly version: string;
  readonly registeredAt: string;
  readonly note: string;
}

export interface LineageNodeDto {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

/** A strategy combined into the portfolio. `weight` is descriptive metadata. */
export interface StrategyCompositionEntryDto {
  readonly strategyId: string;
  readonly name: string;
  readonly assetClass: string;
  readonly weight: string;
}

/** A proposed holding (pre-supplied; no position sizing performed here). */
export interface HoldingDto {
  readonly id: string;
  readonly instrument: string;
  readonly assetClass: string;
  readonly side: HoldingSideDto;
  readonly weight: string;
}

/** An allocation breakdown bucket (e.g. by asset class). */
export interface AllocationBucketDto {
  readonly key: string;
  readonly label: string;
  readonly weight: string;
}

/** A Portfolio Construction Rulebook constraint with a limit and a status. */
export interface ConstraintDto {
  readonly key: string;
  readonly label: string;
  readonly limit: string;
  readonly value: string;
  readonly status: ConstraintStatusDto;
}

/** A pre-assessed risk indicator with an optional limit and a status. */
export interface RiskIndicatorDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly status: RiskStatusDto;
}

export interface PortfolioApprovalDto {
  readonly state: ApprovalStateDto;
  readonly submittedAt?: string;
  readonly decidedAt?: string;
  readonly decidedBy?: string;
}

export interface WorkflowStatusDto {
  readonly workflowRef: string;
  readonly name: string;
  readonly state: WorkflowStateDto;
  readonly currentStage: string;
}

export interface PortfolioDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly mandate: string;
  readonly assetClass: string;
  readonly owner: string;
  readonly version: string;
  readonly baseCurrency: string;
  readonly asOf: string;
  readonly status: PortfolioStatusDto;
  readonly approval: PortfolioApprovalDto;
  readonly deploymentMode: DeploymentModeDto;
  readonly provenanceComplete: boolean;
  readonly manifestRef?: string;
  readonly registryId?: string;
  readonly backtestRef?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly risk: readonly RiskIndicatorDto[];
  readonly constraints: readonly ConstraintDto[];
  readonly holdings: readonly HoldingDto[];
  readonly allocations: readonly AllocationBucketDto[];
  readonly composition: readonly StrategyCompositionEntryDto[];
  readonly experimentRefs: readonly ReferenceDto[];
  readonly versions: readonly PortfolioVersionDto[];
  readonly lineage: readonly LineageNodeDto[];
  readonly workflow: WorkflowStatusDto;
}
