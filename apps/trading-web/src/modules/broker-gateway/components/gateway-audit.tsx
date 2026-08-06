'use client';

import Link from 'next/link';
import { useAudit } from '../hooks/use-gateway';
import { InfoCard, GatewayEmpty, GatewayLoading } from './gateway-atoms';

/** Gateway Audit — the tamper-evident lifecycle audit trail across all brokers. */
export function GatewayAudit() {
  const { data, isLoading } = useAudit();
  if (isLoading || !data) return <GatewayLoading rows={10} />;
  return (
    <InfoCard title="Gateway audit trail">
      {data.length === 0 ? (
        <GatewayEmpty label="No audit entries." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Time</th>
                <th className="px-3 py-1.5 text-left font-medium">Broker</th>
                <th className="px-3 py-1.5 text-left font-medium">Actor</th>
                <th className="px-3 py-1.5 text-left font-medium">Action</th>
                <th className="px-3 py-1.5 text-left font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-t hover:bg-accent/40">
                  <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {row.atLabel}
                  </td>
                  <td className="px-3 py-1">
                    <Link
                      href={`/broker-gateway/brokers/${row.brokerId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.brokerName}
                    </Link>
                  </td>
                  <td className="px-3 py-1">{row.actor}</td>
                  <td className="px-3 py-1 font-medium">{row.action}</td>
                  <td className="px-3 py-1 text-xs text-muted-foreground">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}
