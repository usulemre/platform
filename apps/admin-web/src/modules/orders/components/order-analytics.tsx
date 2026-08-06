'use client';

import { useOrderHealth, useOrderMetrics } from '../hooks/use-orders';
import { InfoCard, OrdError, OrdLoading, StatCard, StatusBadge } from './orders-atoms';

/** Order Metrics — status distribution and fill/reject/cancel rates. */
export function OrderMetrics() {
  const { data, isLoading, isError, refetch } = useOrderMetrics();
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Working" value={data.working} />
        <StatCard label="Fill rate" value={data.fillRate} />
        <StatCard label="Reject rate" value={data.rejectRate} />
        <StatCard label="Fill completion" value={data.fillCompletion} />
      </div>
      <InfoCard title="Orders by status">
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
    </div>
  );
}

/** Order Health — deterministic health checks over the order book. */
export function OrderHealth() {
  const { data, isLoading, isError, refetch } = useOrderHealth();
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <InfoCard
      title="Order health"
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
      <p role="note" className="mt-2 text-xs text-muted-foreground">
        Health is derived deterministically from the order book (reject rate, suspended,
        unrouted-working, fill integrity).
      </p>
    </InfoCard>
  );
}
