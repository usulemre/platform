'use client';

import Link from 'next/link';
import {
  useApprovalQueue,
  useExecutionQueue,
  useReviewQueue,
} from '../hooks/use-execution-simulator';
import type { QueueItemVm } from '../domain/view-model';
import {
  ExecutionEmpty,
  ExecutionError,
  ExecutionLoading,
  InfoCard,
  StatusBadge,
} from './execution-atoms';

function QueueList({
  items,
  emptyLabel,
  showProgress,
}: {
  items: readonly QueueItemVm[];
  emptyLabel: string;
  showProgress?: boolean;
}) {
  if (items.length === 0) return <ExecutionEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/execution-simulator/${item.id}`} className="font-medium hover:underline">
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

/** Execution queue — active simulation runs (queued/running/paused). */
export function ExecutionQueue() {
  const { data, isLoading, isError, refetch } = useExecutionQueue();
  if (isLoading) return <ExecutionLoading rows={3} />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Execution queue">
      <QueueList items={data ?? []} emptyLabel="No active runs." showProgress />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Runs execute in the simulator — surfaced here, never run by this console, never on a real
        venue.
      </p>
    </InfoCard>
  );
}

/** Simulation Review queue — sessions in a review stage. */
export function ReviewQueue() {
  const { data, isLoading, isError, refetch } = useReviewQueue();
  if (isLoading) return <ExecutionLoading rows={3} />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Review queue">
      <QueueList items={data ?? []} emptyLabel="No sessions in review." />
    </InfoCard>
  );
}

/** Simulation Approval queue — sessions awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <ExecutionLoading rows={3} />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No sessions awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Combined queue view. */
export function ExecutionQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ExecutionQueue />
      <ReviewQueue />
      <ApprovalQueue />
    </div>
  );
}
