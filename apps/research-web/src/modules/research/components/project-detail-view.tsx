'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useProject } from '../hooks/use-research';
import {
  GovernanceNotice,
  ProgressBar,
  ResearchEmpty,
  ResearchError,
  ResearchLoading,
  StatusBadge,
} from './research-atoms';
import {
  ApprovalsPanel,
  ArtifactsPanel,
  DependenciesPanel,
  HypothesisPanel,
  LifecycleTimeline,
  MetadataPanel,
  MetricsPanel,
  MilestonesPanel,
  ObjectivesPanel,
  ReviewsPanel,
  SessionsPanel,
} from './panels';

/** Research project details — the full lifecycle orchestration surface for one
 *  project: hypothesis, lifecycle, objectives, dependencies, milestones,
 *  validation/reviews, approval, sessions, artifacts, metadata and metrics. */
export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { data, isLoading, isError, refetch } = useProject(projectId);

  if (isLoading) return <ResearchLoading />;
  if (isError) return <ResearchError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/research">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <ResearchEmpty label="No project matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to research">
          <Link href="/research">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.id}</span>
        <StatusBadge label={data.status.label} tone={data.status.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="max-w-md">
        <ProgressBar progress={data.progress} />
      </div>
      <GovernanceNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HypothesisPanel hypothesis={data.hypothesis} />
        <LifecycleTimeline stages={data.stages} />
        <ObjectivesPanel objectives={data.objectives} />
        <DependenciesPanel dependencies={data.dependencies} />
        <MilestonesPanel milestones={data.milestones} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <SessionsPanel sessions={data.sessions} />
        <ArtifactsPanel artifacts={data.artifacts} />
        <MetricsPanel metrics={data.metrics} />
        <MetadataPanel rows={data.metadata} />
      </div>
    </div>
  );
}
