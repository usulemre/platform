'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useBacktestingSummary } from '../hooks/use-backtesting';
import { GovernanceNotice, InfoCard, StatusBadge } from './backtesting-atoms';

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
  const { data, isLoading } = useBacktestingSummary();
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
        <StatCard label="Backtests" value={data.totalBacktests} />
        <StatCard label="Running" value={data.running} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Comparisons" value={data.comparisons} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Backtests by lifecycle stage
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

/** Backtesting dashboard — headline counts, stage distribution and queue/comparison links. */
export function BacktestingDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Queue">
          <p className="text-sm text-muted-foreground">
            Active runs and backtests awaiting a governed decision.
          </p>
          <Link
            href="/backtesting/queue"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open queue
          </Link>
        </InfoCard>
        <InfoCard title="Comparisons">
          <p className="text-sm text-muted-foreground">
            Side-by-side result comparisons across backtests.
          </p>
          <Link
            href="/backtesting/comparisons"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open comparisons
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
