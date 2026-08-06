'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { DEPLOYMENT_STAGES, describeStage } from '@platform/trading-sdk';
import { useDeployments } from '../hooks/use-live-trading';
import { useDeploymentQueryStore } from '../hooks/use-deployment-query-store';
import type { DeploymentStage } from '../domain/dto';
import type { DeploymentQuery, DeploymentSortField } from '../domain/query';
import type { DeploymentListItemVm } from '../domain/view-model';
import { TradingEmpty, TradingError, TradingLoading, StatusBadge } from './trading-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'crypto', 'multi-asset', 'fx'];
const STAGE_OPTIONS: readonly (DeploymentStage | 'ALL')[] = ['ALL', ...DEPLOYMENT_STAGES];
const SORT_OPTIONS: readonly { value: DeploymentSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/[_-]/g, ' ');
}

function DeploymentCard({ deployment }: { deployment: DeploymentListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/live-trading/${deployment.id}`} className="font-medium hover:underline">
            {deployment.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {deployment.namespace} / {deployment.family} · v{deployment.version}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge label={deployment.mode.label} tone={deployment.mode.tone} />
          <StatusBadge label={deployment.stage.label} tone={deployment.stage.tone} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{deployment.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Runtime: ${deployment.runtime.label}`}
          tone={deployment.runtime.tone}
        />
        <StatusBadge label={`Health: ${deployment.health.label}`} tone={deployment.health.tone} />
        <StatusBadge
          label={`Approval: ${deployment.approval.label}`}
          tone={deployment.approval.tone}
        />
        {deployment.killSwitch.value === 'ENGAGED' ? (
          <StatusBadge label="Kill switch: Engaged" tone="danger" />
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{deployment.owner}</span>
        <span>updated {deployment.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Strategy Deployment registry — search / filter / sort over the registry. */
export function DeploymentRegistry() {
  const search = useDeploymentQueryStore((state) => state.search);
  const namespace = useDeploymentQueryStore((state) => state.namespace);
  const stage = useDeploymentQueryStore((state) => state.stage);
  const sortBy = useDeploymentQueryStore((state) => state.sortBy);
  const sortDir = useDeploymentQueryStore((state) => state.sortDir);
  const setSearch = useDeploymentQueryStore((state) => state.setSearch);
  const setNamespace = useDeploymentQueryStore((state) => state.setNamespace);
  const setStage = useDeploymentQueryStore((state) => state.setStage);
  const setSort = useDeploymentQueryStore((state) => state.setSort);

  const query = useMemo<DeploymentQuery>(
    () => ({ search, namespace, stage, sortBy, sortDir }),
    [search, namespace, stage, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useDeployments(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search deployments"
          placeholder="Search deployments…"
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
          onChange={(event) => setStage(event.target.value as DeploymentStage | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as DeploymentSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TradingLoading />
      ) : isError ? (
        <TradingError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <TradingEmpty label="No deployments match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((deployment) => (
            <DeploymentCard key={deployment.id} deployment={deployment} />
          ))}
        </ul>
      )}
    </div>
  );
}
