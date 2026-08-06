'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useExperiment } from '../hooks/use-experiments';
import { ExperimentStatusBadge } from './experiment-status-badge';
import { ExperimentMetadataPanel } from './experiment-metadata-panel';
import { ResearchQuestionPanel } from './research-question-panel';
import { HypothesisPanel } from './hypothesis-panel';
import { DatasetReferences, FeatureReferences } from './reference-list';
import { WorkflowStatusPanel } from './workflow-status';
import { ExperimentValidationSummary } from './experiment-validation-summary';
import { ExperimentTimeline } from './experiment-timeline';
import { ExperimentLoadingState } from './experiment-loading-state';
import { ExperimentErrorState } from './experiment-error-state';

/** Experiment details container. Orchestrates the detail query and lays out the
 *  research/hypothesis/reference/workflow/validation/timeline panels. */
export function ExperimentDetailView({ experimentId }: { experimentId: string }) {
  const { data, isLoading, isError, refetch } = useExperiment(experimentId);

  if (isLoading) return <ExperimentLoadingState />;
  if (isError) return <ExperimentErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Experiment not found"
        description="No experiment matches this identifier."
        homeHref="/experiments"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to experiments">
          <Link href="/experiments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
        <ExperimentStatusBadge label={data.status.label} tone={data.status.tone} />
        <ExperimentStatusBadge label={data.outcome.label} tone={data.outcome.tone} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ResearchQuestionPanel
          researchQuestion={data.researchQuestion}
          economicRationale={data.economicRationale}
        />
        <HypothesisPanel hypothesis={data.hypothesis} />
        <ExperimentMetadataPanel rows={data.metadata} />
        <WorkflowStatusPanel workflow={data.workflow} />
        <DatasetReferences references={data.datasetRefs} />
        <FeatureReferences references={data.featureRefs} />
        <ExperimentValidationSummary validation={data.validation} />
        <ExperimentTimeline steps={data.timeline} />
      </div>
    </div>
  );
}
