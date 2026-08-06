'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../application/container';
import type { NotificationQuery } from '../domain/query';

/** Server-state hooks for the Notification Center. They call the application
 *  service only — never a repository or transport directly. */
export function useNotifications(query: NotificationQuery) {
  return useQuery({
    queryKey: ['ntf', 'list', query],
    queryFn: () => notificationService.listNotifications(query),
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ['ntf', 'detail', id],
    queryFn: () => notificationService.getNotification(id),
    enabled: id.length > 0,
  });
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: ['ntf', 'summary'],
    queryFn: () => notificationService.getSummary(),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['ntf', 'preferences'],
    queryFn: () => notificationService.getPreferences(),
  });
}
