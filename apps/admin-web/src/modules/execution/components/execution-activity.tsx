'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useExecutionAudit,
  useExecutionRefs,
  useExecutionReplay,
  useExecutionTimeline,
} from '../hooks/use-execution';
import {
  ExecEmpty,
  ExecError,
  ExecLoading,
  InfoCard,
  StatusBadge,
  selectClass,
} from './execution-atoms';

/** Execution Timeline — every lifecycle event across all executions, newest first. */
export function ExecutionTimeline() {
  const { data, isLoading, isError, refetch } = useExecutionTimeline();
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Execution timeline"
      action={<span className="text-xs text-muted-foreground">{rows.length} events</span>}
    >
      {rows.length === 0 ? (
        <ExecEmpty label="No events." />
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.slice(0, 120).map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <StatusBadge label={event.type} tone={event.tone} />
                <Link
                  href={`/execution/${event.executionId}`}
                  className="font-mono text-xs underline-offset-2 hover:underline"
                >
                  {event.clientOrderId}
                </Link>
                <span className="text-muted-foreground">{event.symbol}</span>
                <span className="text-xs text-muted-foreground">{event.message}</span>
              </span>
              <span className="font-mono text-xs text-muted-foreground">{event.atLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Execution Audit — every audit entry across all executions, newest first. */
export function ExecutionAudit() {
  const { data, isLoading, isError, refetch } = useExecutionAudit();
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Execution audit"
      action={<span className="text-xs text-muted-foreground">{rows.length} entries</span>}
    >
      {rows.length === 0 ? (
        <ExecEmpty label="No audit entries." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Execution</th>
                <th className="px-3 py-1.5 text-left font-medium">Actor</th>
                <th className="px-3 py-1.5 text-left font-medium">Action</th>
                <th className="px-3 py-1.5 text-left font-medium">Detail</th>
                <th className="px-3 py-1.5 text-left font-medium">At</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-3 py-1 font-mono text-xs">
                    <Link
                      href={`/execution/${entry.executionId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {entry.clientOrderId}
                    </Link>
                  </td>
                  <td className="px-3 py-1">{entry.actor}</td>
                  <td className="px-3 py-1 text-muted-foreground">{entry.action}</td>
                  <td className="px-3 py-1 text-muted-foreground">{entry.detail}</td>
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {entry.atLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}

/** Execution Replay — event-sourced reconstruction of one execution's status timeline. */
export function ExecutionReplay() {
  const refs = useExecutionRefs();
  const [executionId, setExecutionId] = useState('EXE-0001');
  const replay = useExecutionReplay(executionId);
  return (
    <div className="space-y-4">
      <InfoCard title="Execution replay">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Execution</span>
          <select
            aria-label="Execution"
            value={executionId}
            onChange={(e) => setExecutionId(e.target.value)}
            className={`${selectClass} mt-1`}
          >
            {(refs.data ?? []).map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.clientOrderId} — {ref.symbol} ({ref.status.label})
              </option>
            ))}
          </select>
        </label>
      </InfoCard>
      {replay.isLoading ? (
        <ExecLoading />
      ) : replay.isError ? (
        <ExecError onRetry={() => replay.refetch()} />
      ) : replay.data ? (
        <InfoCard
          title={`Replay — ${replay.data.clientOrderId}`}
          action={
            <StatusBadge
              label={replay.data.consistent ? 'Consistent' : 'Inconsistent'}
              tone={replay.data.consistent ? 'positive' : 'danger'}
            />
          }
        >
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">#</th>
                  <th className="px-3 py-1.5 text-left font-medium">Event</th>
                  <th className="px-3 py-1.5 text-left font-medium">From → To</th>
                  <th className="px-3 py-1.5 text-left font-medium">Legal</th>
                  <th className="px-3 py-1.5 text-left font-medium">At</th>
                </tr>
              </thead>
              <tbody>
                {replay.data.steps.map((step) => (
                  <tr key={step.index} className="border-t">
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {step.index}
                    </td>
                    <td className="px-3 py-1">{step.type}</td>
                    <td className="px-3 py-1">
                      <StatusBadge label={step.from.label} tone={step.from.tone} />{' '}
                      <span className="text-muted-foreground">→</span>{' '}
                      <StatusBadge label={step.to.label} tone={step.to.tone} />
                    </td>
                    <td className="px-3 py-1">
                      <StatusBadge
                        label={step.legal ? 'legal' : 'illegal'}
                        tone={step.legal ? 'positive' : 'danger'}
                      />
                    </td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {step.atLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Reconstructed {replay.data.reconstructedStatus.label} vs recorded{' '}
            {replay.data.recordedStatus.label}.
          </p>
        </InfoCard>
      ) : (
        <ExecEmpty label="Select an execution to replay." />
      )}
    </div>
  );
}
