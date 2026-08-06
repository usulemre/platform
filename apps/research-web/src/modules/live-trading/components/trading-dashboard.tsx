'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useTradingSummary } from '../hooks/use-live-trading';
import { GovernanceNotice, InfoCard, StatusBadge } from './trading-atoms';

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
  const { data, isLoading } = useTradingSummary();
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
        <StatCard label="Deployments" value={data.totalDeployments} />
        <StatCard label="Running" value={data.running} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Live" value={data.live} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Deployments by lifecycle stage
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

/** Live Trading Dashboard — headline counts, stage distribution and section links. */
export function TradingDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Running strategies">
          <p className="text-sm text-muted-foreground">
            Deployments actively trading (paper/shadow/live).
          </p>
          <Link
            href="/live-trading/running"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open running
          </Link>
        </InfoCard>
        <InfoCard title="Portfolio">
          <p className="text-sm text-muted-foreground">Open positions and account balances.</p>
          <Link
            href="/live-trading/portfolio"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open portfolio
          </Link>
        </InfoCard>
        <InfoCard title="History">
          <p className="text-sm text-muted-foreground">Stopped and archived deployments.</p>
          <Link
            href="/live-trading/history"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open history
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
