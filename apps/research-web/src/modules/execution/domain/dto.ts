/**
 * Canonical Execution Request DTOs — the transport contract for governed
 * execution requests. Inert data shapes only. This module ORCHESTRATES governed
 * execution workflows; it does NOT implement broker connectivity, exchange
 * integration or order routing. Execution is paper-first and token-gated by
 * Execution Governance; authorization/lifecycle statuses are surfaced read-only.
 */
export type ExecutionStatusDto =
  | 'DRAFT'
  | 'REQUESTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'AUTHORIZED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED';

/** Paper-first. LIVE is governed and token-gated by Execution Governance. */
export type ExecutionModeDto = 'PAPER' | 'LIVE';

/** State of the time-boxed governance authorization token (ARCH §2.9, RS-4). */
export type AuthorizationStateDto = 'NOT_ISSUED' | 'PENDING' | 'ISSUED' | 'EXPIRED' | 'REVOKED';

export type RiskVerdictDto = 'PASS' | 'PASS_WITH_CONDITIONS' | 'FAIL' | 'PENDING';
export type RiskLevelDto = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'NOT_ASSESSED';

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

/** The time-boxed governance authorization token for this request. */
export interface AuthorizationDto {
  readonly state: AuthorizationStateDto;
  readonly tokenRef?: string;
  readonly issuedAt?: string;
  readonly expiresAt?: string;
}

/** Summary of the governing risk decision (from the Risk Module). */
export interface RiskApprovalDto {
  readonly assessmentId: string;
  readonly assessmentTitle: string;
  readonly verdict: RiskVerdictDto;
  readonly riskLevel: RiskLevelDto;
  readonly decidedAt?: string;
}

export interface TimelineEventDto {
  readonly stage: string;
  readonly label: string;
  readonly actor?: string;
  readonly occurredAt?: string;
}

export interface WorkflowStatusDto {
  readonly workflowRef: string;
  readonly name: string;
  readonly state: WorkflowStateDto;
  readonly currentStage: string;
}

export interface ExecutionRequestDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: ExecutionStatusDto;
  readonly mode: ExecutionModeDto;
  readonly authorization: AuthorizationDto;
  readonly riskApproval: RiskApprovalDto;
  readonly portfolioRef: ReferenceDto;
  readonly strategyRef?: ReferenceDto;
  readonly signalRef?: ReferenceDto;
  readonly owner: string;
  readonly version: string;
  readonly registryId?: string;
  readonly auditRef?: string;
  readonly cancellable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly requestedAt?: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly timeline: readonly TimelineEventDto[];
  readonly workflow: WorkflowStatusDto;
}
