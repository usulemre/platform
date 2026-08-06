import type { Metadata } from 'next';
import { NotificationDashboard } from '@/modules/notification';

export const metadata: Metadata = {
  title: 'Notifications · Admin',
};

/** Notification Dashboard page (Server Component). The interactive sections are
 *  Client Components that fetch through the application service. */
export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Notification Center</h1>
        <p className="max-w-prose text-muted-foreground">
          The communication hub for the platform. Read-only — notifications are emitted by the
          governed services; this console never delivers or sends them.
        </p>
      </div>
      <NotificationDashboard />
    </div>
  );
}
