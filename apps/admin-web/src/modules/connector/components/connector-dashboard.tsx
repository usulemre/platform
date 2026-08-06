'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useConnectorSummary } from '../hooks/use-connectors';
import { PlatformNotice, StatusBadge } from './connector-atoms';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
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

/** Connector dashboard — platform notice, headline counts and status/type
 *  distribution. Aggregation is computed by the application service (pure). */
export function ConnectorDashboard() {
  const { data, isLoading } = useConnectorSummary();

  return (
    <div className="space-y-4">
      <PlatformNotice />
      {isLoading || !data ? (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          aria-busy="true"
          aria-label="Loading summary"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Registered" value={data.total} />
            <StatCard label="Enabled" value={data.enabled} />
            <StatCard label="Degraded / down" value={data.degraded} />
            <StatCard label="Retired" value={data.retired} />
          </div>
          {data.byStatus.length > 0 ? (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground">By status</h2>
              <div className="flex flex-wrap items-center gap-2">
                {data.byStatus.map((bucket) => (
                  <span key={bucket.value} className="inline-flex items-center gap-1">
                    <StatusBadge label={bucket.label} tone={bucket.tone} />
                    <span className="text-sm text-muted-foreground">{bucket.count}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {data.byType.length > 0 ? (
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground">By type</h2>
              <div className="flex flex-wrap items-center gap-2">
                {data.byType.map((bucket) => (
                  <span key={bucket.value} className="inline-flex items-center gap-1">
                    <StatusBadge label={bucket.label} tone={bucket.tone} />
                    <span className="text-sm text-muted-foreground">{bucket.count}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
