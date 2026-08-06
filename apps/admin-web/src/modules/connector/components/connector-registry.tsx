'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useConnectors } from '../hooks/use-connectors';
import { useConnectorQueryStore } from '../hooks/use-connector-query-store';
import { CONNECTOR_TYPE_ORDER, typeLabel } from '../domain/catalog';
import type { ConnectorStatusDto, ConnectorTypeDto } from '../domain/dto';
import type { ConnectorQuery, ConnectorSortField } from '../domain/query';
import { ConnectorEmpty, ConnectorError, ConnectorLoading, StatusBadge } from './connector-atoms';

const STATUS_OPTIONS: readonly (ConnectorStatusDto | 'ALL')[] = [
  'ALL',
  'REGISTERED',
  'ENABLED',
  'DISABLED',
  'MAINTENANCE',
  'DEPRECATED',
  'RETIRED',
];

const TYPE_OPTIONS: readonly (ConnectorTypeDto | 'ALL')[] = ['ALL', ...CONNECTOR_TYPE_ORDER];

const SORT_OPTIONS: readonly { value: ConnectorSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanizeStatus(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Connector Registry list: search / filter (type, status) / sort + full state set. */
export function ConnectorRegistry() {
  const search = useConnectorQueryStore((state) => state.search);
  const type = useConnectorQueryStore((state) => state.type);
  const status = useConnectorQueryStore((state) => state.status);
  const sortBy = useConnectorQueryStore((state) => state.sortBy);
  const sortDir = useConnectorQueryStore((state) => state.sortDir);
  const setSearch = useConnectorQueryStore((state) => state.setSearch);
  const setType = useConnectorQueryStore((state) => state.setType);
  const setStatus = useConnectorQueryStore((state) => state.setStatus);
  const setSort = useConnectorQueryStore((state) => state.setSort);

  const query = useMemo<ConnectorQuery>(
    () => ({ search, type, status, sortBy, sortDir }),
    [search, type, status, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useConnectors(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search connectors"
          placeholder="Search connectors…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by type"
          className={selectClass}
          value={type}
          onChange={(event) => setType(event.target.value as ConnectorTypeDto | 'ALL')}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All types' : typeLabel(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as ConnectorStatusDto | 'ALL')}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All statuses' : humanizeStatus(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as ConnectorSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <ConnectorLoading />
      ) : isError ? (
        <ConnectorError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <ConnectorEmpty label="No connectors match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Registered connectors</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Connector
                </th>
                <th scope="col" className="px-4 py-2">
                  Type
                </th>
                <th scope="col" className="px-4 py-2">
                  Environment
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
              {data.map((connector) => (
                <tr key={connector.id} className="border-b last:border-0 hover:bg-accent/50">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link href={`/connectors/${connector.id}`} className="hover:underline">
                      {connector.name}
                    </Link>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      {connector.provider}
                    </span>
                  </th>
                  <td className="px-4 py-2">
                    <StatusBadge label={connector.type.label} tone={connector.type.tone} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge
                      label={connector.environment.label}
                      tone={connector.environment.tone}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={connector.health.label} tone={connector.health.tone} />
                  </td>
                  <td className="px-4 py-2">{connector.updatedLabel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={connector.status.label} tone={connector.status.tone} />
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
