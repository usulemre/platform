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
        <StatCard label="In review" value={data.inReview} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Metrics" value={data.metrics} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Reports by lifecycle stage
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byStage.map((bucket) => (
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

/** Performance Dashboard (admin) — headline counts, stage distribution and admin section links. */
export function PerformanceDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-4">
        <InfoCard title="Metric registry">
          <p className="text-sm text-muted-foreground">Canonical, versioned metric definitions.</p>
          <Link
            href="/performance-analytics/catalog"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open
          </Link>
        </InfoCard>
        <InfoCard title="Review & approval">
          <p className="text-sm text-muted-foreground">Report review and approval queues.</p>
          <Link
            href="/performance-analytics/review"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open
          </Link>
        </InfoCard>
        <InfoCard title="Benchmarks">
          <p className="text-sm text-muted-foreground">Benchmark registry.</p>
          <Link
            href="/performance-analytics/benchmarks"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open
          </Link>
        </InfoCard>
        <InfoCard title="Comparisons">
          <p className="text-sm text-muted-foreground">Performance comparisons.</p>
          <Link
            href="/performance-analytics/comparisons"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
