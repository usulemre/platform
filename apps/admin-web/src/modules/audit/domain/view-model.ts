/**
 * Audit view models — UI-facing, pre-formatted shapes produced by the mappers so
 * components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface PageInfoVm {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export interface AuditEventListItemVm {
  readonly id: string;
  readonly categoryLabel: string;
  readonly action: string;
  readonly outcome: StatusVm;
  readonly actorLabel: string;
  readonly targetLabel: string;
  readonly source: string;
  readonly occurredLabel: string;
  readonly correlationId: string;
}

export interface AuditPageVm {
  readonly items: readonly AuditEventListItemVm[];
  readonly pageInfo: PageInfoVm;
}

export interface ChangeVm {
  readonly field: string;
  readonly from: string;
  readonly to: string;
}

export interface AuditEventDetailVm {
  readonly id: string;
  readonly categoryLabel: string;
  readonly action: string;
  readonly outcome: StatusVm;
  readonly occurredLabel: string;
  readonly summary: readonly MetadataRowVm[];
  readonly trace: readonly MetadataRowVm[];
  readonly metadata: readonly MetadataRowVm[];
  readonly changes: readonly ChangeVm[];
}

export interface CategoryTileVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly href: string;
}

export interface OutcomeBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface AuditSummaryVm {
  readonly total: number;
  readonly byOutcome: readonly OutcomeBucketVm[];
  readonly categories: readonly CategoryTileVm[];
}
