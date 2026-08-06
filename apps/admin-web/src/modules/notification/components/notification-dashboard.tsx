'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useNotifications, useNotificationSummary } from '../hooks/use-notifications';
import { CategoryBadge, InfoCard, NotificationBadge } from './notification-atoms';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="min-w-[8rem]">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Recent() {
  const { data, isLoading } = useNotifications({ order: 'newest', page: 1, pageSize: 6 });
  if (isLoading || !data) return <Skeleton className="h-24 w-full" />;
  if (data.items.length === 0)
    return <p className="text-sm text-muted-foreground">No recent notifications.</p>;
  return (
    <ol className="space-y-2 text-sm">
      {data.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 border-b py-1">
          <span className="flex min-w-0 items-center gap-2">
            <CategoryBadge label={item.categoryLabel} />
            <Link
              href={`/notifications/${item.id}`}
              className="truncate font-medium hover:underline"
            >
              {item.title}
            </Link>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">{item.createdLabel}</span>
        </li>
      ))}
    </ol>
  );
}

/** Notification dashboard — unread count, totals, priority breakdown, category
 *  tiles and recent notifications. Aggregation is computed by the service. */
export function NotificationDashboard() {
  const { data, isLoading } = useNotificationSummary();

  return (
    <div className="space-y-6">
      {isLoading || !data ? (
        <Skeleton className="h-20 w-full" aria-busy="true" aria-label="Loading summary" />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <StatCard label="Unread" value={data.unread} />
          <StatCard label="Total" value={data.total} />
          <div className="flex flex-wrap items-center gap-2">
            {data.byPriority.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <NotificationBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/notifications/unread" className="text-muted-foreground hover:underline">
              Unread
            </Link>
            <Link href="/notifications/inbox" className="text-muted-foreground hover:underline">
              Open inbox →
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">Categories</h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {data.categories.map((tile) => (
              <li key={tile.value}>
                <Link
                  href={tile.href}
                  className="block rounded-lg border bg-background p-3 transition-colors hover:bg-accent/40"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tile.label}</span>
                    {tile.unread > 0 ? (
                      <NotificationBadge label={String(tile.unread)} tone="info" />
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">{tile.count} total</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InfoCard title="Recent notifications">
        <Recent />
      </InfoCard>
    </div>
  );
}
