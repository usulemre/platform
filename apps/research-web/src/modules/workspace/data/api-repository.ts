/**
 * Real adapter over the governed API gateway (workspace aggregation service). NOT
 * wired in v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never persistence. Read-only.
 */
import type { ApiClient } from '@platform/api-client';
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
import type { WorkspaceRepository } from './repository';

export class ApiWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly api: ApiClient) {}

  getSummary(): Promise<SummaryDto> {
    return this.api.request<SummaryDto>('/workspace/summary');
  }

  recentByKind(kind: WorkspaceItemKindDto): Promise<readonly WorkspaceItemDto[]> {
    return this.api.request<readonly WorkspaceItemDto[]>(`/workspace/recent?kind=${kind}`);
  }

  activeExperiments(): Promise<readonly WorkspaceItemDto[]> {
    return this.api.request<readonly WorkspaceItemDto[]>('/workspace/active-experiments');
  }

  favorites(): Promise<readonly WorkspaceItemDto[]> {
    return this.api.request<readonly WorkspaceItemDto[]>('/workspace/favorites');
  }

  bookmarks(): Promise<readonly WorkspaceItemDto[]> {
    return this.api.request<readonly WorkspaceItemDto[]>('/workspace/bookmarks');
  }

  activity(): Promise<readonly ActivityDto[]> {
    return this.api.request<readonly ActivityDto[]>('/workspace/activity');
  }

  savedViews(): Promise<readonly SavedViewDto[]> {
    return this.api.request<readonly SavedViewDto[]>('/workspace/saved-views');
  }

  preferences(): Promise<PreferencesDto> {
    return this.api.request<PreferencesDto>('/workspace/preferences');
  }

  notifications(): Promise<readonly WorkspaceNotificationDto[]> {
    return this.api.request<readonly WorkspaceNotificationDto[]>('/workspace/notifications');
  }

  quickActions(): Promise<readonly QuickActionDto[]> {
    return this.api.request<readonly QuickActionDto[]>('/workspace/quick-actions');
  }
}
