'use client';

import { useConnectivity, useHealth } from '../hooks/use-gateway';
import { ChipBadge, InfoCard, GatewayLoading } from './gateway-atoms';
import { ConnectivityTable } from './broker-tables';

/** Broker Health — per-broker health checks (heartbeat, latency, error rate) with levels. */
export function BrokerHealth() {
  const { data, isLoading } = useHealth();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((broker) => (
        <InfoCard
          key={broker.brokerId}
          title={broker.name}
          action={<ChipBadge chip={broker.health} />}
        >
          <div className="mb-2 text-sm text-muted-foreground">
            Health score <span className="font-mono text-foreground">{broker.score}</span>
          </div>
          <ul className="space-y-2">
            {broker.checks.map((check) => (
              <li key={check.id} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{check.label}</span>
                  <span className="block text-xs text-muted-foreground">{check.detail}</span>
                </span>
                <ChipBadge chip={check.level} />
              </li>
            ))}
          </ul>
        </InfoCard>
      ))}
    </div>
  );
}

/** Connectivity Monitor — the live connection health of every broker, worst first. */
export function ConnectivityMonitor() {
  const { data, isLoading } = useConnectivity();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      <InfoCard title="Connectivity monitor">
        <p className="mb-3 text-sm text-muted-foreground">
          Every broker&apos;s connection health, sorted with the lowest score first. Health is a
          deterministic function of heartbeat freshness, latency and error rate.
        </p>
        <ConnectivityTable rows={data} />
      </InfoCard>
    </div>
  );
}
