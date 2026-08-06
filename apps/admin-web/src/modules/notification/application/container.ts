/**
 * Composition root for the Notification Center. The single place a concrete
 * repository is bound. Replace MockNotificationRepository with
 * `new ApiNotificationRepository(apiClient)` to go live — no UI/hook/service
 * changes.
 */
import { MockNotificationRepository } from '../data/mock-repository';
import { NotificationService } from './notification-service';

export const notificationService = new NotificationService(new MockNotificationRepository());
