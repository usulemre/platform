'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useFeatures } from '../hooks/use-feature-store';
import { useFeatureQueryStore } from '../hooks/use-feature-query-store';
import type { FeatureLifecycleStatus } from '../domain/dto';
import type { FeatureQuery, FeatureSortField } from '../domain/query';
import type { FeatureCatalogItemVm } from '../domain/view-model';
import {
  FeatureStoreEmpty,
  FeatureStoreError,
  FeatureStoreLoading,
  StatusBadge,
} from './feature-store-atoms';

const STATUS_OPTIONS: readonly (FeatureLifecycleStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'PROPOSED',
  'APPROVED',
  'DEPRECATED',
  'RETIRED',
];
const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'fx', 'commodity'];
const SORT_OPTIONS: readonly { value: FeatureSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

/** Feature Catalog card — one registered feature with its health/quality/sync state. */
function FeatureCard({ feature }: { feature: FeatureCatalogItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/feature-store/${feature.id}`} className="font-medium hover:underline">
            {feature.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {feature.namespace} / {feature.family} · v{feature.version}
          </p>
        </div>
        <StatusBadge label={feature.status.label} tone={feature.status.tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{feature.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Validation: ${feature.validation.label}`}
          tone={feature.validation.tone}
        />
        <StatusBadge label={`Quality: ${feature.quality.label}`} tone={feature.quality.tone} />
        <StatusBadge label={`Health: ${feature.health.label}`} tone={feature.health.tone} />
        <StatusBadge label={`Sync: ${feature.sync.label}`} tone={feature.sync.tone} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{feature.owner}</span>
        <span>
          {feature.usageLabel} · updated {feature.updatedLabel}
        </span>
      </div>
    </li>
  );
}

/** Feature Explorer + Catalog — search / filter / sort over the feature catalog. */
export function FeatureCatalog() {
  const search = useFeatureQueryStore((state) => state.search);
  const namespace = useFeatureQueryStore((state) => state.namespace);
  const status = useFeatureQueryStore((state) => state.status);
  const sortBy = useFeatureQueryStore((state) => state.sortBy);
  const sortDir = useFeatureQueryStore((state) => state.sortDir);
  const setSearch = useFeatureQueryStore((state) => state.setSearch);
  const setNamespace = useFeatureQueryStore((state) => state.setNamespace);
  const setStatus = useFeatureQueryStore((state) => state.setStatus);
  const setSort = useFeatureQueryStore((state) => state.setSort);

  const query = useMemo<FeatureQuery>(
    () => ({ search, namespace, status, sortBy, sortDir }),
    [search, namespace, status, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useFeatures(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search features"
          placeholder="Search features…"
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
          aria-label="Filter by status"
          className={selectClass}
          value={status}
          onChange={(event) => setStatus(event.target.value as FeatureLifecycleStatus | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as FeatureSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <FeatureStoreLoading />
      ) : isError ? (
        <FeatureStoreError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <FeatureStoreEmpty label="No features match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </ul>
      )}
    </div>
  );
}
