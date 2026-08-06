'use client';

import Link from 'next/link';
import { useOrders, useOrdersSummary } from '../hooks/use-orders';
import { EngineNotice, InfoCard, OrdLoading, StatCard, StatusBadge } from './orders-atoms';
import { OrderTable } from './order-table';
import { OrderHealth } from './order-analytics';

const SECTIONS: readonly {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  { href: '/orders/blotter', label: 'Blotter', hint: 'All orders' },
  { href: '/orders/active', label: 'Active', hint: 'In-flight orders' },
  { href: '/orders/completed', label: 'Completed', hint: 'Terminal orders' },
  { href: '/orders/search', label: 'Search', hint: 'Filter the book' },
  { href: '/orders/timeline', label: 'Timeline', hint: 'Lifecycle events' },
  { href: '/orders/replay', label: 'Replay', hint: 'Reconstruct an order' },
];

function SummarySection() {
  const { data, isLoading } = useOrdersSummary();
  if (isLoading || !data) return <OrdLoading rows={2} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Total" value={data.total} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Working" value={data.working} />
        <StatCard label="Completed" value={data.completed} />
        <StatCard label="Filled" value={data.filled} />
        <StatCard label="Rejected" value={data.rejected} />
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

function RecentOrders() {
  const { data, isLoading } = useOrders({ scope: 'ALL', sortBy: 'updatedAt', sortDir: 'desc' });
  if (isLoading || !data) return <OrdLoading />;
  return (
    <InfoCard
      title="Recent orders"
      action={
        <Link href="/orders/blotter" className="text-sm underline-offset-2 hover:underline">
          Open blotter
        </Link>
      }
    >
      <OrderTable rows={data.slice(0, 8)} />
    </InfoCard>
  );
}

/** Order Dashboard — summary, recent orders, health and section links. */
export function OrdersDashboard() {
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
        <RecentOrders />
        <OrderHealth />
      </div>
    </div>
  );
}
