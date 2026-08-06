'use client';

import Link from 'next/link';
import {
  useAccounts,
  useApprovalQueue,
  useAudit,
  useBalances,
  useClosedPositions,
  useConnections,
  useEmergencyControls,
  useHealthOverview,
  useHistory,
  useMetricsOverview,
  useOpenPositions,
  useOrders,
  useProviders,
  useRunningStrategies,
  useTimeline,
} from '../hooks/use-live-trading';
import type { QueueItemVm } from '../domain/view-model';
import { ControlChips, OrderTable, PositionTable } from './panels';
import { InfoCard, StatusBadge, TradingEmpty, TradingError, TradingLoading } from './trading-atoms';

function QueueList({ items, emptyLabel }: { items: readonly QueueItemVm[]; emptyLabel: string }) {
  if (items.length === 0) return <TradingEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
        >
          <span className="min-w-0">
            <Link href={`/live-trading/${item.id}`} className="font-medium hover:underline">
              {item.name}
            </Link>
            <span className="ml-2 text-xs text-muted-foreground">
              {item.namespace} / {item.family} · {item.stageLabel} · {item.owner}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <StatusBadge label={item.mode.label} tone={item.mode.tone} />
            <StatusBadge label={item.primaryStatus.label} tone={item.primaryStatus.tone} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Running Strategies — deployments with an active runtime. */
export function RunningStrategies() {
  const { data, isLoading, isError, refetch } = useRunningStrategies();
  if (isLoading) return <TradingLoading rows={3} />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Running strategies">
      <QueueList items={data ?? []} emptyLabel="No running strategies." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Deployments run through the broker gateway abstraction — surfaced here, never executed by
        this console.
      </p>
    </InfoCard>
  );
}

/** Production Orders — every order across the registry. */
export function ProductionOrders() {
  const { data, isLoading, isError, refetch } = useOrders();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No production orders." />;
  return (
    <InfoCard title="Production orders">
      <OrderTable orders={data} />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Order states are orchestrated through the broker gateway abstraction — never transmitted by
        this console.
      </p>
    </InfoCard>
  );
}

/** Open Positions across the registry. */
export function OpenPositions() {
  const { data, isLoading, isError, refetch } = useOpenPositions();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No open positions." />;
  return (
    <InfoCard title="Open positions">
      <PositionTable positions={data} />
    </InfoCard>
  );
}

/** Closed Positions across the registry. */
export function ClosedPositions() {
  const { data, isLoading, isError, refetch } = useClosedPositions();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No closed positions." />;
  return (
    <InfoCard title="Closed positions">
      <PositionTable positions={data} />
    </InfoCard>
  );
}

