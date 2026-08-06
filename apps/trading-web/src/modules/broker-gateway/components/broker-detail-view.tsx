'use client';

import Link from 'next/link';
import { useBrokerDetail } from '../hooks/use-gateway';
import {
  ChipBadge,
  InfoCard,
  KpiGrid,
  GatewayError,
  GatewayLoading,
  StatusBadge,
} from './gateway-atoms';

/** Broker detail — the full gateway record for one broker: health, capabilities, connection, session,
 *  account and the lifecycle event trail. */
export function BrokerDetailView({ id }: { id: string }) {
  const { data, isLoading, isError } = useBrokerDetail(id);
  if (isLoading) return <GatewayLoading rows={8} />;
  if (isError) return <GatewayError />;
  if (!data) return <p className="py-6 text-sm text-muted-foreground">Broker {id} not found.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/broker-gateway/registry"
          className="text-sm underline-offset-2 hover:underline"
        >
          ← Registry
        </Link>
        <span className="font-mono text-sm">{data.id}</span>
        <span className="font-medium">{data.name}</span>
        <ChipBadge chip={data.status} />
        <ChipBadge chip={data.health} />
        <ChipBadge chip={data.environment} />
        <span className="text-sm text-muted-foreground">
          {data.provider} · {data.region}
        </span>
      </div>
      <KpiGrid kpis={data.kpis} />

      {data.permittedActions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Permitted actions:</span>
          {data.permittedActions.map((a) => (
            <ChipBadge key={a.label} chip={a} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="Facts">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {data.meta.map((row) => (
              <div key={row.label}>
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="break-all font-mono text-xs">{row.value}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>
        <InfoCard title="Health checks">
          <ul className="space-y-2">
            {data.checks.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.detail}</span>
                </span>
                <ChipBadge chip={c.level} />
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <InfoCard title="Capabilities">
        <div className="flex flex-wrap gap-2">
          {data.capabilities.map((c) => (
            <StatusBadge key={c.type} label={c.label} tone={c.enabled ? 'positive' : 'neutral'} />
          ))}
        </div>
      </InfoCard>

      {data.account ? (
        <InfoCard
          title={`Account · ${data.account.accountRef}`}
          action={
            <span className="text-xs text-muted-foreground">synced {data.account.syncedLabel}</span>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{data.account.type}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gross exposure</dt>
              <dd className="font-mono">{data.account.grossExposure}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Balance</dt>
              <dd className="font-mono">{data.account.totalBalance}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Open orders</dt>
              <dd className="font-mono">{data.account.openOrders}</dd>
            </div>
          </div>
        </InfoCard>
      ) : null}

      <InfoCard title="Lifecycle events">
        <ul className="space-y-2">
          {data.events.map((e) => (
            <li
              key={e.id}
              className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0"
            >
              <span>
                <span className="font-medium">{e.type}</span>
                <span className="block text-xs text-muted-foreground">{e.message}</span>
              </span>
              <span className="text-right">
                <span className="font-mono text-xs text-muted-foreground">{e.atLabel}</span>
                {e.status ? (
                  <span className="ml-2">
                    <ChipBadge chip={e.status} />
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </InfoCard>
    </div>
  );
}
