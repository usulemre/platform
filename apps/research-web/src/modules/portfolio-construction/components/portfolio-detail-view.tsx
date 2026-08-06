'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { usePortfolio } from '../hooks/use-portfolio-construction';
import {
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './portfolio-construction-atoms';
import {
  AllocationPanel,
  ApprovalsPanel,
  ArtifactsPanel,
  ConstraintsPanel,
  DependenciesPanel,
  LifecycleTimeline,
  LineagePanel,
  MetricsOverview,
  OptimizationPanel,
  OptimizationRequestsPanel,
  ReviewsPanel,
  SessionsPanel,
  SignalSelectionPanel,
  SnapshotsPanel,
  UniversePanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Portfolio Details — the full record for one portfolio: lifecycle, universe, signal
 *  selection, constraints, allocation explorer, optimization + controls, characteristics,
 *  validation, sessions, dependencies, lineage, artifacts, reviews, approval, versions,
 *  snapshots, links and metadata. */
export function PortfolioDetailView({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, isError, refetch } = usePortfolio(portfolioId);

  if (isLoading) return <PortfolioConstructionLoading />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/portfolio-construction">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <PortfolioConstructionEmpty label="No portfolio matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to portfolio construction">
          <Link href="/portfolio-construction">
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
        <StatusBadge
          label={`Optimization: ${data.optimization.status.label}`}
          tone={data.optimization.status.tone}
        />
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
        <OptimizationPanel optimization={data.optimization} controls={data.optimizationControls} />
        <UniversePanel universe={data.universe} />
        <SignalSelectionPanel selection={data.signalSelection} />
        <ConstraintsPanel constraints={data.constraints} />
        <ValidationPanel validation={data.validation} />
      </div>

      <AllocationPanel allocation={data.allocation} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OptimizationRequestsPanel requests={data.optimizationRequests} />
        <SessionsPanel sessions={data.sessions} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <ArtifactsPanel artifacts={data.artifacts} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
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
