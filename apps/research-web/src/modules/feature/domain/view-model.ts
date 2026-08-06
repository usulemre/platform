/**
 * Feature view models — UI-facing, pre-formatted shapes produced by the mappers
 * so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface ApprovalVm {
  readonly label: string;
  readonly tone: Tone;
  readonly detail: string;
}

export interface ReferenceVm {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly href?: string;
}

export interface ValidationIssueVm {
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly tone: Tone;
}

export interface ValidationVm {
  readonly status: string;
  readonly label: string;
  readonly tone: Tone;
  readonly issueCount: number;
  readonly issues: readonly ValidationIssueVm[];
  readonly checkedLabel?: string;
  readonly leakageHarnessLabel: string;
  readonly leakageHarnessTone: Tone;
}

export interface WorkflowStatusVm {
  readonly workflowRef: string;
  readonly name: string;
  readonly stateLabel: string;
  readonly tone: Tone;
  readonly currentStage: string;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface FeatureVersionVm {
  readonly version: string;
  readonly registeredLabel: string;
  readonly note: string;
}

export interface LineageNodeVm {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface FeatureListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly assetClass: string;
  readonly version: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly validationTone: Tone;
  readonly updatedLabel: string;
  readonly tags: readonly string[];
}

export interface FeatureRegistryVm {
  readonly registryId: string;
  readonly rows: readonly MetadataRowVm[];
  readonly marketplaceAvailable: boolean;
}

export interface FeatureDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly approval: ApprovalVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly registry: FeatureRegistryVm;
  readonly validation: ValidationVm;
  readonly dependsOn: readonly ReferenceVm[];
  readonly datasetRefs: readonly ReferenceVm[];
  readonly usageExperiments: readonly ReferenceVm[];
  readonly usageSignals: readonly ReferenceVm[];
  readonly versions: readonly FeatureVersionVm[];
  readonly lineage: readonly LineageNodeVm[];
  readonly workflow: WorkflowStatusVm;
  readonly tags: readonly string[];
}

export interface SummaryBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface FeatureSummaryVm {
  readonly total: number;
  readonly approved: number;
  readonly underValidation: number;
  readonly retired: number;
  readonly byStatus: readonly SummaryBucketVm[];
}
