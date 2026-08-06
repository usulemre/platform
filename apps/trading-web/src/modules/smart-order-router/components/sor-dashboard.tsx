'use client';

import Link from 'next/link';
import { useRoutings, useSorSummary } from '../hooks/use-sor';
import { EngineNotice, InfoCard, SorLoading, StatCard, StatusBadge } from './sor-atoms';
import { RoutingTable } from './routing-table';
import { RoutingHealth } from './sor-analytics';

const SECTIONS: readonly {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  { href: '/smart-order-router/venues', label: 'Venues', hint: 'The venue catalog' },
  { href: '/smart-order-router/rules', label: 'Rules', hint: 'Preview a routing decision' },
  { href: '/smart-order-router/decisions', label: 'Decisions', hint: 'Recorded decisions' },
  { href: '/smart-order-router/policies', label: 'Policies', hint: 'The policy framework' },
  { href: '/smart-order-router/timeline', label: 'Timeline', hint: 'Lifecycle events' },
  { href: '/smart-order-router/replay', label: 'Replay', hint: 'Reconstruct a routing' },
];

function SummarySection() {
  const { data, isLoading } = useSorSummary();
  if (isLoading || !data) return <SorLoading rows={2} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Ready" value={data.ready} />
        <StatCard label="Failed" value={data.failed} />
        <StatCard label="Venues" value={data.venues} />
        <StatCard label="Online" value={data.onlineVenues} />
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

function RecentRoutings() {
  const { data, isLoading } = useRoutings({ scope: 'ALL', sortBy: 'updatedAt', sortDir: 'desc' });
  if (isLoading || !data) return <SorLoading />;
  return (
    <InfoCard
      title="Recent routings"
      action={
        <Link
          href="/smart-order-router/history"
          className="text-sm underline-offset-2 hover:underline"
        >
          Open history
        </Link>
      }
    >
      <RoutingTable rows={data.slice(0, 8)} />
    </InfoCard>
  );
}

/** Smart Routing Dashboard — summary, recent routings, health and section links. */
export function SmartRoutingDashboard() {
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
        <RecentRoutings />
        <RoutingHealth />
      </div>
    </div>
  );
}
