'use client';

import Link from 'next/link';
import { useActivity } from '../hooks/use-workspace';
import { InfoCard, WsEmpty, WsError, WsLoading } from './workspace-atoms';

/** Activity Feed — read-only, chronological record of recent research events. */
export function ActivityFeed() {
  const query = useActivity();
  return (
    <InfoCard title="Recent activity">
      {query.isLoading ? (
        <WsLoading />
      ) : query.isError ? (
        <WsError onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <WsEmpty label="No recent activity." />
      ) : (
        <ol className="space-y-3">
          {query.data.map((event) => (
            <li key={event.id} className="text-sm">
              <p>
                <span className="font-medium">{event.actor}</span> {event.action}{' '}
                <Link href={event.href} className="font-medium hover:underline">
                  {event.itemName}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">{event.occurredLabel}</p>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}
