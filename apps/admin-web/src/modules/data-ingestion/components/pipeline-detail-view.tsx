'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { usePipeline } from '../hooks/use-ingestion';
import {
  IngestionEmpty,
  IngestionError,
  IngestionLoading,
  JobsTable,
  PlatformNotice,
  StatusBadge,
} from './ingestion-atoms';
import {
  PipelineCapabilities,
  PipelineHistory,
  PipelineMetadata,
  PipelineMetrics,
  PipelineValidation,
  StageMonitor,
} from './panels';
import { InfoCard } from './ingestion-atoms';

/** Pipeline details container. Orchestrates the detail query and lays out the
 *  metadata, stage monitor, metrics, validation, capabilities, jobs and history. */
export function PipelineDetailView({ pipelineId }: { pipelineId: string }) {
  const { data, isLoading, isError, refetch } = usePipeline(pipelineId);

  if (isLoading) return <IngestionLoading />;
  if (isError) return <IngestionError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/data-ingestion">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <IngestionEmpty label="No pipeline matches this identifier." />
      </div>
    );
  }

  const { pipeline, events, jobs } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to pipelines">
          <Link href="/data-ingestion">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{pipeline.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{pipeline.id}</span>
        <StatusBadge label={pipeline.dataType.label} tone={pipeline.dataType.tone} />
        <StatusBadge label={pipeline.status.label} tone={pipeline.status.tone} />
        <StatusBadge label={pipeline.health.label} tone={pipeline.health.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{pipeline.description}</p>
      <PlatformNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PipelineMetadata metadata={pipeline.metadata} />
        <StageMonitor stages={pipeline.stages} />
        <PipelineMetrics metrics={pipeline.metrics} />
        <PipelineValidation stages={pipeline.stages} quality={pipeline.quality} />
        <PipelineCapabilities capabilities={pipeline.capabilities} />
        <PipelineHistory events={events} />
      </div>

      <InfoCard title="Recent jobs">
        <JobsTable jobs={jobs} emptyLabel="No jobs for this pipeline." />
      </InfoCard>
    </div>
  );
}
