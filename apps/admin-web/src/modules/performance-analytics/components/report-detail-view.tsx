'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useReport } from '../hooks/use-performance';
import {
  PerformanceEmpty,
  PerformanceError,
  PerformanceLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './performance-atoms';
import {
  ApprovalsPanel,
  ArtifactsPanel,
  BenchmarkPanel,
  DependenciesPanel,
  LifecycleTimeline,
  MetricsPanel,
  ReviewsPanel,
  SeriesPanel,
  SnapshotsPanel,
  TimelinePanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Report details — the full record for one performance report: lifecycle, metrics (grouped),
 *  series, benchmark comparison, validation, reviews, approval, artifacts, timeline,
 *  dependencies, versions, snapshots, subject link and metadata. */
export function ReportDetailView({ reportId }: { reportId: string }) {
  const { data, isLoading, isError, refetch } = useReport(reportId);

  if (isLoading) return <PerformanceLoading />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/performance-analytics">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <PerformanceEmpty label="No report matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to performance analytics">
          <Link href="/performance-analytics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.subject.kind.label} tone={data.subject.kind.tone} />
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Subject:</span>
        {data.subject.href ? (
          <Link href={data.subject.href} className="rounded-md border px-3 py-1 hover:bg-accent">
            {data.subject.name}
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1">{data.subject.name}</span>
        )}
        <span className="text-muted-foreground">Window: {data.window}</span>
      </div>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} ariaLabel="Lifecycle progress" />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Computation: ${data.computation.label}`}
          tone={data.computation.tone}
        />
        <StatusBadge
          label={`Validation: ${data.validation.status.label}`}
          tone={data.validation.status.tone}
        />
        <StatusBadge label={`Approval: ${data.approval.label}`} tone={data.approval.tone} />
      </div>
      <GovernanceNotice />

      <MetricsPanel groups={data.metricGroups} />
      {data.benchmark ? <BenchmarkPanel benchmark={data.benchmark} /> : null}
      <SeriesPanel series={data.series} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LifecycleTimeline stages={data.stages} />
        <ValidationPanel validation={data.validation} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <ArtifactsPanel artifacts={data.artifacts} />
        <TimelinePanel timeline={data.timeline} />
        <DependenciesPanel dependencies={data.dependencies} />
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
