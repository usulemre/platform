'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useAuditSummary } from '../hooks/use-audit';
import { InfoCard, OutcomeBadge } from './audit-atoms';
import { AuditTimeline } from './audit-timeline';

/** Audit dashboard — totals, outcome breakdown, category tiles and recent
 *  activity. Aggregation is computed by the application service (pure counting). */
export function AuditDashboard() {
  const { data, isLoading } = useAuditSummary();

  return (
    <div className="space-y-6">
      {isLoading || !data ? (
        <Skeleton className="h-20 w-full" aria-busy="true" aria-label="Loading summary" />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <Card className="min-w-[8rem]">
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
                Total events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{data.total}</p>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            {data.byOutcome.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <OutcomeBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
          <Link
            href="/audit/explorer"
            className="ml-auto text-sm text-muted-foreground hover:underline"
          >
            Open explorer →
          </Link>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
          Event categories
        </h2>
        {isLoading || !data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.categories.map((tile) => (
              <li key={tile.value}>
                <Link
                  href={tile.href}
                  className="block rounded-lg border bg-background p-3 transition-colors hover:bg-accent/40"
                >
                  <span className="block text-sm font-medium">{tile.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {tile.count} event{tile.count === 1 ? '' : 's'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InfoCard title="Recent activity">
        <AuditTimeline limit={8} />
      </InfoCard>
    </div>
  );
}
