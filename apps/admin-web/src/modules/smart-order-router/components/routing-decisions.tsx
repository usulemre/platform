'use client';

import Link from 'next/link';
import { useSorDecisions } from '../hooks/use-sor';
import { InfoCard, SorEmpty, SorError, SorLoading, StatusBadge } from './sor-atoms';

/** Routing Decisions — the recorded routing decisions across all routings. */
export function RoutingDecisions() {
  const { data, isLoading, isError, refetch } = useSorDecisions();
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <InfoCard
      title="Routing decisions"
      action={<span className="text-xs text-muted-foreground">{rows.length} decisions</span>}
    >
      {rows.length === 0 ? (
        <SorEmpty label="No decisions yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Client ID</th>
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-left font-medium">Policy</th>
                <th className="px-3 py-1.5 text-left font-medium">Selected venue</th>
                <th className="px-3 py-1.5 text-left font-medium">Fallback</th>
                <th className="px-3 py-1.5 text-right font-medium">Feasible</th>
                <th className="px-3 py-1.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.routingId} className="border-t">
                  <td className="px-3 py-1 font-mono text-xs">
                    <Link
                      href={`/smart-order-router/${row.routingId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.clientOrderId}
                    </Link>
                  </td>
                  <td className="px-3 py-1 font-medium">{row.symbol}</td>
                  <td className="px-3 py-1 text-muted-foreground">{row.policyType}</td>
                  <td className="px-3 py-1 font-medium">{row.selectedVenue}</td>
                  <td className="px-3 py-1 text-muted-foreground">{row.fallbackVenue}</td>
                  <td className="px-3 py-1 text-right font-mono">{row.feasibleCount}</td>
                  <td className="px-3 py-1">
                    <StatusBadge label={row.status.label} tone={row.status.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InfoCard>
  );
}
