'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { SIMULATION_STAGES, describeStage } from '@platform/execution-sdk';
import { useSessions } from '../hooks/use-execution-simulator';
import { useSessionQueryStore } from '../hooks/use-session-query-store';
import type { SimulationStage } from '../domain/dto';
import type { SessionQuery, SessionSortField } from '../domain/query';
import type { SessionListItemVm } from '../domain/view-model';
import { ExecutionEmpty, ExecutionError, ExecutionLoading, StatusBadge } from './execution-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'multi-asset', 'credit', 'fx'];
const STAGE_OPTIONS: readonly (SimulationStage | 'ALL')[] = ['ALL', ...SIMULATION_STAGES];
const SORT_OPTIONS: readonly { value: SessionSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/[_-]/g, ' ');
}

function SessionCard({ session }: { session: SessionListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/execution-simulator/${session.id}`} className="font-medium hover:underline">
            {session.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {session.namespace} / {session.family} · v{session.version}
          </p>
        </div>
        <StatusBadge label={session.stage.label} tone={session.stage.tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge label={`Run: ${session.run.label}`} tone={session.run.tone} />
        <StatusBadge
          label={`Validation: ${session.validation.label}`}
          tone={session.validation.tone}
        />
        <StatusBadge label={`Approval: ${session.approval.label}`} tone={session.approval.tone} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{session.owner}</span>
        <span>updated {session.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Simulation Sessions registry — search / filter / sort over the registry. */
export function SessionRegistry() {
  const search = useSessionQueryStore((state) => state.search);
  const namespace = useSessionQueryStore((state) => state.namespace);
  const stage = useSessionQueryStore((state) => state.stage);
  const sortBy = useSessionQueryStore((state) => state.sortBy);
  const sortDir = useSessionQueryStore((state) => state.sortDir);
  const setSearch = useSessionQueryStore((state) => state.setSearch);
  const setNamespace = useSessionQueryStore((state) => state.setNamespace);
  const setStage = useSessionQueryStore((state) => state.setStage);
  const setSort = useSessionQueryStore((state) => state.setSort);

  const query = useMemo<SessionQuery>(
    () => ({ search, namespace, stage, sortBy, sortDir }),
    [search, namespace, stage, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useSessions(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search sessions"
          placeholder="Search simulation sessions…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by namespace"
          className={selectClass}
          value={namespace}
          onChange={(event) => setNamespace(event.target.value)}
        >
          {NAMESPACE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All namespaces' : humanize(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by stage"
          className={selectClass}
          value={stage}
          onChange={(event) => setStage(event.target.value as SimulationStage | 'ALL')}
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All stages' : describeStage(option).label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as SessionSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ExecutionLoading />
      ) : isError ? (
        <ExecutionError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <ExecutionEmpty label="No sessions match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </ul>
      )}
    </div>
  );
}
