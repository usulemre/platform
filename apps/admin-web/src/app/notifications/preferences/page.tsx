import type { Metadata } from 'next';
import { NotificationPreferences } from '@/modules/notification';

export const metadata: Metadata = {
  title: 'Preferences · Notifications',
};

/** Notification Preferences page (Server Component). */
export default function NotificationPreferencesPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Notification preferences</h1>
      <NotificationPreferences />
    </div>
  );
}
