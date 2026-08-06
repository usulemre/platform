/**
 * Notification Center Module (v1) — public surface for admin-web's routing layer.
 * Only container components are exported; the domain, data and application layers
 * are internal (the app depends on the application layer via these components,
 * never on repositories or infrastructure).
 */
export { NotificationDashboard } from './components/notification-dashboard';
export {
  NotificationInbox,
  CategoryNotifications,
  UnreadNotifications,
} from './components/notification-inbox';
export { NotificationDetailView } from './components/notification-detail-view';
export { NotificationPreferences } from './components/notification-preferences';
export { NotificationLoading, NotificationError } from './components/notification-atoms';
export type { NotificationCategoryDto } from './domain/dto';
