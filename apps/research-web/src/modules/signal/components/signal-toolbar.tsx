'use client';

import { Input } from '@platform/ui';
import type { SignalStatusDto } from '../domain/dto';
import type { SignalSortField } from '../domain/query';
import { useSignalQueryStore } from '../hooks/use-signal-query-store';

const STATUS_OPTIONS: readonly (SignalStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const ASSET_OPTIONS: readonly string[] = ['ALL', 'EQUITY', 'FX', 'RATES', 'CREDIT', 'FUTURES'];

const SORT_OPTIONS: readonly { value: SignalSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'category', label: 'Category' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Search / filter / sort controls. Updates UI state only. */
export function SignalToolbar() {
  const search = useSignalQueryStore((state) => state.search);
  const status = useSignalQueryStore((state) => state.status);
  const assetClass = useSignalQueryStore((state) => state.assetClass);
  const sortBy = useSignalQueryStore((state) => state.sortBy);
  const setSearch = useSignalQueryStore((state) => state.setSearch);
  const setStatus = useSignalQueryStore((state) => state.setStatus);
  const setAssetClass = useSignalQueryStore((state) => state.setAssetClass);
  const setSort = useSignalQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search signals"
        placeholder="Search signals…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as SignalStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : humanize(option)}
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
        onChange={(event) => setSort(event.target.value as SignalSortField)}
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
