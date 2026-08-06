'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useRiskSummary } from '../hooks/use-risk';
import { RiskStatusBadge } from './risk-status-badge';
import { AdvisoryNotice } from './advisory-notice';

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

/** Risk dashboard — advisory notice, headline counts and status distribution.
 *  Aggregation is computed by the application service (pure), not here. */
export function RiskDashboard() {
  const { data, isLoading } = useRiskSummary();

  return (
    <div className="space-y-4">
      <AdvisoryNotice />
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
            <StatCard label="Total" value={data.total} />
            <StatCard label="Approved" value={data.approved} />
            <StatCard label="Under review" value={data.underReview} />
            <StatCard label="Escalated" value={data.escalated} />
          </div>
          {data.byStatus.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {data.byStatus.map((bucket) => (
                <span key={bucket.value} className="inline-flex items-center gap-1">
                  <RiskStatusBadge label={bucket.label} tone={bucket.tone} />
                  <span className="text-sm text-muted-foreground">{bucket.count}</span>
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
