'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { DATA_TYPES, describeDataType } from '@platform/data-sdk';
import { usePipelines } from '../hooks/use-ingestion';
import { usePipelineQueryStore } from '../hooks/use-pipeline-query-store';
import type { DataType, PipelineStatus } from '../domain/dto';
import type { PipelineQuery, PipelineSortField } from '../domain/query';
import { IngestionEmpty, IngestionError, IngestionLoading, StatusBadge } from './ingestion-atoms';

const STATUS_OPTIONS: readonly (PipelineStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'DEGRADED',
  'FAILED',
  'RETIRED',
];
const TYPE_OPTIONS: readonly (DataType | 'ALL')[] = ['ALL', ...DATA_TYPES];

const SORT_OPTIONS: readonly { value: PipelineSortField; label: string }[] = [
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'dataType', label: 'Data type' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanizeStatus(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Pipeline Registry list: search / filter (data type, status) / sort. */
export function PipelineRegistry() {
  const search = usePipelineQueryStore((state) => state.search);
  const dataType = usePipelineQueryStore((state) => state.dataType);
  const status = usePipelineQueryStore((state) => state.status);
  const sortBy = usePipelineQueryStore((state) => state.sortBy);
  const sortDir = usePipelineQueryStore((state) => state.sortDir);
  const setSearch = usePipelineQueryStore((state) => state.setSearch);
  const setDataType = usePipelineQueryStore((state) => state.setDataType);
  const setStatus = usePipelineQueryStore((state) => state.setStatus);
  const setSort = usePipelineQueryStore((state) => state.setSort);

  const query = useMemo<PipelineQuery>(
    () => ({ search, dataType, status, sortBy, sortDir }),
    [search, dataType, status, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = usePipelines(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search pipelines"
          placeholder="Search pipelines…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by data type"
          className={selectClass}
          value={dataType}
          onChange={(event) => setDataType(event.target.value as DataType | 'ALL')}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All data types' : describeDataType(option).label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as PipelineStatus | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as PipelineSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <IngestionLoading />
      ) : isError ? (
        <IngestionError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <IngestionEmpty label="No pipelines match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Registered ingestion pipelines</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Pipeline
                </th>
                <th scope="col" className="px-4 py-2">
                  Data type
                </th>
                <th scope="col" className="px-4 py-2">
                  Health
                </th>
                <th scope="col" className="px-4 py-2">
                  Quality
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
              {data.map((pipeline) => (
                <tr key={pipeline.id} className="border-b last:border-0 hover:bg-accent/50">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link href={`/data-ingestion/${pipeline.id}`} className="hover:underline">
                      {pipeline.name}
                    </Link>
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      {pipeline.sourceName}
                    </span>
                  </th>
                  <td className="px-4 py-2">
                    <StatusBadge label={pipeline.dataType.label} tone={pipeline.dataType.tone} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={pipeline.health.label} tone={pipeline.health.tone} />
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge label={pipeline.quality.label} tone={pipeline.quality.tone} />
                  </td>
                  <td className="px-4 py-2">{pipeline.updatedLabel}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={pipeline.status.label} tone={pipeline.status.tone} />
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
