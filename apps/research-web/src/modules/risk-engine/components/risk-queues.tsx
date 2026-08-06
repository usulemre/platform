'use client';

import Link from 'next/link';
import {
  useApprovalQueue,
  useExceptionQueue,
  useReviewQueue,
  useValidationQueue,
} from '../hooks/use-risk-engine';
import type { QueueItemVm } from '../domain/view-model';
import { RiskEmpty, RiskError, RiskLoading, InfoCard, StatusBadge } from './risk-engine-atoms';

function QueueList({ items, emptyLabel }: { items: readonly QueueItemVm[]; emptyLabel: string }) {
  if (items.length === 0) return <RiskEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/risk-engine/${item.id}`} className="font-medium hover:underline">
              {item.name}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {item.namespace} / {item.family} · {item.subjectName} · {item.stageLabel} ·{' '}
              {item.owner}
            </span>
          </span>
          <StatusBadge label={item.primaryStatus.label} tone={item.primaryStatus.tone} />
        </li>
      ))}
    </ul>
  );
}

/** Risk Validation Queue — assessments in policy/limit validation. */
export function ValidationQueue() {
  const { data, isLoading, isError, refetch } = useValidationQueue();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Validation queue">
      <QueueList items={data ?? []} emptyLabel="No assessments in validation." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Policy/limit validation is decided by deterministic engines — surfaced here, never decided
        by this console.
      </p>
    </InfoCard>
  );
}

/** Risk Review Queue — assessments in exposure/exception review. */
export function ReviewQueue() {
  const { data, isLoading, isError, refetch } = useReviewQueue();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Review queue">
      <QueueList items={data ?? []} emptyLabel="No assessments in review." />
    </InfoCard>
  );
}

/** Risk Approval Queue — assessments awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No assessments awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Risk Exceptions queue — assessments with open exceptions. */
export function ExceptionQueue() {
  const { data, isLoading, isError, refetch } = useExceptionQueue();
  if (isLoading) return <RiskLoading rows={3} />;
  if (isError) return <RiskError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Open exceptions">
      <QueueList items={data ?? []} emptyLabel="No open exceptions." />
    </InfoCard>
  );
}

/** Combined review + validation view (researcher-facing). */
export function RiskReviewQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ValidationQueue />
      <ReviewQueue />
      <ApprovalQueue />
      <ExceptionQueue />
    </div>
  );
}
