'use client';

import { Input } from '@platform/ui';
import type { ExecutionModeDto, ExecutionStatusDto } from '../domain/dto';
import type { ExecutionSortField } from '../domain/query';
import { useExecutionQueryStore } from '../hooks/use-execution-query-store';

const STATUS_OPTIONS: readonly (ExecutionStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'REQUESTED',
  'PENDING_APPROVAL',
  'APPROVED',
  'AUTHORIZED',
  'RUNNING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'FAILED',
];

const MODE_OPTIONS: readonly (ExecutionModeDto | 'ALL')[] = ['ALL', 'PAPER', 'LIVE'];

const SORT_OPTIONS: readonly { value: ExecutionSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Search / filter / sort controls. Updates UI state only. */
export function ExecutionToolbar() {
  const search = useExecutionQueryStore((state) => state.search);
  const status = useExecutionQueryStore((state) => state.status);
  const mode = useExecutionQueryStore((state) => state.mode);
  const sortBy = useExecutionQueryStore((state) => state.sortBy);
  const setSearch = useExecutionQueryStore((state) => state.setSearch);
  const setStatus = useExecutionQueryStore((state) => state.setStatus);
  const setMode = useExecutionQueryStore((state) => state.setMode);
  const setSort = useExecutionQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search execution requests"
        placeholder="Search execution requests…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as ExecutionStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by mode"
        className={selectClass}
        value={mode}
        onChange={(event) => setMode(event.target.value as ExecutionModeDto | 'ALL')}
      >
        {MODE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All modes' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort by"
        className={selectClass}
        value={sortBy}
        onChange={(event) => setSort(event.target.value as ExecutionSortField)}
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
