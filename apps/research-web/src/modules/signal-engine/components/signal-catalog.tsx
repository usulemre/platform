'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { SIGNAL_STAGES, describeStage } from '@platform/signal-sdk';
import { useSignals } from '../hooks/use-signal-engine';
import { useSignalQueryStore } from '../hooks/use-signal-query-store';
import type { SignalStage } from '../domain/dto';
import type { SignalQuery, SignalSortField } from '../domain/query';
import type { SignalCatalogItemVm } from '../domain/view-model';
import {
  SignalEngineEmpty,
  SignalEngineError,
  SignalEngineLoading,
  StatusBadge,
} from './signal-engine-atoms';

const NAMESPACE_OPTIONS: readonly string[] = [
  'ALL',
  'equities',
  'fx',
  'rates',
  'credit',
  'commodity',
];
const STAGE_OPTIONS: readonly (SignalStage | 'ALL')[] = ['ALL', ...SIGNAL_STAGES];
const SORT_OPTIONS: readonly { value: SignalSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Signal Catalog card — one registered signal with its lifecycle/quality state. */
function SignalCard({ signal }: { signal: SignalCatalogItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/signal-engine/${signal.id}`} className="font-medium hover:underline">
            {signal.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {signal.namespace} / {signal.family} · v{signal.version}
          </p>
        </div>
        <StatusBadge label={signal.stage.label} tone={signal.stage.tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{signal.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Validation: ${signal.validation.label}`}
          tone={signal.validation.tone}
        />
        <StatusBadge label={`Approval: ${signal.approval.label}`} tone={signal.approval.tone} />
        <StatusBadge label={`Promotion: ${signal.promotion.label}`} tone={signal.promotion.tone} />
        <StatusBadge label={`Quality: ${signal.quality.label}`} tone={signal.quality.tone} />
        <StatusBadge label={`Health: ${signal.health.label}`} tone={signal.health.tone} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{signal.owner}</span>
        <span>updated {signal.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Signal Registry Explorer + Catalog — search / filter / sort over the catalog. */
export function SignalCatalog() {
  const search = useSignalQueryStore((state) => state.search);
  const namespace = useSignalQueryStore((state) => state.namespace);
  const stage = useSignalQueryStore((state) => state.stage);
  const sortBy = useSignalQueryStore((state) => state.sortBy);
  const sortDir = useSignalQueryStore((state) => state.sortDir);
  const setSearch = useSignalQueryStore((state) => state.setSearch);
  const setNamespace = useSignalQueryStore((state) => state.setNamespace);
  const setStage = useSignalQueryStore((state) => state.setStage);
  const setSort = useSignalQueryStore((state) => state.setSort);

  const query = useMemo<SignalQuery>(
    () => ({ search, namespace, stage, sortBy, sortDir }),
    [search, namespace, stage, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useSignals(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search signals"
          placeholder="Search signals…"
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
          onChange={(event) => setStage(event.target.value as SignalStage | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as SignalSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <SignalEngineLoading />
      ) : isError ? (
        <SignalEngineError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <SignalEngineEmpty label="No signals match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </ul>
      )}
    </div>
  );
}
