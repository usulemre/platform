/**
 * Notification application service — the ONLY layer the UI/hooks call.
 * Orchestrates the repository, maps DTOs to view models, and computes the
 * dashboard summary (pure aggregation — counting only). No infrastructure, no UI,
 * no delivery, no persistence. It consumes notifications; it never sends them.
 */
import { toDetailVm, toPageVm, toPreferenceVm, toSummaryVm } from '../domain/mappers';
import type { NotificationQuery } from '../domain/query';
import type {
  NotificationDetailVm,
  NotificationPageVm,
  NotificationSummaryVm,
  PreferenceVm,
} from '../domain/view-model';
import type { NotificationRepository } from '../data/repository';

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async listNotifications(query: NotificationQuery = {}): Promise<NotificationPageVm> {
    return toPageVm(await this.repository.list(query));
  }

  async getNotification(id: string): Promise<NotificationDetailVm | null> {
    const notification = await this.repository.getById(id);
    return notification ? toDetailVm(notification) : null;
  }

  async getSummary(): Promise<NotificationSummaryVm> {
    return toSummaryVm(await this.repository.all());
  }

  async getPreferences(): Promise<PreferenceVm[]> {
    return (await this.repository.listPreferences()).map(toPreferenceVm);
  }
}
