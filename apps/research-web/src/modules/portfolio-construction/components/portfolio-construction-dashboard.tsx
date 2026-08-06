'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { usePortfolioConstructionSummary } from '../hooks/use-portfolio-construction';
import { GovernanceNotice, InfoCard, StatusBadge } from './portfolio-construction-atoms';

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
  const { data, isLoading } = usePortfolioConstructionSummary();
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
        <StatCard label="Portfolios" value={data.totalPortfolios} />
        <StatCard label="Optimizing" value={data.optimizing} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Published" value={data.published} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Portfolios by lifecycle stage
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

/** Portfolio Construction dashboard — headline counts, stage distribution and queue/comparison links. */
export function PortfolioConstructionDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Builder">
          <p className="text-sm text-muted-foreground">
            Walk the guided construction lifecycle for a new portfolio.
          </p>
          <Link
            href="/portfolio-construction/builder"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open builder
          </Link>
        </InfoCard>
        <InfoCard title="Optimization requests">
          <p className="text-sm text-muted-foreground">
            Active optimization requests and portfolios awaiting a governed decision.
          </p>
          <Link
            href="/portfolio-construction/optimization"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open requests
          </Link>
        </InfoCard>
        <InfoCard title="Comparisons">
          <p className="text-sm text-muted-foreground">
            Side-by-side characteristic comparisons across portfolios.
          </p>
          <Link
            href="/portfolio-construction/comparisons"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open comparisons
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
