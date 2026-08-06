'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useBacktest } from '../hooks/use-backtesting';
import {
  BacktestingEmpty,
  BacktestingError,
  BacktestingLoading,
  GovernanceNotice,
  InfoCard,
  KeyValueList,
  ProgressBar,
  StatusBadge,
  TagList,
} from './backtesting-atoms';
import {
  ApprovalsPanel,
  ArtifactsPanel,
  ConfigurationPanel,
  DependenciesPanel,
  LifecycleTimeline,
  LineagePanel,
  MetricsOverview,
  ReportsPanel,
  ResultsPanel,
  ReviewsPanel,
  RunPanel,
  SessionsPanel,
  ValidationPanel,
  VersionsPanel,
} from './panels';

/** Backtest Details — the full record for one backtest: lifecycle, run + controls,
 *  configuration, metrics overview, validation, results, reports, sessions,
 *  dependencies, lineage, artifacts, reviews, approval, versions, links and
 *  metadata. */
export function BacktestDetailView({ backtestId }: { backtestId: string }) {
  const { data, isLoading, isError, refetch } = useBacktest(backtestId);

  if (isLoading) return <BacktestingLoading />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/backtesting">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <BacktestingEmpty label="No backtest matches this identifier." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to backtesting">
          <Link href="/backtesting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{data.key}</span>
        <StatusBadge label={data.stage.label} tone={data.stage.tone} />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
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
        <ConfigurationPanel configuration={data.configuration} />
        <ValidationPanel validation={data.validation} />
        <ResultsPanel results={data.results} />
        <ReportsPanel reports={data.reports} />
        <SessionsPanel sessions={data.sessions} />
        <DependenciesPanel dependencies={data.dependencies} />
        <LineagePanel lineage={data.lineage} />
        <ArtifactsPanel artifacts={data.artifacts} />
        <ReviewsPanel reviews={data.reviews} />
        <ApprovalsPanel approvals={data.approvals} />
        <VersionsPanel versions={data.versions} />
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
