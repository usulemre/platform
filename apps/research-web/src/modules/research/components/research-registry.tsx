'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useProjects } from '../hooks/use-research';
import { useProjectQueryStore } from '../hooks/use-project-query-store';
import type { ProjectStatus } from '../domain/dto';
import type { ProjectQuery, ProjectSortField } from '../domain/query';
import {
  ProgressBar,
  ResearchEmpty,
  ResearchError,
  ResearchLoading,
  StatusBadge,
} from './research-atoms';

const STATUS_OPTIONS: readonly (ProjectStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'ACTIVE',
  'BLOCKED',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
  'REJECTED',
];
const SORT_OPTIONS: readonly { value: ProjectSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Research Registry — search / filter / sort over research projects. */
export function ResearchRegistry() {
  const search = useProjectQueryStore((state) => state.search);
  const status = useProjectQueryStore((state) => state.status);
  const sortBy = useProjectQueryStore((state) => state.sortBy);
  const sortDir = useProjectQueryStore((state) => state.sortDir);
  const setSearch = useProjectQueryStore((state) => state.setSearch);
  const setStatus = useProjectQueryStore((state) => state.setStatus);
  const setSort = useProjectQueryStore((state) => state.setSort);

  const query = useMemo<ProjectQuery>(
    () => ({ search, status, sortBy, sortDir }),
    [search, status, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useProjects(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search projects"
          placeholder="Search projects…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as ProjectSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ResearchLoading />
      ) : isError ? (
        <ResearchError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <ResearchEmpty label="No projects match your filters." />
      ) : (
        <ul className="space-y-3">
          {data.map((project) => (
            <li key={project.id} className="rounded-lg border p-4 hover:bg-accent/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/research/${project.id}`} className="font-medium hover:underline">
                  {project.name}
                </Link>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{project.owner}</span>
                  <StatusBadge label={project.status.label} tone={project.status.tone} />
                </span>
              </div>
              <div className="mt-3 max-w-md">
                <ProgressBar progress={project.progress} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
