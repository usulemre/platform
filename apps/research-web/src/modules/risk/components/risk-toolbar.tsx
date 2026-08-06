'use client';

import { Input } from '@platform/ui';
import type { RiskAssessmentStatusDto, SubjectKindDto } from '../domain/dto';
import type { RiskSortField } from '../domain/query';
import { useRiskQueryStore } from '../hooks/use-risk-query-store';

const STATUS_OPTIONS: readonly (RiskAssessmentStatusDto | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'EXPIRED',
];

const SUBJECT_OPTIONS: readonly (SubjectKindDto | 'ALL')[] = [
  'ALL',
  'PORTFOLIO',
  'STRATEGY',
  'EXECUTION_CANDIDATE',
];

const SORT_OPTIONS: readonly { value: RiskSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'riskLevel', label: 'Risk level' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Search / filter / sort controls. Updates UI state only. */
export function RiskToolbar() {
  const search = useRiskQueryStore((state) => state.search);
  const status = useRiskQueryStore((state) => state.status);
  const subjectKind = useRiskQueryStore((state) => state.subjectKind);
  const sortBy = useRiskQueryStore((state) => state.sortBy);
  const setSearch = useRiskQueryStore((state) => state.setSearch);
  const setStatus = useRiskQueryStore((state) => state.setStatus);
  const setSubjectKind = useRiskQueryStore((state) => state.setSubjectKind);
  const setSort = useRiskQueryStore((state) => state.setSort);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        aria-label="Search risk assessments"
        placeholder="Search risk assessments…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      <select
        aria-label="Filter by status"
        className={selectClass}
        value={status}
        onChange={(event) => setStatus(event.target.value as RiskAssessmentStatusDto | 'ALL')}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Filter by subject"
        className={selectClass}
        value={subjectKind}
        onChange={(event) => setSubjectKind(event.target.value as SubjectKindDto | 'ALL')}
      >
        {SUBJECT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All subjects' : humanize(option)}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort by"
        className={selectClass}
        value={sortBy}
        onChange={(event) => setSort(event.target.value as RiskSortField)}
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
