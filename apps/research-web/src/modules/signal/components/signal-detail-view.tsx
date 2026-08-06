'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useSignal } from '../hooks/use-signals';
import { SignalStatusBadge } from './signal-status-badge';
import { AdvisoryNotice } from './advisory-notice';
import { SignalMetadataPanel } from './signal-metadata-panel';
import { SignalRegistryPanel } from './signal-registry-panel';
import { SignalValidationSummary } from './signal-validation-summary';
import { SignalQualityIndicators } from './signal-quality-indicators';
import { SignalWorkflowStatus } from './signal-workflow-status';
import { SignalLineagePanel } from './signal-lineage-panel';
import { SignalVersionsPanel } from './signal-versions-panel';
import { ReferenceList } from './reference-list';
import { SignalLoadingState } from './signal-loading-state';
import { SignalErrorState } from './signal-error-state';

/** Signal details container. Orchestrates the detail query and lays out the
 *  registry, validation, quality, dependency, traceability, lineage and version
 *  panels. Signals are advisory — the advisory notice is always shown. */
export function SignalDetailView({ signalId }: { signalId: string }) {
  const { data, isLoading, isError, refetch } = useSignal(signalId);

  if (isLoading) return <SignalLoadingState />;
  if (isError) return <SignalErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Signal not found"
        description="No signal matches this identifier."
        homeHref="/signals"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to signals">
          <Link href="/signals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <SignalStatusBadge label={data.status.label} tone={data.status.tone} />
        <SignalStatusBadge label={data.eligibility.label} tone={data.eligibility.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <AdvisoryNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SignalMetadataPanel rows={data.metadata} />
        <SignalRegistryPanel registry={data.registry} />
        <SignalValidationSummary validation={data.validation} />
        <SignalQualityIndicators quality={data.quality} />
        <SignalWorkflowStatus
          approval={data.approval}
          eligibility={data.eligibility}
          workflow={data.workflow}
        />
        <ReferenceList
          title="Feature dependencies"
          references={data.dependsOnFeatures}
          emptyLabel="No feature dependencies."
        />
        <ReferenceList
          title="Strategy references"
          references={data.strategyRefs}
          emptyLabel="Not used by any strategy yet."
        />
        <ReferenceList
          title="Traceability (experiments)"
          references={data.experimentRefs}
          emptyLabel="No originating experiments."
        />
        <SignalLineagePanel lineage={data.lineage} />
        <SignalVersionsPanel versions={data.versions} />
      </div>
    </div>
  );
}
