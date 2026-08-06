/**
 * Canonical Research Workspace DTOs — the transport contract for the researcher's
 * productivity home (recent/favorite research, activity, bookmarks, saved views,
 * preferences, notifications, quick actions). Inert data shapes only. The
 * workspace AGGREGATES lightweight cross-module references; it never reaches into
 * another module's internals. No quantitative algorithms, no persistence.
 */
export type WorkspaceItemKindDto =
  | 'DATASET'
  | 'EXPERIMENT'
  | 'FEATURE'
  | 'SIGNAL'
  | 'STRATEGY'
  | 'PORTFOLIO';

export type StatusLevelDto = 'OK' | 'WARN' | 'ERROR' | 'INFO' | 'NEUTRAL';

/** A lightweight cross-module reference surfaced in the workspace. */
export interface WorkspaceItemDto {
  readonly kind: WorkspaceItemKindDto;
  readonly id: string;
  readonly name: string;
  readonly statusLabel: string;
  readonly level: StatusLevelDto;
  readonly updatedAt: string;
}

export interface ActivityDto {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly itemKind: WorkspaceItemKindDto;
  readonly itemId: string;
  readonly itemName: string;
  readonly occurredAt: string;
}

export interface SavedViewDto {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: WorkspaceItemKindDto;
  readonly filterLabel: string;
}

export type DensityDto = 'COMFORTABLE' | 'COMPACT';

export interface PreferencesDto {
  readonly defaultLanding: string;
  readonly density: DensityDto;
  readonly pinnedModules: readonly WorkspaceItemKindDto[];
}

export interface WorkspaceNotificationDto {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  readonly createdAt: string;
}

export interface QuickActionDto {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export interface SummaryDto {
  readonly activeExperiments: number;
  readonly datasets: number;
  readonly features: number;
  readonly signals: number;
  readonly strategies: number;
  readonly portfolios: number;
}
