'use client';

import { useAccounts, usePositionSync, useBalanceSync, useOrderSync } from '../hooks/use-gateway';
import type { BalanceRowVm, OrderRowVm, PositionRowVm } from '../domain/view-model';
import { ChipBadge, InfoCard, StatCard, GatewayLoading } from './gateway-atoms';

function PositionsTable({ rows }: { rows: readonly PositionRowVm[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Side</th>
            <th className="px-3 py-1.5 text-right font-medium">Quantity</th>
            <th className="px-3 py-1.5 text-right font-medium">Avg price</th>
            <th className="px-3 py-1.5 text-left font-medium">Asset</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.symbol} className="border-t">
              <td className="px-3 py-1 font-medium">{p.symbol}</td>
              <td className="px-3 py-1">
                <ChipBadge chip={p.side} />
              </td>
              <td className="px-3 py-1 text-right font-mono">{p.quantity}</td>
              <td className="px-3 py-1 text-right font-mono">{p.averagePrice}</td>
              <td className="px-3 py-1 text-xs text-muted-foreground">{p.assetClass}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function BalancesTable({ rows }: { rows: readonly BalanceRowVm[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Currency</th>
            <th className="px-3 py-1.5 text-right font-medium">Total</th>
            <th className="px-3 py-1.5 text-right font-medium">Available</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.currency} className="border-t">
              <td className="px-3 py-1 font-medium">{b.currency}</td>
              <td className="px-3 py-1 text-right font-mono">{b.total}</td>
              <td className="px-3 py-1 text-right font-mono">{b.available}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function OrdersTable({ rows }: { rows: readonly OrderRowVm[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Broker order</th>
            <th className="px-3 py-1.5 text-left font-medium">Client order</th>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Status</th>
            <th className="px-3 py-1.5 text-right font-medium">Filled</th>
            <th className="px-3 py-1.5 text-right font-medium">Remaining</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.brokerOrderId} className="border-t">
              <td className="px-3 py-1 font-mono text-xs">{o.brokerOrderId}</td>
              <td className="px-3 py-1 font-mono text-xs">{o.clientOrderId}</td>
              <td className="px-3 py-1 font-medium">{o.symbol}</td>
              <td className="px-3 py-1 text-xs">{o.status}</td>
              <td className="px-3 py-1 text-right font-mono">{o.filled}</td>
              <td className="px-3 py-1 text-right font-mono">{o.remaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Account Manager — each broker's synchronized account: positions, balances and orders. */
export function AccountManager() {
  const { data, isLoading } = useAccounts();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      {data.map((account) => (
        <InfoCard
          key={account.brokerId}
          title={`${account.brokerName} · ${account.accountRef}`}
          action={
            <span className="text-xs text-muted-foreground">synced {account.syncedLabel}</span>
          }
        >
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Type" value={account.type} />
            <StatCard label="Gross exposure" value={account.grossExposure} />
            <StatCard label="Balance" value={account.totalBalance} />
            <StatCard label="Open orders" value={account.openOrders} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-medium">Positions</p>
              <PositionsTable rows={account.positions} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium">Balances</p>
              <BalancesTable rows={account.balances} />
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-sm font-medium">Orders</p>
            <OrdersTable rows={account.orders} />
          </div>
        </InfoCard>
      ))}
    </div>
  );
}

/** Position Synchronization — position snapshots and net/gross exposure per broker. */
export function PositionSynchronization() {
  const { data, isLoading } = usePositionSync();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.brokerId}
          title={`${row.brokerName} · ${row.accountRef}`}
          action={<span className="text-xs text-muted-foreground">synced {row.syncedLabel}</span>}
        >
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Long" value={row.longCount} tone="info" />
            <StatCard label="Short" value={row.shortCount} />
            <StatCard label="Gross" value={row.grossExposure} />
            <StatCard label="Net" value={row.netExposure} />
          </div>
          <PositionsTable rows={row.positions} />
        </InfoCard>
      ))}
    </div>
  );
}

/** Balance Synchronization — cash/asset balance snapshots per broker. */
export function BalanceSynchronization() {
  const { data, isLoading } = useBalanceSync();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.brokerId}
          title={`${row.brokerName} · ${row.accountRef}`}
          action={<span className="text-xs text-muted-foreground">synced {row.syncedLabel}</span>}
        >
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total" value={row.totalValue} />
            <StatCard label="Available" value={row.availableValue} />
            <StatCard label="Currencies" value={row.currencies} />
          </div>
          <BalancesTable rows={row.balances} />
        </InfoCard>
      ))}
    </div>
  );
}

/** Order Synchronization — the broker-side order snapshots reconciled with the OMS. */
export function OrderSynchronization() {
  const { data, isLoading } = useOrderSync();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.brokerId}
          title={`${row.brokerName} · ${row.accountRef}`}
          action={<span className="text-xs text-muted-foreground">synced {row.syncedLabel}</span>}
        >
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Orders" value={row.total} />
            <StatCard label="Open" value={row.open} tone="info" />
            <StatCard label="Filled" value={row.filled} tone="positive" />
          </div>
          <OrdersTable rows={row.orders} />
        </InfoCard>
      ))}
    </div>
  );
}
