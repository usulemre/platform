'use client';

import { useSorHealth, useSorMetrics } from '../hooks/use-sor';
import { InfoCard, SorError, SorLoading, StatCard, StatusBadge } from './sor-atoms';

/** Routing Metrics — status distribution, ready/fail rates, venue & policy distribution. */
export function RoutingMetrics() {
  const { data, isLoading, isError, refetch } = useSorMetrics();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Ready" value={data.ready} />
        <StatCard label="Failed" value={data.failed} />
        <StatCard label="Ready rate" value={data.readyRate} />
        <StatCard label="Avg candidates" value={data.averageCandidates} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="By status">
          <ul className="space-y-1 text-sm">
            {data.byStatus.map((bucket) => (
              <li
                key={bucket.label}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <StatusBadge label={bucket.label} tone={bucket.tone} />
                <span className="font-mono">{bucket.count}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="By venue">
          <ul className="space-y-1 text-sm">
            {data.byVenue.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : (
              data.byVenue.map((entry) => (
                <li
                  key={entry.venueId}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <span className="font-mono text-xs">{entry.venueId}</span>
                  <span className="font-mono">{entry.count}</span>
                </li>
              ))
            )}
          </ul>
        </InfoCard>
        <InfoCard title="By policy">
          <ul className="space-y-1 text-sm">
            {data.byPolicy.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : (
              data.byPolicy.map((entry) => (
                <li
                  key={entry.policyType}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <span>{entry.policyType}</span>
                  <span className="font-mono">{entry.count}</span>
                </li>
              ))
            )}
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}

/** Routing Health — deterministic health checks over the routings and venues. */
export function RoutingHealth() {
  const { data, isLoading, isError, refetch } = useSorHealth();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <InfoCard
      title="Routing health"
      action={<StatusBadge label={data.status.label} tone={data.status.tone} />}
    >
      <ul className="space-y-1 text-sm">
        {data.checks.map((check) => (
          <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
            <span>
              <span className="font-medium">{check.label}</span>{' '}
              <span className="text-xs text-muted-foreground">{check.detail}</span>
            </span>
            <StatusBadge label={check.status.label} tone={check.status.tone} />
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}
