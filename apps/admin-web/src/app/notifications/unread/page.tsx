import type { Metadata } from 'next';
import { UnreadNotifications } from '@/modules/notification';

export const metadata: Metadata = {
  title: 'Unread · Notifications',
};

/** Unread notifications page (Server Component). */
export default function UnreadNotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Unread notifications</h1>
      <UnreadNotifications />
    </div>
  );
}
