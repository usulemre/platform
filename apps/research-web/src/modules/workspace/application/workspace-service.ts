/**
 * Workspace application service — the ONLY layer the UI/hooks call. Orchestrates
 * the repository and maps aggregated DTOs to view models. No infrastructure, no
 * UI, no quantitative algorithms, no persistence. It aggregates read-only
 * cross-module references; it never adjudicates or mutates artifacts.
 */
import {
  toActivityVm,
  toItemVm,
  toNotificationVm,
  toPreferenceRows,
  toSavedViewVm,
  toSummaryStats,
} from '../domain/mappers';
import type { WorkspaceItemKindDto } from '../domain/dto';
import type {
  ActivityVm,
  MetadataRowVm,
  NotificationVm,
  QuickActionVm,
  SavedViewVm,
  SummaryStatVm,
  WorkspaceItemVm,
} from '../domain/view-model';
import type { WorkspaceRepository } from '../data/repository';

export class WorkspaceService {
  constructor(private readonly repository: WorkspaceRepository) {}

  async getSummary(): Promise<SummaryStatVm[]> {
    return toSummaryStats(await this.repository.getSummary());
  }

  async getRecent(kind: WorkspaceItemKindDto): Promise<WorkspaceItemVm[]> {
    return (await this.repository.recentByKind(kind)).map(toItemVm);
  }

  async getActiveExperiments(): Promise<WorkspaceItemVm[]> {
    return (await this.repository.activeExperiments()).map(toItemVm);
  }

  async getFavorites(): Promise<WorkspaceItemVm[]> {
    return (await this.repository.favorites()).map(toItemVm);
  }

  async getBookmarks(): Promise<WorkspaceItemVm[]> {
    return (await this.repository.bookmarks()).map(toItemVm);
  }

  async getActivity(): Promise<ActivityVm[]> {
    return (await this.repository.activity()).map(toActivityVm);
  }

  async getSavedViews(): Promise<SavedViewVm[]> {
    return (await this.repository.savedViews()).map(toSavedViewVm);
  }

  async getPreferences(): Promise<MetadataRowVm[]> {
    return toPreferenceRows(await this.repository.preferences());
  }

  async getNotifications(): Promise<NotificationVm[]> {
    return (await this.repository.notifications()).map(toNotificationVm);
  }

  async getQuickActions(): Promise<QuickActionVm[]> {
    return (await this.repository.quickActions()).map((action) => ({
      id: action.id,
      label: action.label,
      href: action.href,
    }));
  }
}
