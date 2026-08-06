'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { PORTFOLIO_STAGES, describeStage } from '@platform/portfolio-sdk';
import { usePortfolios } from '../hooks/use-portfolio-construction';
import { usePortfolioQueryStore } from '../hooks/use-portfolio-query-store';
import type { PortfolioStage } from '../domain/dto';
import type { PortfolioQuery, PortfolioSortField } from '../domain/query';
import type { PortfolioListItemVm } from '../domain/view-model';
import {
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  StatusBadge,
} from './portfolio-construction-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'multi-asset', 'credit', 'fx'];
const STAGE_OPTIONS: readonly (PortfolioStage | 'ALL')[] = ['ALL', ...PORTFOLIO_STAGES];
const SORT_OPTIONS: readonly { value: PortfolioSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/[_-]/g, ' ');
}

function PortfolioCard({ portfolio }: { portfolio: PortfolioListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/portfolio-construction/${portfolio.id}`}
            className="font-medium hover:underline"
          >
            {portfolio.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {portfolio.namespace} / {portfolio.family} · {portfolio.allocationModel} · v
            {portfolio.version}
          </p>
        </div>
        <StatusBadge label={portfolio.stage.label} tone={portfolio.stage.tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{portfolio.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Optimization: ${portfolio.optimization.label}`}
          tone={portfolio.optimization.tone}
        />
        <StatusBadge
          label={`Validation: ${portfolio.validation.label}`}
          tone={portfolio.validation.tone}
        />
        <StatusBadge
          label={`Approval: ${portfolio.approval.label}`}
          tone={portfolio.approval.tone}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{portfolio.owner}</span>
        <span>updated {portfolio.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Portfolio Registry Explorer — search / filter / sort over the registry. */
export function PortfolioRegistry() {
  const search = usePortfolioQueryStore((state) => state.search);
  const namespace = usePortfolioQueryStore((state) => state.namespace);
  const stage = usePortfolioQueryStore((state) => state.stage);
  const sortBy = usePortfolioQueryStore((state) => state.sortBy);
  const sortDir = usePortfolioQueryStore((state) => state.sortDir);
  const setSearch = usePortfolioQueryStore((state) => state.setSearch);
  const setNamespace = usePortfolioQueryStore((state) => state.setNamespace);
  const setStage = usePortfolioQueryStore((state) => state.setStage);
  const setSort = usePortfolioQueryStore((state) => state.setSort);

  const query = useMemo<PortfolioQuery>(
    () => ({ search, namespace, stage, sortBy, sortDir }),
    [search, namespace, stage, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = usePortfolios(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search portfolios"
          placeholder="Search portfolios…"
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
          onChange={(event) => setStage(event.target.value as PortfolioStage | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as PortfolioSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PortfolioConstructionLoading />
      ) : isError ? (
        <PortfolioConstructionError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <PortfolioConstructionEmpty label="No portfolios match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((portfolio) => (
            <PortfolioCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </ul>
      )}
    </div>
  );
}
