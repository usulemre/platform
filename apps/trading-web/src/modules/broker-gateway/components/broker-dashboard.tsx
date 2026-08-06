'use client';

import Link from 'next/link';
import { useBrokers, useGatewaySummary, useConnectivity } from '../hooks/use-gateway';
import { EngineNotice, InfoCard, KpiGrid, GatewayLoading, StatusBadge } from './gateway-atoms';
import { BrokerTable, ConnectivityTable } from './broker-tables';

const SECTIONS: readonly {
  readonly href: string;
  readonly label: string;
  readonly hint: string;
}[] = [
  {
    href: '/broker-gateway/registry',
    label: 'Broker registry',
    hint: 'Registered brokers & providers',
  },
  { href: '/broker-gateway/health', label: 'Broker health', hint: 'Per-broker health checks' },
  {
    href: '/broker-gateway/connectivity',
    label: 'Connectivity monitor',
    hint: 'Live connection health',
  },
  {
    href: '/broker-gateway/capabilities',
    label: 'Capability explorer',
    hint: 'Provider × capability matrix',
  },
  {
    href: '/broker-gateway/accounts',
    label: 'Account manager',
    hint: 'Positions, balances, orders',
  },
  { href: '/broker-gateway/metrics', label: 'Gateway metrics', hint: 'Fleet-level metrics' },
];

function Summary() {
  const { data, isLoading } = useGatewaySummary();
  if (isLoading || !data) return <GatewayLoading rows={2} />;
  return (
    <div className="space-y-4">
      <KpiGrid kpis={data.kpis} />
      {data.byStatus.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {data.byStatus.map((bucket) => (
            <span key={bucket.label} className="inline-flex items-center gap-1">
              <StatusBadge label={bucket.label} tone={bucket.tone} />
              <span className="text-sm text-muted-foreground">{bucket.count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Brokers() {
  const { data, isLoading } = useBrokers({ sortBy: 'healthScore', sortDir: 'desc' });
  if (isLoading || !data) return <GatewayLoading />;
  return (
    <InfoCard
      title="Brokers"
      action={
        <Link
          href="/broker-gateway/registry"
          className="text-sm underline-offset-2 hover:underline"
        >
          Open registry
        </Link>
      }
    >
      <BrokerTable rows={data} />
    </InfoCard>
  );
}

function Connectivity() {
  const { data, isLoading } = useConnectivity();
  if (isLoading || !data) return <GatewayLoading rows={4} />;
  return (
    <InfoCard
      title="Connectivity"
      action={
        <Link
          href="/broker-gateway/connectivity"
          className="text-sm underline-offset-2 hover:underline"
        >
          Open monitor
        </Link>
      }
    >
      <ConnectivityTable rows={data.slice(0, 6)} />
    </InfoCard>
  );
}

/** Broker Dashboard — the gateway landing view: KPIs, brokers, connectivity and section links. */
export function BrokerDashboard() {
  return (
    <div className="space-y-4">
      <EngineNotice />
      <Summary />
      <div className="grid gap-4 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <InfoCard key={section.href} title={section.label}>
            <p className="text-sm text-muted-foreground">{section.hint}</p>
            <Link
              href={section.href}
              className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              Open {section.label.toLowerCase()}
            </Link>
          </InfoCard>
        ))}
      </div>
      <Brokers />
      <Connectivity />
    </div>
  );
}
