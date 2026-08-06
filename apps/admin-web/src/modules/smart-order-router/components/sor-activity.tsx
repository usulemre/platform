'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSorAudit, useSorRefs, useSorReplay, useSorTimeline } from '../hooks/use-sor';
import { InfoCard, SorEmpty, SorError, SorLoading, StatusBadge, selectClass } from './sor-atoms';

/** Routing Timeline — every lifecycle event across all routings, newest first. */
export function RoutingTimeline() {
  const { data, isLoading, isError, refetch } = useSorTimeline();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Routing timeline"
      action={<span className="text-xs text-muted-foreground">{rows.length} events</span>}
    >
      {rows.length === 0 ? (
        <SorEmpty label="No events." />
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.slice(0, 120).map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <StatusBadge label={event.type} tone={event.tone} />
                <Link
                  href={`/smart-order-router/${event.routingId}`}
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

/** Routing Audit — every audit entry across all routings, newest first. */
export function RoutingAudit() {
  const { data, isLoading, isError, refetch } = useSorAudit();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Routing audit"
      action={<span className="text-xs text-muted-foreground">{rows.length} entries</span>}
    >
      {rows.length === 0 ? (
        <SorEmpty label="No audit entries." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Routing</th>
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
                      href={`/smart-order-router/${entry.routingId}`}
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

/** Routing Replay — event-sourced reconstruction of one routing's status timeline. */
export function RoutingReplay() {
  const refs = useSorRefs();
  const [routingId, setRoutingId] = useState('ROU-0001');
  const replay = useSorReplay(routingId);
  return (
    <div className="space-y-4">
      <InfoCard title="Routing replay">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Routing</span>
          <select
            aria-label="Routing"
            value={routingId}
            onChange={(e) => setRoutingId(e.target.value)}
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
        <SorLoading />
      ) : replay.isError ? (
        <SorError onRetry={() => replay.refetch()} />
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
        <SorEmpty label="Select a routing to replay." />
      )}
    </div>
  );
}
