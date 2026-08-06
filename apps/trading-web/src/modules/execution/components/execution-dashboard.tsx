'use client';

import Link from 'next/link';
import { useExecutionSummary, useExecutions } from '../hooks/use-execution';
import { EngineNotice, ExecLoading, InfoCard, StatCard, StatusBadge } from './execution-atoms';
import { ExecutionTable } from './execution-table';
import { ExecutionHealth } from './execution-analytics';

const SECTIONS: readonly {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  { href: '/execution/queue', label: 'Queue', hint: 'Executions awaiting the venue' },
  { href: '/execution/planner', label: 'Planner', hint: 'Preview an execution plan' },
  { href: '/execution/policies', label: 'Policies', hint: 'The policy framework' },
  { href: '/execution/sessions', label: 'Sessions', hint: 'Execution batches' },
  { href: '/execution/timeline', label: 'Timeline', hint: 'Lifecycle events' },
  { href: '/execution/replay', label: 'Replay', hint: 'Reconstruct an execution' },
];

function SummarySection() {
  const { data, isLoading } = useExecutionSummary();
  if (isLoading || !data) return <ExecLoading rows={2} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Working" value={data.working} />
        <StatCard label="Completed" value={data.completed} />
        <StatCard label="Failed" value={data.failed} />
        <StatCard label="Cancelled" value={data.cancelled} />
      </div>
      {data.byStatus.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {data.byStatus.map((bucket) => (
            <span key={bucket.label} className="inline-flex items-center gap-1">
              <StatusBadge label={bucket.label} tone={bucket.tone} />
              <span className="text-sm text-muted-foreground">{bucket.count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RecentExecutions() {
  const { data, isLoading } = useExecutions({ scope: 'ALL', sortBy: 'updatedAt', sortDir: 'desc' });
  if (isLoading || !data) return <ExecLoading />;
  return (
    <InfoCard
      title="Recent executions"
      action={
        <Link href="/execution/history" className="text-sm underline-offset-2 hover:underline">
          Open history
        </Link>
      }
    >
      <ExecutionTable rows={data.slice(0, 8)} />
    </InfoCard>
  );
}

/** Execution Dashboard — summary, recent executions, health and section links. */
export function ExecutionDashboard() {
  return (
    <div className="space-y-4">
      <EngineNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <InfoCard key={section.href} title={section.label}>
            <p className="text-sm text-muted-foreground">{section.hint}</p>
            <Link
              href={section.href}
              className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Open {section.label.toLowerCase()}
            </Link>
          </InfoCard>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentExecutions />
        <ExecutionHealth />
      </div>
    </div>
  );
}
