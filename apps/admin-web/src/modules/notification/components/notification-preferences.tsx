'use client';

import { useNotificationPreferences } from '../hooks/use-notifications';
import { NotificationBadge, NotificationError, NotificationLoading } from './notification-atoms';

/**
 * Notification preferences — per-category in-app and digest delivery preferences.
 * Read-only in v1 (changes are governed and applied by the backend); the console
 * presents, it does not mutate.
 */
export function NotificationPreferences() {
  const { data, isLoading, isError, refetch } = useNotificationPreferences();

  if (isLoading) return <NotificationLoading rows={6} />;
  if (isError) return <NotificationError onRetry={() => refetch()} />;
  if (!data || data.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No preferences configured.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Read-only presentation of per-category delivery preferences. Changes are governed and
        applied by the backend.
      </p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Notification preferences</caption>
          <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2">
                Category
              </th>
              <th scope="col" className="px-4 py-2">
                In-app
              </th>
              <th scope="col" className="px-4 py-2">
                Digest
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((preference) => (
              <tr key={preference.category} className="border-b last:border-0">
                <th scope="row" className="px-4 py-2 font-medium">
                  {preference.categoryLabel}
                </th>
                <td className="px-4 py-2">
                  <NotificationBadge label={preference.inApp.label} tone={preference.inApp.tone} />
                </td>
                <td className="px-4 py-2">
                  <NotificationBadge
                    label={preference.digest.label}
                    tone={preference.digest.tone}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
