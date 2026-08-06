/**
 * Canonical Feature DTOs — the transport contract mirroring the governed Feature
 * Registry (FRG). Inert data shapes only. Governance facts (registration,
 * versioning, approval, validation/leakage-harness clearance, dependencies,
 * ownership, retirement) are represented but never computed here. No feature
 * calculation, no statistics.
 */
export type FeatureStatusDto =
  | 'DRAFT'
  | 'REGISTERED'
  | 'UNDER_VALIDATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPRECATED'
  | 'RETIRED';

export type ApprovalStateDto = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeakageHarnessDto = 'PASSED' | 'FAILED' | 'NOT_RUN';

export type FeatureValueTypeDto = 'CONTINUOUS' | 'CATEGORICAL' | 'BINARY';

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

export interface FeatureVersionDto {
  readonly version: string;
  readonly registeredAt: string;
  readonly note: string;
}

export interface LineageNodeDto {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface FeatureApprovalDto {
  readonly state: ApprovalStateDto;
  readonly submittedAt?: string;
  readonly decidedAt?: string;
  readonly decidedBy?: string;
}

/** Governed workflow gating approval into the marketplace (WCON-2). */
export interface WorkflowStatusDto {
  readonly workflowRef: string;
  readonly name: string;
  readonly state: WorkflowStateDto;
  readonly currentStage: string;
}

export interface FeatureUsageDto {
  readonly experiments: readonly ReferenceDto[];
  readonly signals: readonly ReferenceDto[];
}

export interface FeatureDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly assetClass: string;
  readonly valueType: FeatureValueTypeDto;
  readonly owner: string;
  readonly version: string;
  readonly status: FeatureStatusDto;
  readonly approval: FeatureApprovalDto;
  readonly leakageHarness: LeakageHarnessDto;
  readonly provenanceComplete: boolean;
  readonly manifestRef?: string;
  readonly registryId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly registeredAt?: string;
  readonly tags: readonly string[];
  readonly validation: ValidationReportDto;
  readonly dependsOn: readonly ReferenceDto[];
  readonly datasetRefs: readonly ReferenceDto[];
  readonly usage: FeatureUsageDto;
  readonly versions: readonly FeatureVersionDto[];
  readonly lineage: readonly LineageNodeDto[];
  readonly workflow: WorkflowStatusDto;
}
