'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { usePerformanceSummary } from '../hooks/use-performance';
import { GovernanceNotice, InfoCard, StatusBadge } from './performance-atoms';

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
  const { data, isLoading } = usePerformanceSummary();
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
        <StatCard label="Reports" value={data.totalReports} />
        <StatCard label="Computed" value={data.computed} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Metrics" value={data.metrics} />
      </div>
      {data.bySubject.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Reports by subject
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.bySubject.map((bucket) => (
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

/** Performance Dashboard — headline counts, subject distribution and section links. */
export function PerformanceDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Metric catalog">
          <p className="text-sm text-muted-foreground">The 20 canonical metric definitions.</p>
          <Link
            href="/performance-analytics/catalog"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open catalog
          </Link>
        </InfoCard>
        <InfoCard title="Comparisons">
          <p className="text-sm text-muted-foreground">
            Benchmark, strategy and portfolio comparisons.
          </p>
          <Link
            href="/performance-analytics/comparisons"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open comparisons
          </Link>
        </InfoCard>
        <InfoCard title="By subject">
          <p className="text-sm text-muted-foreground">
            Strategy, portfolio, backtest and live performance.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              href="/performance-analytics/strategy"
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Strategy
            </Link>
            <Link
              href="/performance-analytics/portfolio"
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Portfolio
            </Link>
            <Link
              href="/performance-analytics/backtest"
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Backtest
            </Link>
            <Link
              href="/performance-analytics/live"
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Live
            </Link>
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
