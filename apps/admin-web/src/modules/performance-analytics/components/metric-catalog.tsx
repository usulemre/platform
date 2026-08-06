'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { useMetricCatalog, useMetricDefinition } from '../hooks/use-performance';
import {
  InfoCard,
  PerformanceEmpty,
  PerformanceError,
  PerformanceLoading,
  StatusBadge,
} from './performance-atoms';

/** Metric Catalog + Metric Explorer — the canonical metric definitions grouped by category. */
export function MetricCatalog() {
  const { data, isLoading, isError, refetch } = useMetricCatalog();
  const [search, setSearch] = useState('');
  if (isLoading) return <PerformanceLoading />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <PerformanceEmpty label="No metric definitions." />;

  const needle = search.trim().toLowerCase();
  const groups = data
    .map((group) => ({
      ...group,
      definitions: group.definitions.filter(
        (d) => !needle || `${d.label} ${d.key} ${d.description}`.toLowerCase().includes(needle),
      ),
    }))
    .filter((group) => group.definitions.length > 0);

  return (
    <div className="space-y-4">
      <Input
        aria-label="Search metrics"
        placeholder="Search metric definitions…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="sm:max-w-xs"
      />
      {groups.length === 0 ? (
        <PerformanceEmpty label="No metrics match your search." />
      ) : (
        groups.map((group) => (
          <InfoCard
            key={group.category}
            title={group.label}
            action={<span className="text-xs text-muted-foreground">{group.description}</span>}
          >
            <ul className="space-y-1 text-sm">
              {group.definitions.map((definition) => (
                <li
                  key={definition.key}
                  className="flex items-start justify-between gap-4 border-b py-1.5"
                >
                  <span>
                    <Link
                      href={`/performance-analytics/catalog/${definition.key}`}
                      className="font-medium hover:underline"
                    >
                      {definition.label}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {definition.unit} · v{definition.version}
                    </span>
                    <p className="text-xs text-muted-foreground">{definition.description}</p>
                  </span>
                  <StatusBadge
                    label={definition.higherIsBetter ? 'higher better' : 'lower better'}
                    tone={definition.higherIsBetter ? 'positive' : 'neutral'}
                  />
                </li>
              ))}
            </ul>
          </InfoCard>
        ))
      )}
      <p role="note" className="text-xs text-muted-foreground">
        Definitions only — the formula description is prose; no metric is computed by this console.
      </p>
    </div>
  );
}

/** Metric Explorer — a single metric definition. */
export function MetricExplorer({ metricKey }: { metricKey: string }) {
  const { data, isLoading, isError, refetch } = useMetricDefinition(metricKey);
  if (isLoading) return <PerformanceLoading />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  if (!data) return <PerformanceEmpty label="No metric matches this key." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/performance-analytics/catalog" className="text-sm hover:underline">
          ← Catalog
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{data.label}</h1>
        <StatusBadge label={data.categoryLabel} tone="info" />
        <StatusBadge label={`v${data.version}`} tone="neutral" />
      </div>
      <InfoCard title="Definition">
        <div className="space-y-2 text-sm">
          <p>{data.description}</p>
          <p className="text-xs uppercase text-muted-foreground">Definition (prose, never code)</p>
          <p className="text-muted-foreground">{data.formulaDescription}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusBadge label={`unit: ${data.unit}`} tone="neutral" />
            <StatusBadge label={`key: ${data.key}`} tone="neutral" />
            <StatusBadge
              label={data.higherIsBetter ? 'higher is better' : 'lower is better'}
              tone={data.higherIsBetter ? 'positive' : 'neutral'}
            />
          </div>
          <p role="note" className="text-xs text-muted-foreground">
            This is a canonical definition; the value is computed by the analytics runtime, never
            here.
          </p>
        </div>
      </InfoCard>
    </div>
  );
}
