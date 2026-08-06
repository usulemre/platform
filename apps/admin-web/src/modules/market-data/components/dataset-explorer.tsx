'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { MARKET_DATA_TYPES, marketDataTypeLabel } from '@platform/market-data-sdk';
import { useDatasets } from '../hooks/use-market-data';
import { useDatasetQueryStore } from '../hooks/use-query-stores';
import type { DatasetStatus, MarketDataType } from '../domain/dto';
import type { DatasetQuery, DatasetSortField } from '../domain/query';
import { MarketEmpty, MarketError, MarketLoading, StatusBadge } from './market-atoms';

const STATUS_OPTIONS: readonly (DatasetStatus | 'ALL')[] = [
  'ALL',
  'ACTIVE',
  'STALE',
  'EMPTY',
  'DEPRECATED',
];
const TYPE_OPTIONS: readonly (MarketDataType | 'ALL')[] = ['ALL', ...MARKET_DATA_TYPES];
const SORT_OPTIONS: readonly { value: DatasetSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'marketDataType', label: 'Type' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Dataset Explorer — search / filter (type, status) / sort over canonical datasets. */
export function DatasetExplorer() {
  const search = useDatasetQueryStore((state) => state.search);
  const marketDataType = useDatasetQueryStore((state) => state.marketDataType);
  const status = useDatasetQueryStore((state) => state.status);
  const sortBy = useDatasetQueryStore((state) => state.sortBy);
  const sortDir = useDatasetQueryStore((state) => state.sortDir);
  const setSearch = useDatasetQueryStore((state) => state.setSearch);
  const setMarketDataType = useDatasetQueryStore((state) => state.setMarketDataType);
  const setStatus = useDatasetQueryStore((state) => state.setStatus);
  const setSort = useDatasetQueryStore((state) => state.setSort);

  const query = useMemo<DatasetQuery>(
    () => ({ search, marketDataType, status, sortBy, sortDir }),
    [search, marketDataType, status, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useDatasets(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search datasets"
          placeholder="Search datasets…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by type"
          className={selectClass}
          value={marketDataType}
          onChange={(event) => setMarketDataType(event.target.value as MarketDataType | 'ALL')}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All types' : marketDataTypeLabel(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as DatasetStatus | 'ALL')}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All statuses' : humanize(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as DatasetSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <MarketLoading />
      ) : isError ? (
        <MarketError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MarketEmpty label="No datasets match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Dataset explorer</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Dataset
                </th>
                <th scope="col" className="px-4 py-2">
                  Type
                </th>
                <th scope="col" className="px-4 py-2">
                  Coverage
                </th>
                <th scope="col" className="px-4 py-2">
                  Quality
                </th>
                <th scope="col" className="px-4 py-2">
                  Updated
                </th>
                <th scope="col" className="px-4 py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((dataset) => (
                <tr key={dataset.id} className="border-b last:border-0 hover:bg-accent/50">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link href={`/market-data/datasets/${dataset.id}`} className="hover:underline">
                      {dataset.name}
                    </Link>
                  </th>
                  <td className="px-4 py-2">
                    <StatusBadge
                      label={dataset.marketDataType.label}
                      tone={dataset.marketDataType.tone}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={dataset.coverage.label} tone={dataset.coverage.tone} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={dataset.quality.label} tone={dataset.quality.tone} />
                  </td>
                  <td className="px-4 py-2">{dataset.updatedLabel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={dataset.status.label} tone={dataset.status.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
