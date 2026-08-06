'use client';

import { Input } from '@platform/ui';
import type { FeatureStatusDto } from '../domain/dto';
import type { FeatureSortField } from '../domain/query';
import { useFeatureQueryStore } from '../hooks/use-feature-query-store';

const STATUS_OPTIONS: readonly (FeatureStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'REGISTERED',
  'UNDER_VALIDATION',
  'APPROVED',
  'REJECTED',
  'DEPRECATED',
  'RETIRED',
];

const CATEGORY_OPTIONS: readonly string[] = [
  'ALL',
  'REVERSAL',
  'MOMENTUM',
  'VALUE',
  'CARRY',
  'RISK',
  'LIQUIDITY',
];

const SORT_OPTIONS: readonly { value: FeatureSortField; label: string }[] = [
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
export function FeatureToolbar() {
  const search = useFeatureQueryStore((state) => state.search);
  const status = useFeatureQueryStore((state) => state.status);
  const category = useFeatureQueryStore((state) => state.category);
  const sortBy = useFeatureQueryStore((state) => state.sortBy);
  const setSearch = useFeatureQueryStore((state) => state.setSearch);
  const setStatus = useFeatureQueryStore((state) => state.setStatus);
  const setCategory = useFeatureQueryStore((state) => state.setCategory);
  const setSort = useFeatureQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search features"
        placeholder="Search features…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as FeatureStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by category"
        className={selectClass}
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All categories' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort by"
        className={selectClass}
        value={sortBy}
        onChange={(event) => setSort(event.target.value as FeatureSortField)}
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
