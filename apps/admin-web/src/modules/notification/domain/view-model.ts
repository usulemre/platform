/**
 * Notification view models — UI-facing, pre-formatted shapes produced by the
 * mappers so components carry no logic.
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

export interface NotificationListItemVm {
  readonly id: string;
  readonly categoryLabel: string;
  readonly priority: StatusVm;
  readonly delivery: StatusVm;
  readonly title: string;
  readonly source: string;
  readonly createdLabel: string;
  readonly isUnread: boolean;
}

export interface NotificationPageVm {
  readonly items: readonly NotificationListItemVm[];
  readonly pageInfo: PageInfoVm;
}

export interface NotificationDetailVm {
  readonly id: string;
  readonly categoryLabel: string;
  readonly title: string;
  readonly body: string;
  readonly priority: StatusVm;
  readonly status: StatusVm;
  readonly delivery: StatusVm;
  readonly createdLabel: string;
  readonly summary: readonly MetadataRowVm[];
  readonly metadata: readonly MetadataRowVm[];
}

export interface CategoryTileVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly unread: number;
  readonly href: string;
}

export interface PriorityBucketVm {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly tone: Tone;
}

export interface NotificationSummaryVm {
  readonly total: number;
  readonly unread: number;
  readonly byPriority: readonly PriorityBucketVm[];
  readonly categories: readonly CategoryTileVm[];
}

export interface PreferenceVm {
  readonly category: string;
  readonly categoryLabel: string;
  readonly inApp: StatusVm;
  readonly digest: StatusVm;
}
