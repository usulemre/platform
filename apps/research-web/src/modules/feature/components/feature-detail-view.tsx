'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useFeature } from '../hooks/use-features';
import { FeatureStatusBadge } from './feature-status-badge';
import { FeatureMetadataPanel } from './feature-metadata-panel';
import { FeatureRegistryPanel } from './feature-registry-panel';
import { FeatureValidationSummary } from './feature-validation-summary';
import { FeatureWorkflowStatus } from './feature-workflow-status';
import { FeatureLineagePanel } from './feature-lineage-panel';
import { FeatureVersionsPanel } from './feature-versions-panel';
import { ReferenceList } from './reference-list';
import { FeatureLoadingState } from './feature-loading-state';
import { FeatureErrorState } from './feature-error-state';

/** Feature details container. Orchestrates the detail query and lays out the
 *  registry, validation, dependency, usage, lineage and version panels. */
export function FeatureDetailView({ featureId }: { featureId: string }) {
  const { data, isLoading, isError, refetch } = useFeature(featureId);

  if (isLoading) return <FeatureLoadingState />;
  if (isError) return <FeatureErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Feature not found"
        description="No feature matches this identifier."
        homeHref="/features"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to features">
          <Link href="/features">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <FeatureStatusBadge label={data.status.label} tone={data.status.tone} />
        <FeatureStatusBadge label={data.approval.label} tone={data.approval.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FeatureMetadataPanel rows={data.metadata} />
        <FeatureRegistryPanel registry={data.registry} />
        <FeatureValidationSummary validation={data.validation} />
        <FeatureWorkflowStatus approval={data.approval} workflow={data.workflow} />
        <ReferenceList
          title="Dependencies"
          references={data.dependsOn}
          emptyLabel="No feature dependencies."
        />
        <ReferenceList
          title="Source datasets"
          references={data.datasetRefs}
          emptyLabel="No datasets referenced."
        />
        <ReferenceList
          title="Used by experiments"
          references={data.usageExperiments}
          emptyLabel="Not used by any experiment yet."
        />
        <ReferenceList
          title="Used by signals"
          references={data.usageSignals}
          emptyLabel="Not used by any signal yet."
        />
        <FeatureLineagePanel lineage={data.lineage} />
        <FeatureVersionsPanel versions={data.versions} />
      </div>
    </div>
  );
}
