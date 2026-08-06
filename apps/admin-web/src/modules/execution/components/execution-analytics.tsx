'use client';

import { useExecutionHealth, useExecutionMetrics } from '../hooks/use-execution';
import { ExecError, ExecLoading, InfoCard, StatCard, StatusBadge } from './execution-atoms';

/** Execution Metrics — status distribution and completion/fail rates. */
export function ExecutionMetrics() {
  const { data, isLoading, isError, refetch } = useExecutionMetrics();
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Working" value={data.working} />
        <StatCard label="Completion" value={data.completionRate} />
        <StatCard label="Fail rate" value={data.failRate} />
        <StatCard label="Executed %" value={data.fillCompletion} />
      </div>
      <InfoCard title="Executions by status">
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
        <p className="mt-2 text-xs text-muted-foreground">
          Average slices per execution: {data.averageSlices}
        </p>
      </InfoCard>
    </div>
  );
}

/** Execution Health — deterministic health checks over the executions. */
export function ExecutionHealth() {
  const { data, isLoading, isError, refetch } = useExecutionHealth();
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  if (!data) return null;
  return (
    <InfoCard
      title="Execution health"
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
        Health is derived deterministically from the executions (fail rate, paused,
        unplanned-working, execution integrity).
      </p>
    </InfoCard>
  );
}
