'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useAgents } from '../hooks/use-agents';
import { useAgentQueryStore } from '../hooks/use-agent-query-store';
import type { AgentAuthorityDto, AgentStatusDto } from '../domain/dto';
import type { AgentQuery, AgentSortField } from '../domain/query';
import { AgentEmpty, AgentError, AgentLoading, StatusBadge } from './agent-atoms';

const STATUS_OPTIONS: readonly (AgentStatusDto | 'ALL')[] = [
  'ALL',
  'REGISTERED',
  'ACTIVE',
  'UNDER_EVALUATION',
  'SUSPENDED',
  'DEPRECATED',
  'RETIRED',
];

const AUTHORITY_OPTIONS: readonly (AgentAuthorityDto | 'ALL')[] = [
  'ALL',
  'PROPOSES',
  'NARRATES',
  'OBSERVES',
];

const SORT_OPTIONS: readonly { value: AgentSortField; label: string }[] = [
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

/** Registered agents list: search / filter / sort + full state set. */
export function RegisteredAgents() {
  const search = useAgentQueryStore((state) => state.search);
  const status = useAgentQueryStore((state) => state.status);
  const authority = useAgentQueryStore((state) => state.authority);
  const sortBy = useAgentQueryStore((state) => state.sortBy);
  const sortDir = useAgentQueryStore((state) => state.sortDir);
  const setSearch = useAgentQueryStore((state) => state.setSearch);
  const setStatus = useAgentQueryStore((state) => state.setStatus);
  const setAuthority = useAgentQueryStore((state) => state.setAuthority);
  const setSort = useAgentQueryStore((state) => state.setSort);

  const query = useMemo<AgentQuery>(
    () => ({ search, status, authority, sortBy, sortDir }),
    [search, status, authority, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useAgents(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search agents"
          placeholder="Search agents…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as AgentStatusDto | 'ALL')}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All statuses' : humanize(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by authority"
          className={selectClass}
          value={authority}
          onChange={(event) => setAuthority(event.target.value as AgentAuthorityDto | 'ALL')}
        >
          {AUTHORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All authorities' : humanize(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as AgentSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <AgentLoading />
      ) : isError ? (
        <AgentError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <AgentEmpty label="No agents match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Registered agents</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Agent
                </th>
                <th scope="col" className="px-4 py-2">
                  Category
                </th>
                <th scope="col" className="px-4 py-2">
                  Authority
                </th>
                <th scope="col" className="px-4 py-2">
                  Health
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
              {data.map((agent) => (
                <tr key={agent.id} className="border-b last:border-0 hover:bg-accent/50">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link href={`/agents/${agent.id}`} className="hover:underline">
                      {agent.name}
                    </Link>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">{agent.id}</span>
                  </th>
                  <td className="px-4 py-2">{agent.category}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={agent.authority.label} tone={agent.authority.tone} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={agent.health.label} tone={agent.health.tone} />
                  </td>
                  <td className="px-4 py-2">{agent.updatedLabel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={agent.status.label} tone={agent.status.tone} />
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
