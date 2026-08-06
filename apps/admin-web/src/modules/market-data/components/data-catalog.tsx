'use client';

import Link from 'next/link';
import { useCatalog } from '../hooks/use-market-data';
import { MarketEmpty, MarketError, MarketLoading, StatusBadge } from './market-atoms';

/** Data Catalog — the discoverable catalog of available canonical datasets. */
export function DataCatalog() {
  const { data, isLoading, isError, refetch } = useCatalog();

  if (isLoading) return <MarketLoading />;
  if (isError) return <MarketError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <MarketEmpty label="The catalog is empty." />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Data catalog</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Dataset
            </th>
            <th scope="col" className="px-4 py-2">
              Type
            </th>
            <th scope="col" className="px-4 py-2">
              Asset class
            </th>
            <th scope="col" className="px-4 py-2">
              Latest version
            </th>
            <th scope="col" className="px-4 py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.datasetId} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/market-data/datasets/${entry.datasetId}`} className="hover:underline">
                  {entry.name}
                </Link>
              </th>
              <td className="px-4 py-2">
                <StatusBadge label={entry.marketDataType.label} tone={entry.marketDataType.tone} />
              </td>
              <td className="px-4 py-2">
                <StatusBadge label={entry.assetClass.label} tone={entry.assetClass.tone} />
              </td>
              <td className="px-4 py-2 font-mono text-xs">{entry.latestVersion}</td>
              <td className="px-4 py-2">
                <StatusBadge label={entry.status.label} tone={entry.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
