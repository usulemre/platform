'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { useSymbol } from '../hooks/use-market-data';
import {
  InfoCard,
  MarketEmpty,
  MarketError,
  MarketLoading,
  PlatformNotice,
  StatusBadge,
} from './market-atoms';
import { MetadataPanel, TimeSeriesPanel } from './panels';

/** Symbol details container — metadata, aliases, related datasets and the
 *  time-series explorer for one canonical symbol. */
export function SymbolDetailView({ symbolId }: { symbolId: string }) {
  const { data, isLoading, isError, refetch } = useSymbol(symbolId);

  if (isLoading) return <MarketLoading />;
  if (isError) return <MarketError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/market-data/symbols">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
        <MarketEmpty label="No symbol matches this identifier." />
      </div>
    );
  }

  const { symbol, datasets, timeSeries } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to symbols">
          <Link href="/market-data/symbols">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-mono text-2xl font-semibold text-foreground">{symbol.canonical}</h1>
        <StatusBadge label={symbol.assetClass.label} tone={symbol.assetClass.tone} />
        <StatusBadge label={symbol.kind} tone="neutral" />
      </div>
      <PlatformNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MetadataPanel title="Symbol" rows={symbol.metadata} />
        <InfoCard title="Aliases">
          {symbol.aliases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No aliases.</p>
          ) : (
            <ul className="space-y-0.5 text-sm">
              {symbol.aliases.map((alias) => (
                <li key={alias} className="font-mono text-xs text-muted-foreground">
                  {alias}
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
        <TimeSeriesPanel series={timeSeries} />
        <InfoCard title="Datasets">
          {datasets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No datasets for this symbol.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {datasets.map((dataset) => (
                <li
                  key={dataset.id}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <Link
                    href={`/market-data/datasets/${dataset.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {dataset.name}
                  </Link>
                  <StatusBadge label={dataset.status.label} tone={dataset.status.tone} />
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      </div>
    </div>
  );
}