/** Account Balances across the registry. */
export function AccountBalances() {
  const { data, isLoading, isError, refetch } = useBalances();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No balances." />;
  return (
    <InfoCard title="Account balances">
      <ul className="space-y-1 text-sm">
        {data.map((balance) => (
          <li
            key={`${balance.deploymentId}-${balance.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5"
          >
            <span>
              <span className="font-medium">{balance.asset}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                <Link href={`/live-trading/${balance.deploymentId}`} className="hover:underline">
                  {balance.deploymentName}
                </Link>{' '}
                · {balance.accountId}
              </span>
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              total {balance.total} · avail {balance.available} · reserved {balance.reserved}
            </span>
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}

/** Portfolio Overview — open positions + balances across the registry. */
export function PortfolioOverview() {
  return (
    <div className="space-y-6">
      <OpenPositions />
      <AccountBalances />
    </div>
  );
}

/** Deployment History — stopped / archived deployments. */
export function DeploymentHistory() {
  const { data, isLoading, isError, refetch } = useHistory();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Deployment history">
      <QueueList items={data ?? []} emptyLabel="No stopped or archived deployments." />
    </InfoCard>
  );
}

/** Trading Accounts. */
export function TradingAccounts() {
  const { data, isLoading, isError, refetch } = useAccounts();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No accounts." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((account) => (
        <InfoCard
          key={account.id}
          title={account.name}
          action={<StatusBadge label={account.status.label} tone={account.status.tone} />}
        >
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              {account.brokerKind} · {account.provider} · {account.baseCurrency}
            </p>
            <StatusBadge label={`Mode: ${account.mode.label}`} tone={account.mode.tone} />
          </div>
        </InfoCard>
      ))}
    </div>
  );
}

/** Exchange / Broker Connections (abstractions only) + provider placeholders. */
export function ExchangeConnections() {
  const connections = useConnections();
  const providers = useProviders();
  if (connections.isLoading || providers.isLoading) return <TradingLoading />;
  if (connections.isError) return <TradingError onRetry={() => connections.refetch()} />;
  return (
    <div className="space-y-6">
      <InfoCard title="Connections">
        {!connections.data || connections.data.length === 0 ? (
          <TradingEmpty label="No connections." />
        ) : (
          <ul className="space-y-1 text-sm">
            {connections.data.map((connection) => (
              <li
                key={connection.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b py-1.5"
              >
                <span>
                  <span className="font-medium">{connection.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {connection.provider} · {connection.brokerKind} · {connection.credentialRef}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusBadge label={connection.mode.label} tone={connection.mode.tone} />
                  <StatusBadge label={connection.status.label} tone={connection.status.tone} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <p role="note" className="mt-3 text-xs text-muted-foreground">
          Connections are abstractions; credentials are opaque references resolved by the secrets
          broker — never held here.
        </p>
      </InfoCard>
      <InfoCard title="Supported providers (placeholders)">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(providers.data ?? []).map((provider) => (
            <div key={provider.id} className="rounded-md border p-2 text-sm">
              <p className="font-medium">{provider.name}</p>
              <p className="text-xs text-muted-foreground">{provider.kind}</p>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
          ))}
        </div>
        <p role="note" className="mt-3 text-xs text-muted-foreground">
          Provider connectors are abstractions/placeholders only; actual exchange implementations
          belong to future infrastructure packages.
        </p>
      </InfoCard>
    </div>
  );
}

/** Deployment Approval queue. */
export function ApprovalQueue() {
  const { data, isLoading, isError, refetch } = useApprovalQueue();
  if (isLoading) return <TradingLoading rows={3} />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  return (
    <InfoCard title="Deployment approval queue">
      <QueueList items={data ?? []} emptyLabel="No deployments awaiting approval." />
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Risk and deployment approvals are governance decisions by accountable humans — surfaced
        here, never made by this console.
      </p>
    </InfoCard>
  );
}

/** Production Health overview. */
export function ProductionHealth() {
  const { data, isLoading, isError, refetch } = useHealthOverview();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No health data." />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.deploymentId}
          title={row.deploymentName}
          action={<StatusBadge label={row.status.label} tone={row.status.tone} />}
        >
          <p className="mb-2 text-xs uppercase text-muted-foreground">
            {row.namespace}
            {row.checkedLabel ? ` · checked ${row.checkedLabel}` : ''}
          </p>
          {row.checks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checks.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {row.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-center justify-between gap-4 border-b py-1"
                >
                  <span>
                    <span className="font-medium">{check.label}</span>{' '}
                    <span className="text-xs text-muted-foreground">{check.detail}</span>
                  </span>
                  <StatusBadge label={check.status.label} tone={check.status.tone} />
                </li>
              ))}
            </ul>
          )}
        </InfoCard>
      ))}
    </div>
  );
}

/** Trading Metrics — reported indicators per running deployment. */
export function TradingMetrics() {
  const { data, isLoading, isError, refetch } = useMetricsOverview();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No running deployments." />;
  return (
    <div className="space-y-4">
      {data.map((row) => (
        <InfoCard
          key={row.deploymentId}
          title={row.deploymentName}
          action={<StatusBadge label={row.mode.label} tone={row.mode.tone} />}
        >
          <p className="mb-2 text-xs uppercase text-muted-foreground">{row.namespace}</p>
          {row.metrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No metrics.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {row.metrics.map((metric) => (
                <div key={metric.key} className="rounded-md border p-2">
                  <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-semibold">{metric.value}</p>
                </div>
              ))}
            </div>
          )}
        </InfoCard>
      ))}
      <p role="note" className="text-xs text-muted-foreground">
        Metrics (incl. PnL) are reported by upstream systems — never computed by this console.
      </p>
    </div>
  );
}

/** Trading Timeline across the registry. */
export function TradingTimeline() {
  const { data, isLoading, isError, refetch } = useTimeline();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No timeline events." />;
  return (
    <InfoCard title="Trading timeline">
      <ol className="space-y-2 text-sm">
        {data.map((event) => (
          <li key={`${event.deploymentId}-${event.id}`} className="border-b py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <StatusBadge label={event.kind} tone="neutral" />
                <span className="font-medium">{event.label}</span>
              </span>
              <span className="text-xs text-muted-foreground">{event.atLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {event.detail} ·{' '}
              <Link href={`/live-trading/${event.deploymentId}`} className="hover:underline">
                {event.deploymentName}
              </Link>
            </p>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

/** Trading Audit across the registry. */
export function TradingAudit() {
  const { data, isLoading, isError, refetch } = useAudit();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No audit entries." />;
  return (
    <InfoCard title="Trading audit">
      <ol className="space-y-2 text-sm">
        {data.map((entry) => (
          <li key={`${entry.deploymentId}-${entry.id}`} className="border-b py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <StatusBadge label={entry.kind} tone="neutral" />
                <span className="font-medium">{entry.action}</span>
              </span>
              <span className="text-xs text-muted-foreground">{entry.occurredLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.actor} · {entry.detail} ·{' '}
              <Link href={`/live-trading/${entry.deploymentId}`} className="hover:underline">
                {entry.deploymentName}
              </Link>
            </p>
          </li>
        ))}
      </ol>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        The audit trail is tamper-evident and append-only — recorded by the Audit Center.
      </p>
    </InfoCard>
  );
}

/** Emergency Controls & Kill Switch — the always-available human authority per deployment. */
export function EmergencyControls() {
  const { data, isLoading, isError, refetch } = useEmergencyControls();
  if (isLoading) return <TradingLoading />;
  if (isError) return <TradingError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <TradingEmpty label="No active deployments." />;
  return (
    <div className="space-y-3">
      <div
        role="note"
        className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-muted-foreground"
      >
        Emergency stop and the kill switch are always available to authorized humans and are never
        gated by AI (HO-4). This console surfaces availability and history; the action is executed
        by the broker gateway on human authority.
      </div>
      {data.map((row) => (
        <InfoCard
          key={row.deploymentId}
          title={row.deploymentName}
          action={
            <StatusBadge
              label={`Kill switch: ${row.killSwitch.label}`}
              tone={row.killSwitch.tone}
            />
          }
        >
          <div className="space-y-2 text-sm">
            <p className="text-xs uppercase text-muted-foreground">{row.namespace}</p>
            <div className="flex items-center gap-1.5">
              <StatusBadge label={`Runtime: ${row.runtime.label}`} tone={row.runtime.tone} />
              <StatusBadge label={`Mode: ${row.mode.label}`} tone={row.mode.tone} />
            </div>
            <ControlChips controls={row.controls} />
            <Link href={`/live-trading/${row.deploymentId}`} className="text-xs hover:underline">
              Open deployment
            </Link>
          </div>
        </InfoCard>
      ))}
    </div>
  );
}
