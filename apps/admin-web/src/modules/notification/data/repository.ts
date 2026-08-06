/**
 * Notification repository abstraction — the ONLY data boundary the application
 * service depends on. Concrete adapters implement it; the UI never sees a concrete
 * data source and never touches infrastructure. Read-only: notifications are
 * emitted by the governed services; this module never delivers them.
 */
import type { NotificationDto, Page, PreferenceDto } from '../domain/dto';
import type { NotificationQuery } from '../domain/query';

export type { NotificationQuery };

export interface NotificationRepository {
  list(query: NotificationQuery): Promise<Page<NotificationDto>>;
  getById(id: string): Promise<NotificationDto | null>;
  all(): Promise<readonly NotificationDto[]>;
  listPreferences(): Promise<readonly PreferenceDto[]>;
}
