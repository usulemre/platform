'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useFeatureStoreSummary } from '../hooks/use-feature-store';
import { GovernanceNotice, StatusBadge } from './feature-store-atoms';

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

function SummarySection() {
  const { data, isLoading } = useFeatureStoreSummary();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-busy="true"
        aria-label="Loading summary"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Features" value={data.totalFeatures} />
        <StatCard label="Approved" value={data.approved} />
        <StatCard label="Awaiting validation" value={data.awaitingValidation} />
        <StatCard label="Sync drift" value={data.syncDrift} />
      </div>
      {data.byStatus.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Features by lifecycle status
          </h2>
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
    </div>
  );
}

/** Feature Store dashboard — headline counts and lifecycle distribution. */
export function FeatureStoreDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
    </div>
  );
}
