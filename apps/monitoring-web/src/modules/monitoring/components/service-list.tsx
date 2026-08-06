'use client';

import { useMemo } from 'react';
import { Input } from '@platform/ui';
import { useServices } from '../hooks/use-monitoring';
import { useServiceQueryStore } from '../hooks/use-service-query-store';
import type { MonitorLevel } from '../domain/dto';
import type { ServiceQuery, ServiceSortField } from '../domain/query';
import { MonitorEmpty, MonitorError, MonitorLoading, StatusBadge } from './monitoring-atoms';

const LEVEL_OPTIONS: readonly (MonitorLevel | 'ALL')[] = [
  'ALL',
  'OK',
  'INFO',
  'WARN',
  'ERROR',
  'NEUTRAL',
];
const SORT_OPTIONS: readonly { value: ServiceSortField; label: string }[] = [
  { value: 'level', label: 'Severity' },
  { value: 'name', label: 'Name' },
  { value: 'category', label: 'Category' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Service Health list with search / filter / sort and the full state set. */
export function ServiceListView() {
  const search = useServiceQueryStore((state) => state.search);
  const level = useServiceQueryStore((state) => state.level);
  const sortBy = useServiceQueryStore((state) => state.sortBy);
  const sortDir = useServiceQueryStore((state) => state.sortDir);
  const setSearch = useServiceQueryStore((state) => state.setSearch);
  const setLevel = useServiceQueryStore((state) => state.setLevel);
  const setSort = useServiceQueryStore((state) => state.setSort);

  const query = useMemo<ServiceQuery>(
    () => ({ search, level, sortBy, sortDir }),
    [search, level, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useServices(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search services"
          placeholder="Search services…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by severity"
          className={selectClass}
          value={level}
          onChange={(event) => setLevel(event.target.value as MonitorLevel | 'ALL')}
        >
          {LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All severities' : option}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as ServiceSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <MonitorLoading rows={5} />
      ) : isError ? (
        <MonitorError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MonitorEmpty label="No services match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Service health</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Service
                </th>
                <th scope="col" className="px-4 py-2">
                  Category
                </th>
                <th scope="col" className="px-4 py-2">
                  Latency
                </th>
                <th scope="col" className="px-4 py-2">
                  Uptime
                </th>
                <th scope="col" className="px-4 py-2">
                  Last check
                </th>
                <th scope="col" className="px-4 py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((service) => (
                <tr key={service.id} className="border-b last:border-0">
                  <th scope="row" className="px-4 py-2 font-medium">
                    {service.name}
                  </th>
                  <td className="px-4 py-2">{service.category}</td>
                  <td className="px-4 py-2">{service.latency}</td>
                  <td className="px-4 py-2">{service.uptime}</td>
                  <td className="px-4 py-2">{service.lastCheckLabel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={service.statusLabel} tone={service.tone} />
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
