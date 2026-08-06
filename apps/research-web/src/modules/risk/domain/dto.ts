/**
 * Canonical Risk Assessment DTOs — the transport contract for advisory risk
 * assessments of portfolios, strategies and execution candidates. Inert data
 * shapes only. Verdicts, risk levels, exposure and constraint statuses are
 * PRE-ASSESSED upstream (Risk Management Rulebook / Risk Engine) and never
 * computed here. No VaR calculation, no optimization. The assessment is advisory
 * and does NOT authorize production execution.
 */
export type RiskAssessmentStatusDto =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'EXPIRED';

/** Advisory risk verdict. */
export type RiskVerdictDto = 'PASS' | 'PASS_WITH_CONDITIONS' | 'FAIL' | 'PENDING';

export type RiskLevelDto = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'NOT_ASSESSED';

/** Advisory only — real execution is token-gated by Execution Governance. */
export type ExecutionRecommendationDto = 'DO_NOT_DEPLOY' | 'PAPER_ONLY' | 'ELIGIBLE_PENDING_TOKEN';

export type SubjectKindDto = 'PORTFOLIO' | 'STRATEGY' | 'EXECUTION_CANDIDATE';

export type ExposureStatusDto = 'WITHIN' | 'ELEVATED' | 'BREACHED' | 'NOT_ASSESSED';
export type ConstraintStatusDto = 'SATISFIED' | 'WARNING' | 'BREACHED' | 'NOT_ASSESSED';
export type ExceptionStatusDto = 'OPEN' | 'APPROVED' | 'REJECTED';

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

/** A pre-assessed risk indicator with an optional limit and a status. */
export interface RiskIndicatorDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly status: ExposureStatusDto;
}

/** Per-strategy risk row (for the strategy risk summary). */
export interface StrategyRiskDto {
  readonly strategyId: string;
  readonly name: string;
  readonly level: RiskLevelDto;
  readonly note: string;
}

/** An exposure line for the exposure overview (pre-supplied; no VaR compute). */
export interface ExposureDto {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly limit?: string;
  readonly status: ExposureStatusDto;
}

/** A Risk Management Rulebook constraint check. */
export interface ConstraintCheckDto {
  readonly key: string;
  readonly label: string;
  readonly limit: string;
  readonly value: string;
  readonly status: ConstraintStatusDto;
}

/** A governance/policy reference (Risk Management Rulebook clause etc.). */
export interface PolicyReferenceDto {
  readonly code: string;
  readonly title: string;
}

/** A recorded risk exception (governance placeholder). */
export interface RiskExceptionDto {
  readonly code: string;
  readonly description: string;
  readonly status: ExceptionStatusDto;
}

/** A risk decision timeline event. */
export interface DecisionTimelineEventDto {
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

export interface RiskAssessmentDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subjectKind: SubjectKindDto;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly status: RiskAssessmentStatusDto;
  readonly verdict: RiskVerdictDto;
  readonly riskLevel: RiskLevelDto;
  readonly executionRecommendation: ExecutionRecommendationDto;
  readonly owner: string;
  readonly version: string;
  readonly registryId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly assessedAt?: string;
  readonly expiresAt?: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly portfolioRisk: readonly RiskIndicatorDto[];
  readonly strategyRisk: readonly StrategyRiskDto[];
  readonly exposures: readonly ExposureDto[];
  readonly constraints: readonly ConstraintCheckDto[];
  readonly policyRefs: readonly PolicyReferenceDto[];
  readonly exceptions: readonly RiskExceptionDto[];
  readonly timeline: readonly DecisionTimelineEventDto[];
  readonly workflow: WorkflowStatusDto;
}
