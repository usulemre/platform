'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import { useResearchSummary, useWorkspaceLink } from '../hooks/use-research';
import { GovernanceNotice, InfoCard, StatusBadge } from './research-atoms';

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
  const { data, isLoading } = useResearchSummary();
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
        <StatCard label="Projects" value={data.totalProjects} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Blocked" value={data.blocked} />
        <StatCard label="Awaiting approval" value={data.awaitingApproval} />
      </div>
      {data.byStage.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Projects by current stage
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

/** Research Workspace Integration — a link into the shared research workspace. */
function WorkspaceIntegration() {
  const { data } = useWorkspaceLink();
  return (
    <InfoCard title="Research workspace">
      <p className="text-sm text-muted-foreground">
        Your cross-module productivity home aggregates every research artifact and pinned project.
      </p>
      <Link
        href={data?.href ?? '/workspace'}
        className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
      >
        Open workspace
        {typeof data?.pinnedProjects === 'number' ? ` · ${data.pinnedProjects} pinned` : ''}
      </Link>
    </InfoCard>
  );
}

/** Research dashboard — headline counts, stage distribution and workspace link. */
export function ResearchDashboard() {
  return (
    <div className="space-y-4">
      <GovernanceNotice />
      <SummarySection />
      <WorkspaceIntegration />
    </div>
  );
}
