'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { cn } from '@platform/utils';
import { useMetrics, useOverview } from '../hooks/use-monitoring';
import { StatusBadge } from './monitoring-atoms';
import type { Tone } from '../domain/view-model';

const DOT: Record<Tone, string> = {
  neutral: 'bg-muted-foreground/50',
  positive: 'bg-primary',
  warning: 'bg-muted-foreground',
  danger: 'bg-destructive',
  info: 'bg-muted-foreground',
};

/** System status banner (overall platform health). */
export function SystemStatus() {
  const { data, isLoading } = useOverview();
  if (isLoading || !data) return <Skeleton className="h-16 w-full" />;
  const { system } = data;
  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', DOT[system.tone])} />
        <div>
          <p className="text-sm font-semibold">{system.statusLabel}</p>
          <p className="text-xs text-muted-foreground">{system.message}</p>
        </div>
      </div>
      <StatusBadge label={`Updated ${system.updatedLabel}`} tone="neutral" />
    </div>
  );
}

/** Platform overview stat cards. */
export function PlatformOverview() {
  const { data, isLoading } = useOverview();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        aria-busy="true"
        aria-label="Loading overview"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {data.stats.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Metrics overview cards. */
export function MetricsOverview() {
  const { data, isLoading } = useMetrics();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-busy="true"
        aria-label="Loading metrics"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {data.map((metric) => (
        <Card key={metric.key}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
              {metric.label}
            </CardTitle>
            <span aria-hidden className={cn('h-2.5 w-2.5 rounded-full', DOT[metric.tone])} />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
