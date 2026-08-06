/**
 * Canonical Strategy DTOs — the transport contract mirroring the governed
 * Strategy Registry (STR). Inert data shapes only. Strategies are ADVISORY until
 * explicitly approved for portfolio construction; portfolio eligibility is a
 * governed status (surfaced read-only). No trading algorithms, no optimization,
 * no statistics are computed here.
 */
export type StrategyStatusDto =
  | 'DRAFT'
  | 'REGISTERED'
  | 'UNDER_VALIDATION'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPRECATED'
  | 'RETIRED';

export type ApprovalStateDto = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Governed by portfolio governance/workflow. Read-only here. */
export type PortfolioEligibilityDto = 'NOT_ELIGIBLE' | 'UNDER_REVIEW' | 'ELIGIBLE';

/** Pre-assessed by the Risk Engine upstream; the module never computes risk. */
export type RiskStatusDto = 'WITHIN' | 'ELEVATED' | 'BREACHED' | 'NOT_ASSESSED';

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

export interface StrategyVersionDto {
  readonly version: string;
  readonly registeredAt: string;
  readonly note: string;
}

export interface LineageNodeDto {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface TimelineEventDto {
  readonly stage: string;
  readonly label: string;
  readonly occurredAt?: string;
}

/** A signal combined into the strategy. `weight` is descriptive metadata only. */
export interface SignalCompositionEntryDto {
  readonly signalId: string;
  readonly name: string;
  readonly assetClass: string;
  readonly weight: string;
}

/** A pre-assessed risk indicator with an optional limit and a status. */
export interface RiskIndicatorDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly status: RiskStatusDto;
}

export interface StrategyApprovalDto {
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

export interface StrategyDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly assetClass: string;
  readonly owner: string;
  readonly version: string;
  readonly status: StrategyStatusDto;
  readonly approval: StrategyApprovalDto;
  readonly portfolioEligibility: PortfolioEligibilityDto;
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
  readonly composition: readonly SignalCompositionEntryDto[];
  readonly portfolioRefs: readonly ReferenceDto[];
  readonly experimentRefs: readonly ReferenceDto[];
  readonly versions: readonly StrategyVersionDto[];
  readonly lineage: readonly LineageNodeDto[];
  readonly workflow: WorkflowStatusDto;
  readonly timeline: readonly TimelineEventDto[];
}
