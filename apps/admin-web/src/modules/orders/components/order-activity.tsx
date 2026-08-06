'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOrderAudit, useOrderRefs, useOrderReplay, useOrderTimeline } from '../hooks/use-orders';
import { InfoCard, OrdEmpty, OrdError, OrdLoading, StatusBadge, selectClass } from './orders-atoms';

/** Order Timeline — every lifecycle event across all orders, newest first. */
export function OrderTimeline() {
  const { data, isLoading, isError, refetch } = useOrderTimeline();
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Order timeline"
      action={<span className="text-xs text-muted-foreground">{rows.length} events</span>}
    >
      {rows.length === 0 ? (
        <OrdEmpty label="No events." />
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.slice(0, 100).map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span className="flex items-center gap-2">
                <StatusBadge label={event.type} tone={event.tone} />
                <Link
                  href={`/orders/${event.orderId}`}
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

/** Order Audit — every audit entry across all orders, newest first. */
export function OrderAudit() {
  const { data, isLoading, isError, refetch } = useOrderAudit();
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Order audit"
      action={<span className="text-xs text-muted-foreground">{rows.length} entries</span>}
    >
      {rows.length === 0 ? (
        <OrdEmpty label="No audit entries." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Order</th>
                <th className="px-3 py-1.5 text-left font-medium">Actor</th>
                <th className="px-3 py-1.5 text-left font-medium">Action</th>
                <th className="px-3 py-1.5 text-left font-medium">Detail</th>
                <th className="px-3 py-1.5 text-left font-medium">At</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="px-3 py-1 font-mono text-xs">
                    <Link
                      href={`/orders/${entry.orderId}`}
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

/** Order Replay — event-sourced reconstruction of one order's status timeline. */
export function OrderReplay() {
  const refs = useOrderRefs();
  const [orderId, setOrderId] = useState('ORD-0001');
  const replay = useOrderReplay(orderId);

  return (
    <div className="space-y-4">
      <InfoCard title="Order replay">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">Order</span>
          <select
            aria-label="Order"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
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
        <OrdLoading />
      ) : replay.isError ? (
        <OrdError onRetry={() => replay.refetch()} />
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
                  <th className="px-3 py-1.5 text-left font-medium">Actor</th>
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
                    <td className="px-3 py-1 text-muted-foreground">{step.actor}</td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {step.atLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            The status timeline is reconstructed by folding the order&rsquo;s status-bearing events
            and validated against the state machine — reconstructed{' '}
            {replay.data.reconstructedStatus.label} vs recorded {replay.data.recordedStatus.label}.
          </p>
        </InfoCard>
      ) : (
        <OrdEmpty label="Select an order to replay." />
      )}
    </div>
  );
}
