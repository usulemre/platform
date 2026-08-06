'use client';

import { Input } from '@platform/ui';
import type { ExperimentOutcomeDto, ExperimentStatusDto } from '../domain/dto';
import type { ExperimentSortField } from '../domain/query';
import { useExperimentQueryStore } from '../hooks/use-experiment-query-store';

const STATUS_OPTIONS: readonly (ExperimentStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'REGISTERED',
  'PRE_REGISTERED',
  'RUNNING',
  'UNDER_VALIDATION',
  'UNDER_REVIEW',
  'CONCLUDED',
  'ARCHIVED',
];

const OUTCOME_OPTIONS: readonly (ExperimentOutcomeDto | 'ALL')[] = [
  'ALL',
  'PENDING',
  'SUPPORTED',
  'REFUTED',
  'INCONCLUSIVE',
];

const SORT_OPTIONS: readonly { value: ExperimentSortField; label: string }[] = [
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
export function ExperimentToolbar() {
  const search = useExperimentQueryStore((state) => state.search);
  const status = useExperimentQueryStore((state) => state.status);
  const outcome = useExperimentQueryStore((state) => state.outcome);
  const sortBy = useExperimentQueryStore((state) => state.sortBy);
  const setSearch = useExperimentQueryStore((state) => state.setSearch);
  const setStatus = useExperimentQueryStore((state) => state.setStatus);
  const setOutcome = useExperimentQueryStore((state) => state.setOutcome);
  const setSort = useExperimentQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search experiments"
        placeholder="Search experiments…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as ExperimentStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by outcome"
        className={selectClass}
        value={outcome}
        onChange={(event) => setOutcome(event.target.value as ExperimentOutcomeDto | 'ALL')}
      >
        {OUTCOME_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All outcomes' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort by"
        className={selectClass}
        value={sortBy}
        onChange={(event) => setSort(event.target.value as ExperimentSortField)}
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
