'use client';

import Link from 'next/link';
import type { SubjectKind } from '../domain/dto';
import {
  useApprovalQueue,
  useBenchmarks,
  useReviewQueue,
  useSubjectReports,
} from '../hooks/use-performance';
import type { QueueItemVm } from '../domain/view-model';
import {
  InfoCard,
  PerformanceEmpty,
  PerformanceError,
  PerformanceLoading,
  StatusBadge,
} from './performance-atoms';

function QueueList({ items, emptyLabel }: { items: readonly QueueItemVm[]; emptyLabel: string }) {
  if (items.length === 0) return <PerformanceEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link
              href={`/performance-analytics/${item.id}`}
              className="font-medium hover:underline"
            >
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

const SUBJECT_TITLE: Record<SubjectKind, string> = {
  STRATEGY: 'Strategy performance',
  PORTFOLIO: 'Portfolio performance',
  BACKTEST: 'Backtest performance',
  LIVE_SESSION: 'Live trading performance',
  SIMULATION: 'Simulation performance',
};

/** Subject-filtered performance reports (strategy / portfolio / backtest / live). */
export function SubjectReports({ subjectKind }: { subjectKind: SubjectKind }) {
  const { data, isLoading, isError, refetch } = useSubjectReports(subjectKind);
  if (isLoading) return <PerformanceLoading />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  return (
    <InfoCard title={SUBJECT_TITLE[subjectKind]}>
      <QueueList items={data ?? []} emptyLabel="No reports for this subject." />
    </InfoCard>
  );
}

/** Performance Review queue — reports in a review stage. */
export function ReviewQueue() {
  const { data, isLoading, isError, refetch } = useReviewQueue();
  if (isLoading) return <PerformanceLoading rows={3} />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Review queue">
      <QueueList items={data ?? []} emptyLabel="No reports in review." />
    </InfoCard>
  );
}

/** Performance Approval queue — reports awaiting a governance approval decision. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <PerformanceLoading rows={3} />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Approval queue">
      <QueueList items={data ?? []} emptyLabel="No reports awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Approval is a governance decision made by accountable humans — surfaced here, never made by
        this console.
      </p>
    </InfoCard>
  );
}

/** Combined review + approval queues. */
export function PerformanceReviewQueues() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ReviewQueue />
      <ApprovalQueue />
    </div>
  );
}

/** Benchmark registry. */
export function BenchmarkList() {
  const { data, isLoading, isError, refetch } = useBenchmarks();
  if (isLoading) return <PerformanceLoading />;
  if (isError) return <PerformanceError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <PerformanceEmpty label="No benchmarks." />;
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data.map((benchmark) => (
        <InfoCard
          key={benchmark.id}
          title={benchmark.name}
          action={<StatusBadge label={benchmark.kind} tone="info" />}
        >
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">{benchmark.description}</p>
            <span className="font-mono text-[11px] text-muted-foreground">{benchmark.ref}</span>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
