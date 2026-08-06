'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useSession } from '../hooks/use-execution-simulator';
import {
  ExecutionEmpty,
  ExecutionError,
  ExecutionLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './execution-atoms';
import {
  ApprovalsPanel,
  ArtifactsPanel,
  DependenciesPanel,
  FillExplorer,
  LifecycleTimeline,
  LineagePanel,
  MetricsOverview,
  OrderExplorer,
  PortfolioPanel,
  PositionExplorer,
  ReplayPanel,
  ReportsPanel,
  ReviewsPanel,
  RunPanel,
  ScenarioPanel,
  SnapshotsPanel,
  TimelinePanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Session Details — the full record for one simulation session: lifecycle, run +
 *  controls, scenario, order/fill/position explorers, portfolio state, order timeline,
 *  metrics, replay, validation, reports, artifacts, reviews, approval, dependencies,
 *  lineage, versions, snapshots, links and metadata. */
export function SessionDetailView({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError, refetch } = useSession(sessionId);

  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/execution-simulator">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <ExecutionEmpty label="No session matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to execution simulator">
          <Link href="/execution-simulator">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
        {data.templateLabel ? (
          <StatusBadge label={`template ${data.templateLabel}`} tone="info" />
        ) : null}
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} ariaLabel="Lifecycle progress" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge label={`Run: ${data.run.status.label}`} tone={data.run.status.tone} />
        <StatusBadge
          label={`Validation: ${data.validation.status.label}`}
          tone={data.validation.status.tone}
        />
        <StatusBadge label={`Approval: ${data.approval.label}`} tone={data.approval.tone} />
      </div>
      {data.links.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm">
          {data.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
      <GovernanceNotice />

      <MetricsOverview metrics={data.metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LifecycleTimeline stages={data.stages} />
        <RunPanel run={data.run} controls={data.runControls} />
        <ScenarioPanel scenario={data.scenario} />
        <PortfolioPanel portfolio={data.portfolio} />
      </div>

      <OrderExplorer orders={data.orders} />
      <FillExplorer fills={data.fills} />
      <PositionExplorer positions={data.positions} />
      <TimelinePanel timeline={data.timeline} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ValidationPanel validation={data.validation} />
        <ReplayPanel replays={data.replays} />
        <ReportsPanel reports={data.reports} />
        <ArtifactsPanel artifacts={data.artifacts} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <VersionsPanel versions={data.versions} />
        <SnapshotsPanel snapshots={data.snapshots} />
        <InfoCard title="Ownership">
          <KeyValueList
            rows={[
              { label: 'Owner', value: data.owner.owner },
              { label: 'Team', value: data.owner.team },
              { label: 'Steward', value: data.owner.steward },
            ]}
          />
        </InfoCard>
        <InfoCard title="Tags">
          <TagList tags={data.tags} />
        </InfoCard>
        <InfoCard title="Metadata">
          <KeyValueList rows={data.metadata} />
        </InfoCard>
      </div>
    </div>
  );
}
