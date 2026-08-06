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
        <StatCard label="In validation" value={data.inValidation} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
        <StatCard label="Open exceptions" value={data.openExceptions} />
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

/** Risk Dashboard — headline counts, stage distribution and queue links. */
export function RiskDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Review & validation">
          <p className="text-sm text-muted-foreground">
            Assessments in policy/limit validation and risk review.
          </p>
          <Link
            href="/risk-engine/review"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open queues
          </Link>
        </InfoCard>
        <InfoCard title="Exposure summary">
          <p className="text-sm text-muted-foreground">
            Reported exposures across all assessments.
          </p>
          <Link
            href="/risk-engine/exposures"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open exposures
          </Link>
        </InfoCard>
        <InfoCard title="Reports">
          <p className="text-sm text-muted-foreground">Generated risk report references.</p>
          <Link
            href="/risk-engine/reports"
            className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Open reports
          </Link>
        </InfoCard>
      </div>
    </div>
  );
}
