'use client';

import Link from 'next/link';
import { useApprovalQueue, useExecutionQueue } from '../hooks/use-backtesting';
import type { QueueItemVm } from '../domain/view-model';
import {
  BacktestingEmpty,
  BacktestingError,
  BacktestingLoading,
  InfoCard,
  StatusBadge,
} from './backtesting-atoms';

function QueueList({
  items,
  emptyLabel,
  showProgress,
}: {
  items: readonly QueueItemVm[];
  emptyLabel: string;
  showProgress?: boolean;
}) {
  if (items.length === 0) return <BacktestingEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/backtesting/${item.id}`} className="font-medium hover:underline">
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

/** Backtest Queue — active runs (queued/running/paused). */
export function ExecutionQueue() {
  const { data, isLoading, isError, refetch } = useExecutionQueue();
  if (isLoading) return <BacktestingLoading rows={3} />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Execution queue">
      <QueueList items={data ?? []} emptyLabel="No active runs." showProgress />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Runs execute in the simulation runner — surfaced here, never run by this console.
      </p>
    </InfoCard>
  );
}

/** Backtest Approval Queue — backtests awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <BacktestingLoading rows={3} />;
  if (isError) return <BacktestingError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No backtests awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Combined queue view. */
export function BacktestQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ExecutionQueue />
      <ApprovalQueue />
    </div>
  );
}
