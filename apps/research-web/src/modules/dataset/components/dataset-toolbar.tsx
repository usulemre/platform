'use client';

import { Input } from '@platform/ui';
import type { DatasetStatusDto } from '../domain/dto';
import type { DatasetSortField } from '../domain/query';
import { useDatasetQueryStore } from '../hooks/use-dataset-query-store';

const STATUS_OPTIONS: readonly (DatasetStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'INGESTED',
  'QUARANTINED',
  'CERTIFIED',
  'DEPRECATED',
  'RETIRED',
];

const ASSET_OPTIONS: readonly string[] = ['ALL', 'EQUITY', 'FX', 'RATES', 'CREDIT', 'FUTURES'];

const SORT_OPTIONS: readonly { value: DatasetSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Search / filter / sort controls. Updates UI state only; the view derives the
 *  query and calls the application service. */
export function DatasetToolbar() {
  const search = useDatasetQueryStore((state) => state.search);
  const status = useDatasetQueryStore((state) => state.status);
  const assetClass = useDatasetQueryStore((state) => state.assetClass);
  const sortBy = useDatasetQueryStore((state) => state.sortBy);
  const setSearch = useDatasetQueryStore((state) => state.setSearch);
  const setStatus = useDatasetQueryStore((state) => state.setStatus);
  const setAssetClass = useDatasetQueryStore((state) => state.setAssetClass);
  const setSort = useDatasetQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search datasets"
        placeholder="Search datasets…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as DatasetStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : option}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by asset class"
        className={selectClass}
        value={assetClass}
        onChange={(event) => setAssetClass(event.target.value)}
      >
        {ASSET_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All asset classes' : option}
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
  );
}
