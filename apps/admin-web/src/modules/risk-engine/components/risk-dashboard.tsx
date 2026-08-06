'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useRiskSummary } from '../hooks/use-risk-engine';
import { GovernanceNotice, InfoCard, StatusBadge } from './risk-engine-atoms';

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
  const { data, isLoading } = useRiskSummary();
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
        <StatCard label="Assessments" value={data.totalAssessments} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Open exceptions" value={data.openExceptions} />
        <StatCard label="Active overrides" value={data.activeOverrides} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Assessments by lifecycle stage
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

/** Risk Dashboard (admin) — headline counts, stage distribution and admin section links. */
export function RiskDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-4">
        <InfoCard title="Policies">
          <p className="text-sm text-muted-foreground">Risk policies and the rule explorer.</p>
          <Link
            href="/risk-engine/policies"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open policies
          </Link>
        </InfoCard>
        <InfoCard title="Limits">
          <p className="text-sm text-muted-foreground">
            Limit configuration and reported utilization.
          </p>
          <Link
            href="/risk-engine/limits"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open limits
          </Link>
        </InfoCard>
        <InfoCard title="Approvals">
          <p className="text-sm text-muted-foreground">Approval queue, exceptions and overrides.</p>
          <Link
            href="/risk-engine/approvals"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open approvals
          </Link>
        </InfoCard>
        <InfoCard title="Audit">
          <p className="text-sm text-muted-foreground">The tamper-evident risk audit timeline.</p>
          <Link
            href="/risk-engine/audit"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open audit
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
