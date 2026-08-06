'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useDataset } from '../hooks/use-datasets';
import { DatasetStatusBadge } from './dataset-status-badge';
import { DatasetMetadataPanel } from './dataset-metadata-panel';
import { DatasetValidationSummary } from './dataset-validation-summary';
import { DatasetLineagePanel } from './dataset-lineage-panel';
import { DatasetVersionHistory } from './dataset-version-history';
import { DatasetLoadingState } from './dataset-loading-state';
import { DatasetErrorState } from './dataset-error-state';

/** Dataset details container. Orchestrates the detail query and lays out the
 *  metadata, validation, lineage and version panels. */
export function DatasetDetailView({ datasetId }: { datasetId: string }) {
  const { data, isLoading, isError, refetch } = useDataset(datasetId);

  if (isLoading) return <DatasetLoadingState />;
  if (isError) return <DatasetErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Dataset not found"
        description="No dataset matches this identifier."
        homeHref="/datasets"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to datasets">
          <Link href="/datasets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <DatasetStatusBadge label={data.status.label} tone={data.status.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DatasetMetadataPanel rows={data.metadata} />
        <DatasetValidationSummary validation={data.validation} />
        <DatasetLineagePanel lineage={data.lineage} lineageRef={data.lineageRef} />
        <DatasetVersionHistory versions={data.versions} />
      </div>
    </div>
  );
}
