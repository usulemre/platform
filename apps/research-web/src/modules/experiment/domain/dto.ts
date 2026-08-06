/**
 * Canonical Experiment DTOs — the transport contract mirroring the governed
 * Experiment Registry / Experiment Tracking Governance (EXG). Inert data shapes
 * only. Governance facts (pre-registration, trial-ledger linkage, workflow
 * state, validation verdict) are represented but never computed here.
 */
export type ExperimentStatusDto =
  | 'DRAFT'
  | 'REGISTERED'
  | 'PRE_REGISTERED'
  | 'RUNNING'
  | 'UNDER_VALIDATION'
  | 'UNDER_REVIEW'
  | 'CONCLUDED'
  | 'ARCHIVED';

export type ExperimentOutcomeDto = 'SUPPORTED' | 'REFUTED' | 'INCONCLUSIVE' | 'PENDING';

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

/** Pre-registered hypothesis (SM-2). Once frozen, criteria are immutable. */
export interface HypothesisDto {
  readonly statement: string;
  readonly prediction: string;
  readonly successCriteria: string;
  readonly preRegistered: boolean;
  readonly preRegisteredAt?: string;
  readonly frozen: boolean;
}

export interface ReferenceDto {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
}

/** A stage in the research lifecycle. `occurredAt` present ⇒ completed. */
export interface TimelineEventDto {
  readonly stage: string;
  readonly label: string;
  readonly occurredAt?: string;
}

/** Governed workflow gating this experiment's progression (WCON-2). */
export interface WorkflowStatusDto {
  readonly workflowRef: string;
  readonly name: string;
  readonly state: WorkflowStateDto;
  readonly currentStage: string;
}

export interface ExperimentDto {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly researchQuestion: string;
  readonly economicRationale: string;
  readonly status: ExperimentStatusDto;
  readonly outcome: ExperimentOutcomeDto;
  readonly owner: string;
  readonly assetClass: string;
  readonly universe: string;
  readonly horizon: string;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly tags: readonly string[];
  readonly hypothesis: HypothesisDto;
  readonly datasetRefs: readonly ReferenceDto[];
  readonly featureRefs: readonly ReferenceDto[];
  readonly workflow: WorkflowStatusDto;
  readonly validation: ValidationReportDto;
  readonly trialLedgerRef?: string;
  readonly timeline: readonly TimelineEventDto[];
}
