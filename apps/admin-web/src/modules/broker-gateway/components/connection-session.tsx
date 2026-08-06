'use client';

import { useConnections, useSessions, useGatewaySession } from '../hooks/use-gateway';
import {
  ChipBadge,
  InfoCard,
  StatCard,
  GatewayEmpty,
  GatewayLoading,
  StatusBadge,
} from './gateway-atoms';

/** Connection Manager — transport connection state and permitted lifecycle actions per broker. */
export function ConnectionManager() {
  const { data, isLoading } = useConnections();
  if (isLoading || !data) return <GatewayLoading rows={8} />;
  return (
    <InfoCard title="Connections">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Broker</th>
              <th className="px-3 py-1.5 text-left font-medium">Transport</th>
              <th className="px-3 py-1.5 text-left font-medium">Status</th>
              <th className="px-3 py-1.5 text-left font-medium">Endpoint</th>
              <th className="px-3 py-1.5 text-right font-medium">Latency</th>
              <th className="px-3 py-1.5 text-right font-medium">Reconnects</th>
              <th className="px-3 py-1.5 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.brokerId} className="border-t hover:bg-accent/40">
                <td className="px-3 py-1 font-medium">{row.name}</td>
                <td className="px-3 py-1 text-xs">{row.transport}</td>
                <td className="px-3 py-1">
                  <ChipBadge chip={row.status} />
                </td>
                <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                  {row.endpointRef}
                </td>
                <td className="px-3 py-1 text-right font-mono">{row.latency}</td>
                <td className="px-3 py-1 text-right font-mono">{row.reconnects}</td>
                <td className="px-3 py-1">
                  <div className="flex flex-wrap gap-1">
                    {row.actions.length ? (
                      row.actions.map((a) => <ChipBadge key={a.label} chip={a} />)
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}

/** Session Manager — the gateway session summary and the per-broker provider sessions. */
export function SessionManager() {
  const sessions = useSessions();
  const gateway = useGatewaySession();
  if (sessions.isLoading || !sessions.data || gateway.isLoading || !gateway.data)
    return <GatewayLoading rows={8} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Gateway session" value={gateway.data.id} />
        <StatCard label="Brokers" value={gateway.data.brokerCount} />
        <StatCard label="Connected" value={gateway.data.connectedCount} tone="info" />
        <StatCard label="Healthy" value={gateway.data.healthyCount} tone="positive" />
      </div>
      <InfoCard title="Broker sessions">
        {sessions.data.length === 0 ? (
          <GatewayEmpty label="No open sessions." />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">Session</th>
                  <th className="px-3 py-1.5 text-left font-medium">Broker</th>
                  <th className="px-3 py-1.5 text-left font-medium">Provider</th>
                  <th className="px-3 py-1.5 text-left font-medium">State</th>
                  <th className="px-3 py-1.5 text-left font-medium">Token</th>
                  <th className="px-3 py-1.5 text-left font-medium">Opened</th>
                  <th className="px-3 py-1.5 text-left font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {sessions.data.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-accent/40">
                    <td className="px-3 py-1 font-mono text-xs">{row.id}</td>
                    <td className="px-3 py-1 font-medium">{row.brokerName}</td>
                    <td className="px-3 py-1">{row.provider}</td>
                    <td className="px-3 py-1">
                      <StatusBadge label={row.state.label} tone={row.state.tone} />
                    </td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {row.tokenRef}
                    </td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {row.openedLabel}
                    </td>
                    <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                      {row.lastActivityLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </InfoCard>
    </div>
  );
}
