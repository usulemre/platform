/**
 * Canonical Signal DTOs — the transport contract mirroring the governed Signal
 * Registry (SIG). Inert data shapes only. Signals are ADVISORY research outputs:
 * nothing here executes, and execution eligibility is a governed status owned by
 * Execution Governance (surfaced read-only). No signal generation, no statistics.
 */
export type SignalStatusDto =
  | 'DRAFT'
  | 'REGISTERED'
  | 'UNDER_VALIDATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPRECATED'
  | 'RETIRED';

export type ApprovalStateDto = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Governed by Execution Governance (token-gated, paper-first). Read-only here. */
export type ExecutionEligibilityDto = 'NOT_ELIGIBLE' | 'PAPER_ONLY' | 'ELIGIBLE';

/** Pre-assessed upstream; the module never computes ratings (no statistics). */
export type QualityRatingDto = 'GOOD' | 'MODERATE' | 'POOR' | 'NOT_ASSESSED';

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

export interface SignalVersionDto {
  readonly version: string;
  readonly registeredAt: string;
  readonly note: string;
}

export interface LineageNodeDto {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

/** A single pre-assessed quality indicator (value pre-formatted upstream). */
export interface QualityIndicatorDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly rating: QualityRatingDto;
}

export interface SignalApprovalDto {
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

export interface SignalDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly assetClass: string;
  readonly horizon: string;
  readonly owner: string;
  readonly version: string;
  readonly status: SignalStatusDto;
  readonly approval: SignalApprovalDto;
  readonly executionEligibility: ExecutionEligibilityDto;
  readonly provenanceComplete: boolean;
  readonly manifestRef?: string;
  readonly registryId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly quality: readonly QualityIndicatorDto[];
  readonly dependsOnFeatures: readonly ReferenceDto[];
  readonly strategyRefs: readonly ReferenceDto[];
  readonly experimentRefs: readonly ReferenceDto[];
  readonly versions: readonly SignalVersionDto[];
  readonly lineage: readonly LineageNodeDto[];
  readonly workflow: WorkflowStatusDto;
}
