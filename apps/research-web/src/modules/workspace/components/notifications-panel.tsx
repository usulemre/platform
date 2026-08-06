'use client';

import { useWorkspaceNotifications } from '../hooks/use-workspace';
import { InfoCard, StatusBadge, WsEmpty, WsError, WsLoading } from './workspace-atoms';

/** Notifications Panel — surfaces workspace-scoped notices. Read-only; delivery
 *  and persistence are owned by the Notification Center, not this panel. */
export function NotificationsPanel() {
  const query = useWorkspaceNotifications();
  return (
    <InfoCard title="Notifications">
      {query.isLoading ? (
        <WsLoading />
      ) : query.isError ? (
        <WsError onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <WsEmpty label="You're all caught up." />
      ) : (
        <ul className="space-y-2 text-sm">
          {query.data.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 border-b py-1 last:border-0"
            >
              <span className="min-w-0">
                <span className="block font-medium">{note.title}</span>
                <span className="text-xs text-muted-foreground">{note.categoryLabel}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge label={note.priority.label} tone={note.priority.tone} />
                <span className="text-xs text-muted-foreground">{note.createdLabel}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
