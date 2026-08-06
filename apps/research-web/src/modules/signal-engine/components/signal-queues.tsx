'use client';

import Link from 'next/link';
import { useApprovalQueue, usePromotionQueue } from '../hooks/use-signal-engine';
import type { QueueItemVm } from '../domain/view-model';
import {
  InfoCard,
  SignalEngineEmpty,
  SignalEngineError,
  SignalEngineLoading,
  StatusBadge,
} from './signal-engine-atoms';

function QueueList({ items, emptyLabel }: { items: readonly QueueItemVm[]; emptyLabel: string }) {
  if (items.length === 0) return <SignalEngineEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/signal-engine/${item.id}`} className="font-medium hover:underline">
              {item.name}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {item.namespace} / {item.family} · {item.stageLabel} · {item.owner}
            </span>
          </span>
          <StatusBadge label={item.primaryStatus.label} tone={item.primaryStatus.tone} />
        </li>
      ))}
    </ul>
  );
}

/** Signal Promotion Queue — signals queued/eligible for promotion. */
export function PromotionQueue() {
  const { data, isLoading, isError, refetch } = usePromotionQueue();
  if (isLoading) return <SignalEngineLoading rows={3} />;
  if (isError) return <SignalEngineError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Promotion queue">
      <QueueList items={data ?? []} emptyLabel="No signals awaiting promotion." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Promotion to a production candidate is a governed decision — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Signal Approval Queue — signals awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <SignalEngineLoading rows={3} />;
  if (isError) return <SignalEngineError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No signals awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Combined queues view. */
export function SignalQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PromotionQueue />
      <ApprovalQueue />
    </div>
  );
}
