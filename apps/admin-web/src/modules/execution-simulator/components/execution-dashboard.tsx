'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useExecutionSummary } from '../hooks/use-execution-simulator';
import { GovernanceNotice, InfoCard, StatusBadge } from './execution-atoms';

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
  const { data, isLoading } = useExecutionSummary();
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
        <StatCard label="Sessions" value={data.totalSessions} />
        <StatCard label="Running" value={data.running} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Templates" value={data.templates} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Sessions by lifecycle stage
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

/** Execution Dashboard (admin) — headline counts, stage distribution and admin section links. */
export function ExecutionDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Review & approval">
          <p className="text-sm text-muted-foreground">
            Sessions in review and awaiting a governed decision.
          </p>
          <Link
            href="/execution-simulator/review"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open queues
          </Link>
        </InfoCard>
        <InfoCard title="Scenario templates">
          <p className="text-sm text-muted-foreground">Reusable simulation scenario templates.</p>
          <Link
            href="/execution-simulator/templates"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open templates
          </Link>
        </InfoCard>
        <InfoCard title="Comparisons">
          <p className="text-sm text-muted-foreground">
            Side-by-side execution-quality comparisons.
          </p>
          <Link
            href="/execution-simulator/comparisons"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open comparisons
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
