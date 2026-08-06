/**
 * Research Workspace view models — UI-facing, pre-formatted shapes produced by
 * the mappers so components carry no logic.
 */
export type Tone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

export interface StatusVm {
  readonly value: string;
  readonly label: string;
  readonly tone: Tone;
}

export interface WorkspaceItemVm {
  readonly kind: string;
  readonly kindLabel: string;
  readonly id: string;
  readonly name: string;
  readonly status: StatusVm;
  readonly updatedLabel: string;
  readonly href: string;
}

export interface ActivityVm {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly itemName: string;
  readonly href: string;
  readonly occurredLabel: string;
}

export interface SavedViewVm {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kindLabel: string;
  readonly filterLabel: string;
  readonly href: string;
}

export interface MetadataRowVm {
  readonly label: string;
  readonly value: string;
}

export interface NotificationVm {
  readonly id: string;
  readonly title: string;
  readonly categoryLabel: string;
  readonly priority: StatusVm;
  readonly createdLabel: string;
}

export interface QuickActionVm {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface SummaryStatVm {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly href: string;
}
