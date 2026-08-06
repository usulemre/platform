'use client';

import Link from 'next/link';
import { useOrder } from '../hooks/use-orders';
import type { OrderDetailVm } from '../domain/view-model';
import { InfoCard, OrdError, OrdLoading, StatusBadge } from './orders-atoms';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-medium">{value}</p>
    </div>
  );
}

function DetailBody({ order }: { order: OrderDetailVm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{order.clientOrderId}</h2>
        <span className="text-muted-foreground">{order.symbol}</span>
        <StatusBadge label={order.side.label} tone={order.side.tone} />
        <StatusBadge label={order.status.label} tone={order.status.tone} />
        <StatusBadge label={order.mode.label} tone={order.mode.tone} />
        {order.suspended ? <StatusBadge label="Suspended" tone="warning" /> : null}
        <span className="text-xs text-muted-foreground">
          v{order.version} · {order.typeLabel} · {order.timeInForce} · updated {order.updatedLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Quantity" value={order.quantity} />
        <Field label="Filled" value={`${order.filled} (${order.fillPercentLabel})`} />
        <Field label="Remaining" value={order.remaining} />
        <Field label="Avg price" value={order.avgPrice} />
        <Field label="Limit" value={order.limitPrice} />
        <Field label="Stop" value={order.stopPrice} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Validation"
          action={<StatusBadge label={order.validation.label} tone={order.validation.tone} />}
        >
          <ul className="space-y-1 text-sm">
            {order.validationChecks.map((check) => (
              <li key={check.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <span className="font-medium">{check.label}</span>{' '}
                  <span className="text-xs text-muted-foreground">{check.detail}</span>
                </span>
                <StatusBadge label={check.status.label} tone={check.status.tone} />
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title="Permitted actions">
          <div className="flex flex-wrap gap-2">
            {order.actions.map((action) => (
              <StatusBadge
                key={action.action}
                label={action.label}
                tone={action.permitted ? 'positive' : 'neutral'}
              />
            ))}
          </div>
          <p role="note" className="mt-2 text-xs text-muted-foreground">
            Permitted actions are computed from the order status and suspension by the state
            machine. This console is read-only.
          </p>
        </InfoCard>
      </div>

      {order.route ? (
        <InfoCard title="Route">
          <div className="flex flex-wrap gap-6 text-sm">
            <span>
              Venue: <span className="font-medium">{order.route.venue}</span>
            </span>
            <span>Destination: {order.route.destination}</span>
            <span>
              Mode: <StatusBadge label={order.route.mode.label} tone={order.route.mode.tone} />
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {order.route.gatewayRef}
            </span>
            {order.route.routedLabel ? (
              <span className="text-xs text-muted-foreground">
                routed {order.route.routedLabel}
              </span>
            ) : null}
          </div>
        </InfoCard>
      ) : null}

      {order.fills.length > 0 ? (
        <InfoCard title="Fills">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                  <th className="px-3 py-1.5 text-right font-medium">Price</th>
                  <th className="px-3 py-1.5 text-left font-medium">Liquidity</th>
                  <th className="px-3 py-1.5 text-left font-medium">Venue</th>
                  <th className="px-3 py-1.5 text-left font-medium">At</th>
                </tr>
              </thead>
              <tbody>
                {order.fills.map((fill) => (
                  <tr key={fill.id} className="border-t">
                    <td className="px-3 py-1 text-right font-mono">{fill.quantity}</td>
                    <td className="px-3 py-1 text-right font-mono">{fill.price}</td>
                    <td className="px-3 py-1 text-muted-foreground">{fill.liquidity}</td>
                    <td className="px-3 py-1 text-muted-foreground">{fill.venue}</td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {fill.atLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>
      ) : null}

      {order.approvals.length > 0 ? (
        <InfoCard title="Approvals">
          <ul className="space-y-1 text-sm">
            {order.approvals.map((approval) => (
              <li
                key={approval.id}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span>
                  <span className="font-medium">{approval.role}</span>
                  {approval.decidedBy ? (
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      — {approval.decidedBy}
                      {approval.rationale ? ` · ${approval.rationale}` : ''}
                    </span>
                  ) : null}
                </span>
                <StatusBadge label={approval.status.label} tone={approval.status.tone} />
              </li>
            ))}
          </ul>
        </InfoCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Lifecycle timeline">
          <ul className="space-y-1 text-sm">
            {order.events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span className="flex items-center gap-2">
                  <StatusBadge label={event.type} tone={event.tone} />
                  <span className="text-xs text-muted-foreground">{event.message}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{event.atLabel}</span>
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard title="Audit trail">
          <ul className="space-y-1 text-sm">
            {order.audit.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 border-b py-1">
                <span>
                  <span className="font-medium">{entry.action}</span>{' '}
                  <span className="text-xs text-muted-foreground">
                    {entry.actor} · {entry.detail}
                  </span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{entry.atLabel}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <InfoCard title="Metadata">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {order.metadata.map((row) => (
            <div key={row.label} className="flex justify-between gap-2 border-b py-1">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        {order.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {order.tags.map((tag) => (
              <StatusBadge key={tag} label={tag} tone="neutral" />
            ))}
          </div>
        ) : null}
      </InfoCard>
    </div>
  );
}

/** Order detail — the full lifecycle view for a single order. */
export function OrderDetailView({ orderId }: { orderId: string }) {
  const { data, isLoading, isError, refetch } = useOrder(orderId);
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link href="/orders/blotter" className="text-sm underline-offset-2 hover:underline">
          Back to blotter
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Link
        href="/orders/blotter"
        className="text-sm text-muted-foreground underline-offset-2 hover:underline"
      >
        ← Blotter
      </Link>
      <DetailBody order={data} />
    </div>
  );
}
