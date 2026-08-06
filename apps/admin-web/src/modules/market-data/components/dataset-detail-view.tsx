'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useDataset } from '../hooks/use-market-data';
import {
  MarketEmpty,
  MarketError,
  MarketLoading,
  PlatformNotice,
  StatusBadge,
} from './market-atoms';
import {
  CoveragePanel,
  MetadataPanel,
  QualityPanel,
  TimeSeriesPanel,
  VersionsPanel,
} from './panels';

/** Dataset details container — metadata, coverage, quality, versions, metadata
 *  explorer and the time-series explorer for one canonical dataset. */
export function DatasetDetailView({ datasetId }: { datasetId: string }) {
  const { data, isLoading, isError, refetch } = useDataset(datasetId);

  if (isLoading) return <MarketLoading />;
  if (isError) return <MarketError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/market-data/datasets">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <MarketEmpty label="No dataset matches this identifier." />
      </div>
    );
  }

  const { dataset, timeSeries } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to datasets">
          <Link href="/market-data/datasets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{dataset.name}</h1>
        <span className="font-mono text-xs text-muted-foreground">{dataset.id}</span>
        <StatusBadge label={dataset.marketDataType.label} tone={dataset.marketDataType.tone} />
        <StatusBadge label={dataset.status.label} tone={dataset.status.tone} />
      </div>
      <PlatformNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetadataPanel title="Metadata" rows={dataset.metadata} />
        <CoveragePanel coverage={dataset.coverage} />
        <QualityPanel quality={dataset.quality} />
        <VersionsPanel versions={dataset.versions} />
        <MetadataPanel title="Extended metadata" rows={dataset.extra} />
        <TimeSeriesPanel series={timeSeries} />
      </div>
    </div>
  );
}
