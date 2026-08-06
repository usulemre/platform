import Link from 'next/link';
import type { BrokerRowVm, ConnectivityRowVm } from '../domain/view-model';
import { ChipBadge, GatewayEmpty, ToneText } from './gateway-atoms';

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-1.5 font-medium ${right ? 'text-right' : 'text-left'}`}>{children}</th>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function BrokerTable({
  rows,
  hrefBase = '/broker-gateway/brokers',
  emptyLabel = 'No brokers.',
}: {
  rows: readonly BrokerRowVm[];
  hrefBase?: string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <GatewayEmpty label={emptyLabel} />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Broker</Th>
          <Th>Provider</Th>
          <Th>Transport</Th>
          <Th>Env</Th>
          <Th>Region</Th>
          <Th>Status</Th>
          <Th>Health</Th>
          <Th right>Score</Th>
          <Th right>Latency</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1">
              <Link
                href={`${hrefBase}/${row.id}`}
                className="font-medium underline-offset-2 hover:underline"
              >
                {row.name}
              </Link>
              <span className="ml-2 font-mono text-xs text-muted-foreground">{row.id}</span>
            </td>
            <td className="px-3 py-1">{row.provider}</td>
            <td className="px-3 py-1 text-xs">{row.transport}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.environment} />
            </td>
            <td className="px-3 py-1 text-xs text-muted-foreground">{row.region}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.status} />
            </td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.health} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.score}</td>
            <td className="px-3 py-1 text-right font-mono">{row.latency}</td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}

export function ConnectivityTable({ rows }: { rows: readonly ConnectivityRowVm[] }) {
  if (rows.length === 0) return <GatewayEmpty label="No brokers." />;
  return (
    <Shell>
      <thead className="bg-muted/50">
        <tr>
          <Th>Broker</Th>
          <Th>Provider</Th>
          <Th>Status</Th>
          <Th>Health</Th>
          <Th right>Score</Th>
          <Th right>Latency</Th>
          <Th right>Error rate</Th>
          <Th right>Reconnects</Th>
          <Th>Last heartbeat</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.brokerId} className="border-t hover:bg-accent/40">
            <td className="px-3 py-1 font-medium">{row.name}</td>
            <td className="px-3 py-1">{row.provider}</td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.status} />
            </td>
            <td className="px-3 py-1">
              <ChipBadge chip={row.health} />
            </td>
            <td className="px-3 py-1 text-right">
              <ToneText value={row.score} tone={row.health.tone} />
            </td>
            <td className="px-3 py-1 text-right font-mono">{row.latency}</td>
            <td className="px-3 py-1 text-right font-mono">{row.errorRate}</td>
            <td className="px-3 py-1 text-right font-mono">{row.reconnects}</td>
            <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
              {row.lastHeartbeatLabel}
            </td>
          </tr>
        ))}
      </tbody>
    </Shell>
  );
}
