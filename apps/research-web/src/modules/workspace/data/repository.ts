/**
 * Workspace repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches infrastructure. Read-only aggregation.
 */
import type {
  ActivityDto,
  PreferencesDto,
  QuickActionDto,
  SavedViewDto,
  SummaryDto,
  WorkspaceItemDto,
  WorkspaceItemKindDto,
  WorkspaceNotificationDto,
} from '../domain/dto';

export type { WorkspaceItemKindDto };

export interface WorkspaceRepository {
  getSummary(): Promise<SummaryDto>;
  recentByKind(kind: WorkspaceItemKindDto): Promise<readonly WorkspaceItemDto[]>;
  activeExperiments(): Promise<readonly WorkspaceItemDto[]>;
  favorites(): Promise<readonly WorkspaceItemDto[]>;
  bookmarks(): Promise<readonly WorkspaceItemDto[]>;
  activity(): Promise<readonly ActivityDto[]>;
  savedViews(): Promise<readonly SavedViewDto[]>;
  preferences(): Promise<PreferencesDto>;
  notifications(): Promise<readonly WorkspaceNotificationDto[]>;
  quickActions(): Promise<readonly QuickActionDto[]>;
}
