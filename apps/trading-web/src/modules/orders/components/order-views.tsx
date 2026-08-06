'use client';

import { useState } from 'react';
import type { OrderScope } from '../domain/query';
import type { OrderSide, OrderStatus, OrderType } from '@platform/order-sdk';
import { ORDER_STATUSES, ORDER_TYPES } from '@platform/order-sdk';
import { useOrders } from '../hooks/use-orders';
import { InfoCard, OrdError, OrdLoading, selectClass } from './orders-atoms';
import { OrderTable } from './order-table';

/** A scoped order list (Blotter / Active / Completed / Rejected / Cancelled). */
export function OrderBlotter({
  scope,
  title,
  emptyLabel,
}: {
  scope: OrderScope;
  title: string;
  emptyLabel: string;
}) {
  const { data, isLoading, isError, refetch } = useOrders({ scope });
  if (isLoading) return <OrdLoading />;
  if (isError) return <OrdError onRetry={() => refetch()} />;
  return (
    <InfoCard
      title={title}
      action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} orders</span>}
    >
      <OrderTable rows={data ?? []} emptyLabel={emptyLabel} />
    </InfoCard>
  );
}

/** Order Search — the full-filter blotter. */
export function OrderSearch() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [side, setSide] = useState<OrderSide | 'ALL'>('ALL');
  const [type, setType] = useState<OrderType | 'ALL'>('ALL');
  const { data, isLoading, isError, refetch } = useOrders({ text, status, side, type });

  return (
    <div className="space-y-4">
      <InfoCard title="Search orders">
        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Text</span>
            <input
              aria-label="Search text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="symbol, client id, strategy…"
              className={`${selectClass} mt-1 w-56`}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Status</span>
            <select
              aria-label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus | 'ALL')}
              className={`${selectClass} mt-1`}
            >
              <option value="ALL">All</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Side</span>
            <select
              aria-label="Side"
              value={side}
              onChange={(event) => setSide(event.target.value as OrderSide | 'ALL')}
              className={`${selectClass} mt-1`}
            >
              <option value="ALL">All</option>
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase text-muted-foreground">Type</span>
            <select
              aria-label="Type"
              value={type}
              onChange={(event) => setType(event.target.value as OrderType | 'ALL')}
              className={`${selectClass} mt-1`}
            >
              <option value="ALL">All</option>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </InfoCard>

      {isLoading ? (
        <OrdLoading />
      ) : isError ? (
        <OrdError onRetry={() => refetch()} />
      ) : (
        <InfoCard
          title="Results"
          action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} orders</span>}
        >
          <OrderTable rows={data ?? []} emptyLabel="No orders match the filters." />
        </InfoCard>
      )}
    </div>
  );
}
