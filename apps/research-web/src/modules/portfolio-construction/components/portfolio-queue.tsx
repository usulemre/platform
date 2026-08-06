'use client';

import Link from 'next/link';
import { useApprovalQueue, useOptimizationQueue } from '../hooks/use-portfolio-construction';
import type { QueueItemVm } from '../domain/view-model';
import {
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  InfoCard,
  StatusBadge,
} from './portfolio-construction-atoms';

function QueueList({
  items,
  emptyLabel,
  showProgress,
}: {
  items: readonly QueueItemVm[];
  emptyLabel: string;
  showProgress?: boolean;
}) {
  if (items.length === 0) return <PortfolioConstructionEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link
              href={`/portfolio-construction/${item.id}`}
              className="font-medium hover:underline"
            >
              {item.name}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {item.namespace} / {item.family} · {item.stageLabel} · {item.owner}
              {showProgress ? ` · ${item.progressPercent}%` : ''}
            </span>
          </span>
          <StatusBadge label={item.primaryStatus.label} tone={item.primaryStatus.tone} />
        </li>
      ))}
    </ul>
  );
}

/** Portfolio optimization queue — portfolios with an active optimization request. */
export function OptimizationQueueView() {
  const { data, isLoading, isError, refetch } = useOptimizationQueue();
  if (isLoading) return <PortfolioConstructionLoading rows={3} />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Optimization queue">
      <QueueList items={data ?? []} emptyLabel="No active optimization requests." showProgress />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Optimization runs in the external optimizer — surfaced here, never run by this console.
      </p>
    </InfoCard>
  );
}

/** Portfolio Approval Queue — portfolios awaiting a governance approval decision. */
export function ApprovalQueueView() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <PortfolioConstructionLoading rows={3} />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No portfolios awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Combined queue view (optimization + approval). */
export function PortfolioQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OptimizationQueueView />
      <ApprovalQueueView />
    </div>
  );
}
