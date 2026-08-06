'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useStrategy } from '../hooks/use-strategies';
import { StrategyStatusBadge } from './strategy-status-badge';
import { AdvisoryNotice } from './advisory-notice';
import { StrategyMetadataPanel } from './strategy-metadata-panel';
import { SignalComposition } from './signal-composition';
import { StrategyValidationSummary } from './strategy-validation-summary';
import { StrategyRiskSummary } from './strategy-risk-summary';
import { PerformancePlaceholder } from './performance-placeholder';
import { StrategyWorkflowStatus } from './strategy-workflow-status';
import { StrategyTimeline } from './strategy-timeline';
import { StrategyVersionsPanel } from './strategy-versions-panel';
import { StrategyLineagePanel } from './strategy-lineage-panel';
import { ReferenceList } from './reference-list';
import { StrategyLoadingState } from './strategy-loading-state';
import { StrategyErrorState } from './strategy-error-state';

/** Strategy details container. Orchestrates the detail query and lays out the
 *  composition, validation, risk, performance, workflow, timeline and reference
 *  panels. Strategies are advisory — the advisory notice is always shown. */
export function StrategyDetailView({ strategyId }: { strategyId: string }) {
  const { data, isLoading, isError, refetch } = useStrategy(strategyId);

  if (isLoading) return <StrategyLoadingState />;
  if (isError) return <StrategyErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Strategy not found"
        description="No strategy matches this identifier."
        homeHref="/strategies"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to strategies">
          <Link href="/strategies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <StrategyStatusBadge label={data.status.label} tone={data.status.tone} />
        <StrategyStatusBadge label={data.eligibility.label} tone={data.eligibility.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <AdvisoryNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StrategyMetadataPanel rows={data.metadata} />
        <SignalComposition composition={data.composition} />
        <StrategyValidationSummary validation={data.validation} />
        <StrategyRiskSummary risk={data.risk} />
        <StrategyWorkflowStatus
          approval={data.approval}
          eligibility={data.eligibility}
          workflow={data.workflow}
        />
        <StrategyTimeline steps={data.timeline} />
        <PerformancePlaceholder backtestRef={data.backtestRef} />
        <ReferenceList
          title="Portfolio references"
          references={data.portfolioRefs}
          emptyLabel="Not used by any portfolio yet."
        />
        <ReferenceList
          title="Traceability (experiments)"
          references={data.experimentRefs}
          emptyLabel="No originating experiments."
        />
        <StrategyLineagePanel lineage={data.lineage} />
        <StrategyVersionsPanel versions={data.versions} />
      </div>
    </div>
  );
}
