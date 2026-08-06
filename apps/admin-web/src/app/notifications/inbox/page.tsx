import type { Metadata } from 'next';
import { NotificationInbox } from '@/modules/notification';

export const metadata: Metadata = {
  title: 'Inbox · Notifications',
};

/** Notification Inbox / History page (Server Component). */
export default function NotificationInboxPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
      <NotificationInbox />
    </div>
  );
}
