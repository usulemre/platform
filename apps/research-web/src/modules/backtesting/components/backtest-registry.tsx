'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { BACKTEST_STAGES, describeStage } from '@platform/backtesting-sdk';
import { useBacktests } from '../hooks/use-backtesting';
import { useBacktestQueryStore } from '../hooks/use-backtest-query-store';
import type { BacktestStage, ScenarioKind } from '../domain/dto';
import type { BacktestQuery, BacktestSortField } from '../domain/query';
import type { BacktestListItemVm } from '../domain/view-model';
import {
  BacktestingEmpty,
  BacktestingError,
  BacktestingLoading,
  StatusBadge,
} from './backtesting-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'fx', 'rates', 'credit'];
const STAGE_OPTIONS: readonly (BacktestStage | 'ALL')[] = ['ALL', ...BACKTEST_STAGES];
const SCENARIO_OPTIONS: readonly { value: ScenarioKind | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All scenarios' },
  { value: 'HISTORICAL', label: 'Historical' },
  { value: 'WALK_FORWARD', label: 'Walk-forward' },
  { value: 'ROLLING_WINDOW', label: 'Rolling window' },
];
const SORT_OPTIONS: readonly { value: BacktestSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

function BacktestCard({ backtest }: { backtest: BacktestListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/backtesting/${backtest.id}`} className="font-medium hover:underline">
            {backtest.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {backtest.namespace} / {backtest.family} · {backtest.scenario} · v{backtest.version}
          </p>
        </div>
        <StatusBadge label={backtest.stage.label} tone={backtest.stage.tone} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{backtest.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge label={`Run: ${backtest.run.label}`} tone={backtest.run.tone} />
        <StatusBadge
          label={`Validation: ${backtest.validation.label}`}
          tone={backtest.validation.tone}
        />
        <StatusBadge label={`Approval: ${backtest.approval.label}`} tone={backtest.approval.tone} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{backtest.owner}</span>
        <span>updated {backtest.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Backtest Registry Explorer — search / filter / sort over the registry. */
export function BacktestRegistry() {
  const search = useBacktestQueryStore((state) => state.search);
  const namespace = useBacktestQueryStore((state) => state.namespace);
  const stage = useBacktestQueryStore((state) => state.stage);
  const scenario = useBacktestQueryStore((state) => state.scenario);
  const sortBy = useBacktestQueryStore((state) => state.sortBy);
  const sortDir = useBacktestQueryStore((state) => state.sortDir);
  const setSearch = useBacktestQueryStore((state) => state.setSearch);
  const setNamespace = useBacktestQueryStore((state) => state.setNamespace);
  const setStage = useBacktestQueryStore((state) => state.setStage);
  const setScenario = useBacktestQueryStore((state) => state.setScenario);
  const setSort = useBacktestQueryStore((state) => state.setSort);

  const query = useMemo<BacktestQuery>(
    () => ({ search, namespace, stage, scenario, sortBy, sortDir }),
    [search, namespace, stage, scenario, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useBacktests(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search backtests"
          placeholder="Search backtests…"
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
          onChange={(event) => setStage(event.target.value as BacktestStage | 'ALL')}
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All stages' : describeStage(option).label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by scenario"
          className={selectClass}
          value={scenario}
          onChange={(event) => setScenario(event.target.value as ScenarioKind | 'ALL')}
        >
          {SCENARIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as BacktestSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <BacktestingLoading />
      ) : isError ? (
        <BacktestingError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <BacktestingEmpty label="No backtests match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((backtest) => (
            <BacktestCard key={backtest.id} backtest={backtest} />
          ))}
        </ul>
      )}
    </div>
  );
}
