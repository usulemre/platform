'use client';

import { Input } from '@platform/ui';
import type { PortfolioStatusDto } from '../domain/dto';
import type { PortfolioSortField } from '../domain/query';
import { usePortfolioQueryStore } from '../hooks/use-portfolio-query-store';

const STATUS_OPTIONS: readonly (PortfolioStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const ASSET_OPTIONS: readonly string[] = ['ALL', 'MULTI', 'EQUITY', 'FX', 'RATES', 'CREDIT'];

const SORT_OPTIONS: readonly { value: PortfolioSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'mandate', label: 'Mandate' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Search / filter / sort controls. Updates UI state only. */
export function PortfolioToolbar() {
  const search = usePortfolioQueryStore((state) => state.search);
  const status = usePortfolioQueryStore((state) => state.status);
  const assetClass = usePortfolioQueryStore((state) => state.assetClass);
  const sortBy = usePortfolioQueryStore((state) => state.sortBy);
  const setSearch = usePortfolioQueryStore((state) => state.setSearch);
  const setStatus = usePortfolioQueryStore((state) => state.setStatus);
  const setAssetClass = usePortfolioQueryStore((state) => state.setAssetClass);
  const setSort = usePortfolioQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search portfolios"
        placeholder="Search portfolios…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as PortfolioStatusDto | 'ALL')}
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
        onChange={(event) => setSort(event.target.value as PortfolioSortField)}
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
