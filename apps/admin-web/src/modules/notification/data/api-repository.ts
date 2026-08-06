/**
 * Real adapter over the governed API gateway (notification service). NOT wired in
 * v1. Transport ONLY, through the `@platform/api-client` boundary — never
 * infrastructure, never email/push/WebSocket delivery. Read-only.
 */
import type { ApiClient } from '@platform/api-client';
import type { NotificationDto, Page, PreferenceDto } from '../domain/dto';
import type { NotificationQuery } from '../domain/query';
import type { NotificationRepository } from './repository';

function buildQueryString(query: NotificationQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.category && query.category !== 'ALL') params.set('category', query.category);
  if (query.priority && query.priority !== 'ALL') params.set('priority', query.priority);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.order) params.set('order', query.order);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class ApiNotificationRepository implements NotificationRepository {
  constructor(private readonly api: ApiClient) {}

  list(query: NotificationQuery): Promise<Page<NotificationDto>> {
    return this.api.request<Page<NotificationDto>>(`/notifications${buildQueryString(query)}`);
  }

  async getById(id: string): Promise<NotificationDto | null> {
    try {
      return await this.api.request<NotificationDto>(`/notifications/${id}`);
    } catch {
      return null;
    }
  }

  all(): Promise<readonly NotificationDto[]> {
    return this.api.request<readonly NotificationDto[]>('/notifications?pageSize=1000');
  }

  listPreferences(): Promise<readonly PreferenceDto[]> {
    return this.api.request<readonly PreferenceDto[]>('/notifications/preferences');
  }
}
