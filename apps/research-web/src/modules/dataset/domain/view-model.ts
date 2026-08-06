/**
 * Dataset view models — the UI-facing shapes produced by the mappers. These are
 * pre-formatted and presentation-ready so UI components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
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
}

export interface DatasetListItemVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly vendor: string;
  readonly assetClass: string;
  readonly version: string;
  readonly updatedLabel: string;
  readonly validationTone: Tone;
  readonly tags: readonly string[];
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface DatasetVersionVm {
  readonly version: string;
  readonly knowledgeTimeLabel: string;
  readonly note: string;
}

export interface DatasetLineageNodeVm {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
}

export interface DatasetDetailVm {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly status: StatusVm;
  readonly metadata: readonly MetadataRowVm[];
  readonly validation: ValidationVm;
  readonly tags: readonly string[];
  readonly provenanceComplete: boolean;
  readonly lineageRef?: string;
  readonly versions: readonly DatasetVersionVm[];
  readonly lineage: readonly DatasetLineageNodeVm[];
}
