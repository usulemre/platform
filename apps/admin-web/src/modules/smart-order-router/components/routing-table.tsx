import Link from 'next/link';
import type { RoutingRowVm } from '../domain/view-model';
import { SorEmpty, StatusBadge } from './sor-atoms';

/** The reusable routing table. Rows link to the routing detail. */
export function RoutingTable({
  rows,
  emptyLabel = 'No routings.',
}: {
  rows: readonly RoutingRowVm[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <SorEmpty label={emptyLabel} />;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Client ID</th>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Side</th>
            <th className="px-3 py-1.5 text-right font-medium">Qty</th>
            <th className="px-3 py-1.5 text-left font-medium">Asset</th>
            <th className="px-3 py-1.5 text-left font-medium">Venue</th>
            <th className="px-3 py-1.5 text-left font-medium">Mode</th>
            <th className="px-3 py-1.5 text-left font-medium">Status</th>
            <th className="px-3 py-1.5 text-left font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-accent/40">
              <td className="px-3 py-1 font-mono text-xs">
                <Link
                  href={`/smart-order-router/${row.id}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {row.clientOrderId}
                </Link>
              </td>
              <td className="px-3 py-1 font-medium">{row.symbol}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.side.label} tone={row.side.tone} />
              </td>
              <td className="px-3 py-1 text-right font-mono">{row.quantity}</td>
              <td className="px-3 py-1 text-xs text-muted-foreground">{row.assetClass}</td>
              <td className="px-3 py-1">{row.venue}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.mode.label} tone={row.mode.tone} />
              </td>
              <td className="px-3 py-1">
                <StatusBadge label={row.status.label} tone={row.status.tone} />
              </td>
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                {row.updatedLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
